"""Simulated IoT sensor engine + virtual pump. No hardware involved."""
import math, random, threading, time
import database as db
import irrigation

PUMP_RATE = 1.2     # % soil moisture added per tick while pump is ON
FLOW_LPS = 0.05     # simulated pump flow, litres per second (3 L/min)
NEED = {"Low": 0.5, "Medium": 1.0, "High": 1.5}   # plant water-consumption multiplier

def clamp(v, lo, hi): return max(lo, min(hi, v))

def classify(m, p, pumping):
    if pumping: return "Irrigation Active", "Being watered"
    if m < p["min_moisture"]: return "Dry Soil", "Needs water"
    if m > p["max_moisture"]: return "High Moisture", "Overwatered risk"
    return "Optimal Moisture", "Healthy"

class Simulator:
    def __init__(self):
        self.lock = threading.RLock()
        self.running = False
        self.moisture, self.temperature, self.humidity = 50.0, 29.0, 60.0
        self.pump_on, self.pump_mode, self.session = False, None, None
        self.last_update, self.zone, self.plant = None, None, None

    # ---------- lifecycle ----------
    def start(self):
        with self.lock:
            self.reload_plant(first=True)
            self.running = True
        threading.Thread(target=self._loop, daemon=True).start()

    def _loop(self):
        while True:
            try: self.tick()
            except Exception as e: print("tick error:", e)
            time.sleep(db.get_settings()["interval_sec"])

    def reload_plant(self, first=False):
        pid = db.get_settings()["selected_plant_id"]
        p = db.q("SELECT * FROM plants WHERE id=?", (pid,), one=True) or db.q("SELECT * FROM plants ORDER BY id LIMIT 1", one=True)
        self.plant = p
        if p and p["id"] != pid: db.set_settings({"selected_plant_id": p["id"]})
        if first and p: self.moisture = p["last_moisture"]
        self.apply_control()

    def set_plant(self, pid):
        with self.lock:
            if self.pump_on: self._stop("plant changed")
            if self.plant: db.x("UPDATE plants SET last_moisture=? WHERE id=?", (self.moisture, self.plant["id"]))
            db.set_settings({"selected_plant_id": pid, "manual_mode": False, "manual_pump": False})
            self.plant = db.q("SELECT * FROM plants WHERE id=?", (pid,), one=True)
            self.moisture, self.zone = self.plant["last_moisture"], None

    def pause(self):
        with self.lock:
            if self.running:
                if self.pump_on: self._stop("simulation paused")
                self.running = False
                db.notify("warning", "Simulation paused. Pump disabled.")

    def resume(self):
        with self.lock:
            if not self.running:
                self.running = True
                db.notify("success", "Sensor simulation resumed.")

    def reset(self):
        with self.lock:
            if self.pump_on: self._stop("simulation reset")
            s = db.get_settings()
            p = self.plant
            self.moisture = (p["min_moisture"] + p["max_moisture"]) / 2 if p else 50.0
            self.temperature, self.humidity = (s["temp_min"] + s["temp_max"]) / 2, (s["hum_min"] + s["hum_max"]) / 2
            self.zone = None
            db.x("DELETE FROM sensor_readings")
            db.notify("info", "Simulation reset to initial conditions.")

    def set_moisture(self, v):
        with self.lock:
            self.moisture = clamp(float(v), 0, 100)
            self.apply_control()

    # ---------- simulation step ----------
    def tick(self):
        with self.lock:
            if not self.running or not self.plant: return
            s = db.get_settings()
            self._environment(s)
            # Evaporation grows with heat and dryness of air; thirsty plants consume more.
            evap = (0.10 + 0.01 * max(self.temperature - 20, 0) + 0.002 * (100 - self.humidity)) * NEED.get(self.plant["water_need"], 1)
            self.moisture -= evap
            self.apply_control(s)
            if self.pump_on: self.moisture += PUMP_RATE      # virtual pump raises moisture gradually
            self.moisture = clamp(self.moisture, 0, 100)
            self._check_zone()
            self.last_update = db.now()
            db.x("INSERT INTO sensor_readings(plant_id,moisture,temperature,humidity,pump_on,created_at) VALUES(?,?,?,?,?,?)",
                 (self.plant["id"], round(self.moisture, 2), round(self.temperature, 2), round(self.humidity, 2), int(self.pump_on), self.last_update))
            db.x("UPDATE plants SET last_moisture=? WHERE id=?", (self.moisture, self.plant["id"]))

    def _environment(self, s):
        """Gradual random walk with mean reversion; humidity moves inversely to temperature."""
        tmid, hmid = (s["temp_min"] + s["temp_max"]) / 2, (s["hum_min"] + s["hum_max"]) / 2
        t = self.temperature + (tmid - self.temperature) * 0.03 + math.sin(time.time() / 90) * 0.08 + random.gauss(0, 0.12)
        t = clamp(t, s["temp_min"], s["temp_max"])
        h = self.humidity + (hmid - self.humidity) * 0.03 - 0.8 * (t - self.temperature) + random.gauss(0, 0.3)
        self.temperature, self.humidity = t, clamp(h, s["hum_min"], s["hum_max"])

    def apply_control(self, s=None):
        """Run pump decision now. The pump can never run while the simulation is paused."""
        with self.lock:
            s = s or db.get_settings()
            want, mode = (False, None)
            if self.running and self.plant:
                want, mode = irrigation.decide(self.moisture, self.plant, s, self.pump_on)
            if want and not self.pump_on: self._start(mode)
            elif not want and self.pump_on: self._stop("target reached" if mode == "Automatic" else "pump switched off")

    def _start(self, mode):
        self.pump_on, self.pump_mode = True, mode
        self.session = {"start_time": db.now(), "t0": time.time(), "start_moisture": round(self.moisture, 1)}
        db.notify("success", f"{mode} irrigation started for {self.plant['name']} (moisture {self.moisture:.0f}%).")

    def _stop(self, reason):
        sess, dur = self.session, time.time() - self.session["t0"]
        db.x("INSERT INTO irrigation_history(plant_id,plant_name,start_time,end_time,start_moisture,end_moisture,duration_sec,mode,water_litres)"
             " VALUES(?,?,?,?,?,?,?,?,?)", (self.plant["id"], self.plant["name"], sess["start_time"], db.now(), sess["start_moisture"],
              round(self.moisture, 1), round(dur, 1), self.pump_mode, round(dur * FLOW_LPS, 2)))
        db.notify("info", f"{self.pump_mode} irrigation stopped for {self.plant['name']} ({reason}, moisture {self.moisture:.0f}%).")
        self.pump_on, self.session = False, None

    def _check_zone(self):
        p, m = self.plant, self.moisture
        z = "dry" if m < p["min_moisture"] else "high" if m > p["max_moisture"] else "ok"
        if z != self.zone and z != "ok":
            db.notify("warning", f"Soil moisture {'below' if z == 'dry' else 'above'} the {'minimum' if z == 'dry' else 'maximum'} for {p['name']} ({m:.0f}%).")
        self.zone = z

    def state(self):
        with self.lock:
            p, m = self.plant, round(self.moisture, 1)
            status, health = classify(m, p, self.pump_on) if p else ("No plant", "-")
            sess = None
            if self.session:
                sess = {**self.session, "elapsed": round(time.time() - self.session["t0"], 1), "mode": self.pump_mode}
                sess.pop("t0")
            return {"running": self.running, "moisture": m, "temperature": round(self.temperature, 1),
                    "humidity": round(self.humidity, 1), "pump_on": self.pump_on, "pump_mode": self.pump_mode,
                    "status": status, "health": health, "session": sess, "last_update": self.last_update,
                    "plant_id": p["id"] if p else None}

sim = Simulator()

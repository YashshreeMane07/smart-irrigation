"""Flask REST API for the Smart Irrigation System (simulated IoT data)."""
import csv, io, sqlite3
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import database as db
from simulator import sim, classify

app = Flask(__name__)
CORS(app)

def err(msg, code=400): return jsonify({"error": msg}), code
@app.errorhandler(ValueError)
def _v(e): return err(str(e), 400)
@app.errorhandler(404)
def _404(e): return err("Resource not found", 404)
@app.errorhandler(405)
def _405(e): return err("Method not allowed", 405)
@app.errorhandler(500)
def _500(e): return err("Internal server error", 500)

def body():
    d = request.get_json(silent=True)
    if not isinstance(d, dict): raise ValueError("Request body must be a JSON object")
    return d

def fmt(dt): return dt.isoformat(sep=" ", timespec="seconds")
def range_start(r):
    n = datetime.now()
    opts = {"today": n.replace(hour=0, minute=0, second=0, microsecond=0), "7d": n - timedelta(days=7), "30d": n - timedelta(days=30)}
    if r not in opts: raise ValueError("range must be today, 7d or 30d")
    return fmt(opts[r])

# ---------------- plants ----------------
def plant_view(p):
    sel = bool(sim.plant) and p["id"] == sim.plant["id"]
    m = sim.moisture if sel else p["last_moisture"]
    p["current_moisture"], p["selected"] = round(m, 1), sel
    p["status"] = classify(m, p, sel and sim.pump_on)[0]
    return p

def clean_plant(d, base=None):
    p = dict(base or {"emoji": "🌱", "water_need": "Medium", "description": ""})
    for k in ("name", "emoji", "water_need", "description"):
        if k in d: p[k] = str(d[k]).strip()
    for k in ("min_moisture", "max_moisture", "target_moisture"):
        if k in d:
            try: p[k] = float(d[k])
            except (TypeError, ValueError): raise ValueError(f"{k} must be a number")
    if not p.get("name"): raise ValueError("Plant name is required")
    if p["water_need"] not in ("Low", "Medium", "High"): raise ValueError("water_need must be Low, Medium or High")
    if "min_moisture" not in p or "max_moisture" not in p: raise ValueError("min_moisture and max_moisture are required")
    p.setdefault("target_moisture", (p["min_moisture"] + p["max_moisture"]) / 2)
    if not 0 <= p["min_moisture"] < p["max_moisture"] <= 100: raise ValueError("Thresholds must satisfy 0 <= min < max <= 100")
    if not p["min_moisture"] <= p["target_moisture"] <= p["max_moisture"]: raise ValueError("Target moisture must be between min and max")
    return p

@app.get("/api/plants")
def plants_list():
    return jsonify([plant_view(p) for p in db.q("SELECT * FROM plants ORDER BY id")])

@app.post("/api/plants")
def plants_add():
    p = clean_plant(body())
    try:
        pid = db.x("INSERT INTO plants(name,emoji,water_need,min_moisture,max_moisture,target_moisture,last_moisture,description,created_at)"
                   " VALUES(?,?,?,?,?,?,?,?,?)", (p["name"], p["emoji"], p["water_need"], p["min_moisture"], p["max_moisture"],
                    p["target_moisture"], p["target_moisture"], p["description"], db.now()))
    except sqlite3.IntegrityError:
        return err("A plant with that name already exists", 409)
    return jsonify(plant_view(db.q("SELECT * FROM plants WHERE id=?", (pid,), one=True))), 201

@app.put("/api/plants/<int:pid>")
def plants_edit(pid):
    old = db.q("SELECT * FROM plants WHERE id=?", (pid,), one=True)
    if not old: return err("Plant not found", 404)
    p = clean_plant(body(), old)
    try:
        db.x("UPDATE plants SET name=?,emoji=?,water_need=?,min_moisture=?,max_moisture=?,target_moisture=?,description=? WHERE id=?",
             (p["name"], p["emoji"], p["water_need"], p["min_moisture"], p["max_moisture"], p["target_moisture"], p["description"], pid))
    except sqlite3.IntegrityError:
        return err("A plant with that name already exists", 409)
    if sim.plant and sim.plant["id"] == pid: sim.reload_plant()
    return jsonify(plant_view(db.q("SELECT * FROM plants WHERE id=?", (pid,), one=True)))

@app.delete("/api/plants/<int:pid>")
def plants_del(pid):
    if not db.q("SELECT 1 FROM plants WHERE id=?", (pid,), one=True): return err("Plant not found", 404)
    others = db.q("SELECT id FROM plants WHERE id<>? ORDER BY id", (pid,))
    if not others: return err("At least one plant must remain", 409)
    if sim.plant and sim.plant["id"] == pid: sim.set_plant(others[0]["id"])
    db.x("DELETE FROM plants WHERE id=?", (pid,))
    return jsonify({"deleted": pid})

# ---------------- sensors & simulation ----------------
@app.get("/api/sensors/current")
def sensors_current(): return jsonify(sim.state())

@app.get("/api/sensors/history")
def sensors_history():
    limit = min(max(request.args.get("limit", 100, type=int), 1), 2000)
    rng = request.args.get("range")
    sql, args = "SELECT id,plant_id,moisture,temperature,humidity,pump_on,created_at FROM sensor_readings", []
    if rng: sql += " WHERE created_at>=?"; args.append(range_start(rng))
    rows = db.q(sql + " ORDER BY id DESC LIMIT ?", (*args, limit))
    return jsonify(rows[::-1])

@app.post("/api/simulation/start")
def sim_start(): sim.resume(); return jsonify(sim.state())
@app.post("/api/simulation/pause")
def sim_pause(): sim.pause(); return jsonify(sim.state())
@app.post("/api/simulation/reset")
def sim_reset(): sim.reset(); return jsonify(sim.state())

@app.post("/api/simulation/moisture")
def sim_moisture():
    """Demo helper: force soil moisture (e.g. simulate a dry spell)."""
    try: v = float(body().get("value"))
    except (TypeError, ValueError): raise ValueError("value must be a number between 0 and 100")
    if not 0 <= v <= 100: raise ValueError("value must be between 0 and 100")
    sim.set_moisture(v)
    return jsonify(sim.state())

# ---------------- dashboard ----------------
def last_session():
    return db.q("SELECT * FROM irrigation_history ORDER BY id DESC LIMIT 1", one=True)

@app.get("/api/dashboard")
def dashboard():
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    t = db.q("SELECT COALESCE(SUM(water_litres),0) w, COUNT(*) n FROM irrigation_history WHERE start_time>=?", (fmt(today),), one=True)
    avg = db.q("SELECT AVG(moisture) a FROM (SELECT moisture FROM sensor_readings ORDER BY id DESC LIMIT 50)", one=True)["a"]
    readings = db.q("SELECT substr(created_at,12,8) t, moisture, temperature, humidity FROM sensor_readings ORDER BY id DESC LIMIT 60")[::-1]
    water = db.q("SELECT substr(start_time,1,10) day, ROUND(SUM(water_litres),2) litres FROM irrigation_history WHERE start_time>=? GROUP BY day ORDER BY day",
                 (fmt(today - timedelta(days=6)),))
    return jsonify({"total_plants": db.q("SELECT COUNT(*) n FROM plants", one=True)["n"],
                    "avg_moisture": round(avg, 1) if avg is not None else round(sim.moisture, 1),
                    "water_today": round(t["w"], 2), "sessions_today": t["n"], "state": sim.state(),
                    "plant": plant_view(dict(sim.plant)) if sim.plant else None, "last_irrigation": last_session(),
                    "readings": readings, "water_history": water})

# ---------------- irrigation ----------------
@app.get("/api/irrigation/status")
def irr_status():
    return jsonify({"state": sim.state(), "settings": db.get_settings(), "plant": plant_view(dict(sim.plant)) if sim.plant else None,
                    "total_sessions": db.q("SELECT COUNT(*) n FROM irrigation_history", one=True)["n"], "last_session": last_session()})

@app.post("/api/irrigation/auto")
def irr_auto():
    d = body()
    if "enabled" not in d: raise ValueError("'enabled' (true/false) is required")
    db.set_settings({"auto_irrigation": d["enabled"]})
    sim.apply_control()
    return jsonify(sim.state())

@app.post("/api/irrigation/manual")
def irr_manual():
    """manual_mode=true hands control to the manual pump switch (pump_on); false returns to automatic."""
    d = body()
    mode, pump = bool(d.get("manual_mode", True)), bool(d.get("pump_on", False))
    if mode and pump and not sim.running: return err("Cannot run the pump while the simulation is paused", 409)
    db.set_settings({"manual_mode": mode, "manual_pump": mode and pump})
    sim.apply_control()
    return jsonify(sim.state())

@app.get("/api/irrigation/history")
def irr_history():
    sql, args = "SELECT * FROM irrigation_history WHERE 1=1", []
    if request.args.get("q"): sql += " AND plant_name LIKE ?"; args.append(f"%{request.args['q']}%")
    if request.args.get("mode"): sql += " AND mode=?"; args.append(request.args["mode"])
    return jsonify(db.q(sql + " ORDER BY id DESC LIMIT 500", args))

# ---------------- analytics & report ----------------
@app.get("/api/analytics")
def analytics():
    r = request.args.get("range", "7d"); since = range_start(r)
    bucket = "%Y-%m-%d %H:00" if r == "today" else "%Y-%m-%d"
    series = db.q("SELECT strftime(?,created_at) bucket, ROUND(AVG(moisture),1) moisture, ROUND(AVG(temperature),1) temperature,"
                  " ROUND(AVG(humidity),1) humidity FROM sensor_readings WHERE created_at>=? GROUP BY bucket ORDER BY bucket", (bucket, since))
    tot = db.q("SELECT COUNT(*) sessions, COALESCE(ROUND(SUM(water_litres),2),0) litres FROM irrigation_history WHERE start_time>=?", (since,), one=True)
    avg = db.q("SELECT ROUND(AVG(moisture),1) m, ROUND(AVG(temperature),1) t, ROUND(AVG(humidity),1) h FROM sensor_readings WHERE created_at>=?", (since,), one=True)
    per_plant = db.q("SELECT plant_name, COUNT(*) sessions, ROUND(SUM(water_litres),2) litres, ROUND(AVG(duration_sec),1) avg_duration"
                     " FROM irrigation_history WHERE start_time>=? GROUP BY plant_name ORDER BY litres DESC", (since,))
    return jsonify({"range": r, "series": series, "total_water": tot["litres"], "irrigation_count": tot["sessions"],
                    "avg_moisture": avg["m"], "avg_temperature": avg["t"], "avg_humidity": avg["h"], "per_plant": per_plant})

@app.get("/api/report/csv")
def report_csv():
    since = range_start(request.args.get("range", "7d"))
    out = io.StringIO(); w = csv.writer(out)
    w.writerow(["SENSOR READINGS (simulated)"]); w.writerow(["time", "plant_id", "moisture_%", "temperature_C", "humidity_%", "pump_on"])
    for r in db.q("SELECT * FROM sensor_readings WHERE created_at>=? ORDER BY id", (since,)):
        w.writerow([r["created_at"], r["plant_id"], r["moisture"], r["temperature"], r["humidity"], r["pump_on"]])
    w.writerow([]); w.writerow(["IRRIGATION HISTORY"])
    w.writerow(["plant", "start", "end", "start_moisture", "end_moisture", "duration_sec", "mode", "water_litres"])
    for r in db.q("SELECT * FROM irrigation_history WHERE start_time>=? ORDER BY id", (since,)):
        w.writerow([r["plant_name"], r["start_time"], r["end_time"], r["start_moisture"], r["end_moisture"], r["duration_sec"], r["mode"], r["water_litres"]])
    return Response(out.getvalue(), mimetype="text/csv", headers={"Content-Disposition": "attachment; filename=irrigation_report.csv"})

# ---------------- notifications & settings ----------------
@app.get("/api/notifications")
def notes():
    items = db.q("SELECT * FROM notifications ORDER BY id DESC LIMIT 50")
    return jsonify({"items": items, "unread": db.q("SELECT COUNT(*) n FROM notifications WHERE is_read=0", one=True)["n"]})

@app.post("/api/notifications/read")
def notes_read():
    db.x("UPDATE notifications SET is_read=1"); return jsonify({"ok": True})

@app.get("/api/settings")
def settings_get(): return jsonify(db.get_settings())

@app.put("/api/settings")
def settings_put():
    d = body()
    if "selected_plant_id" in d:
        try: pid = int(d.pop("selected_plant_id"))
        except (TypeError, ValueError): raise ValueError("selected_plant_id must be an integer")
        if not db.q("SELECT 1 FROM plants WHERE id=?", (pid,), one=True): return err("Plant not found", 404)
        sim.set_plant(pid)
    if d: db.set_settings(d)
    sim.apply_control()
    return jsonify(db.get_settings())

if __name__ == "__main__":
    db.init_db()
    sim.start()
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)

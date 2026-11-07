"""SQLite layer: schema, seed data, typed settings, notification helper."""
import os, sqlite3
from datetime import datetime

DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "irrigation.db")

def now():
    return datetime.now().isoformat(sep=" ", timespec="seconds")

def _conn():
    c = sqlite3.connect(DB, timeout=10, check_same_thread=False)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys=ON")
    return c

def q(sql, args=(), one=False):
    c = _conn()
    try:
        rows = [dict(r) for r in c.execute(sql, args).fetchall()]
    finally:
        c.close()
    return (rows[0] if rows else None) if one else rows

def x(sql, args=()):
    c = _conn()
    try:
        cur = c.execute(sql, args)
        c.commit()
        return cur.lastrowid
    finally:
        c.close()

SCHEMA = """
CREATE TABLE IF NOT EXISTS plants(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
  emoji TEXT DEFAULT '🌱', water_need TEXT NOT NULL DEFAULT 'Medium', min_moisture REAL NOT NULL,
  max_moisture REAL NOT NULL, target_moisture REAL NOT NULL, last_moisture REAL NOT NULL,
  description TEXT DEFAULT '', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sensor_readings(id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL, moisture REAL, temperature REAL,
  humidity REAL, pump_on INTEGER, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_sr_time ON sensor_readings(created_at);
CREATE TABLE IF NOT EXISTS irrigation_history(id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL, plant_name TEXT, start_time TEXT,
  end_time TEXT, start_moisture REAL, end_moisture REAL, duration_sec REAL, mode TEXT, water_litres REAL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT,
  message TEXT, created_at TEXT NOT NULL, is_read INTEGER DEFAULT 0);
"""

# Illustrative demo thresholds only - real needs depend on soil, climate and growing conditions.
# (name, emoji, need, min, max, target, description)
PLANTS = [
    ("Tomato", "🍅", "High", 40, 60, 50, "Fruiting vegetable; likes steady moisture."),
    ("Rose", "🌹", "Medium", 40, 60, 50, "Prefers evenly moist, well-drained soil."),
    ("Tulsi", "🌿", "Medium", 35, 55, 45, "Holy basil; tolerates short dry spells."),
    ("Cactus", "🌵", "Low", 10, 25, 18, "Desert plant; water sparingly."),
    ("Aloe Vera", "🪴", "Low", 15, 30, 22, "Succulent; soil should dry between waterings."),
    ("Money Plant", "🍃", "Medium", 40, 60, 50, "Hardy indoor vine."),
    ("Rice", "🌾", "High", 70, 90, 80, "Semi-aquatic crop; needs saturated soil."),
    ("Sunflower", "🌻", "Medium", 35, 55, 45, "Deep-rooted; moderate watering."),
    ("Mint", "🌱", "High", 55, 75, 65, "Thrives in consistently moist soil."),
    ("Hibiscus", "🌺", "Medium", 45, 65, 55, "Flowering shrub; keep soil lightly moist."),
]

# key: (type, default, min, max)
SETTINGS = {
    "auto_irrigation": (bool, True, None, None),
    "manual_mode": (bool, False, None, None),
    "manual_pump": (bool, False, None, None),
    "selected_plant_id": (int, 1, 1, None),
    "temp_min": (float, 24, 0, 60), "temp_max": (float, 36, 0, 60),
    "hum_min": (float, 40, 0, 100), "hum_max": (float, 80, 0, 100),
    "interval_sec": (float, 2, 0.5, 30),
}

def init_db():
    c = _conn()
    c.executescript(SCHEMA)
    if not c.execute("SELECT 1 FROM plants LIMIT 1").fetchone():
        for n, e, w, lo, hi, t, d in PLANTS:
            c.execute("INSERT INTO plants(name,emoji,water_need,min_moisture,max_moisture,target_moisture,"
                      "last_moisture,description,created_at) VALUES(?,?,?,?,?,?,?,?,?)", (n, e, w, lo, hi, t, t, d, now()))
    for k, (_, d, _, _) in SETTINGS.items():
        c.execute("INSERT OR IGNORE INTO settings VALUES(?,?)", (k, str(int(d)) if isinstance(d, bool) else str(d)))
    c.commit(); c.close()

def get_settings():
    raw = {r["key"]: r["value"] for r in q("SELECT * FROM settings")}
    out = {}
    for k, (t, d, _, _) in SETTINGS.items():
        v = raw.get(k)
        out[k] = d if v is None else (v == "1" if t is bool else t(float(v)) if t is int else t(v))
    return out

def set_settings(data):
    """Validate and store settings; raises ValueError with a readable message."""
    clean = {}
    for k, v in data.items():
        if k not in SETTINGS:
            raise ValueError(f"Unknown setting '{k}'")
        t, _, lo, hi = SETTINGS[k]
        if t is bool:
            if isinstance(v, str): v = v.lower() in ("1", "true", "yes", "on")
            clean[k] = str(int(bool(v)))
            continue
        try: v = t(v)
        except (TypeError, ValueError): raise ValueError(f"'{k}' must be a number")
        if (lo is not None and v < lo) or (hi is not None and v > hi):
            raise ValueError(f"'{k}' must be between {lo} and {hi}")
        clean[k] = str(v)
    merged = {**get_settings(), **{k: SETTINGS[k][0](float(v)) if SETTINGS[k][0] is not bool else v == "1" for k, v in clean.items()}}
    if merged["temp_min"] >= merged["temp_max"] or merged["hum_min"] >= merged["hum_max"]:
        raise ValueError("Minimum must be lower than maximum for temperature and humidity ranges")
    for k, v in clean.items():
        x("INSERT OR REPLACE INTO settings VALUES(?,?)", (k, v))

def notify(kind, message):
    x("INSERT INTO notifications(type,message,created_at) VALUES(?,?,?)", (kind, message, now()))

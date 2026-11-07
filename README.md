# Smart Irrigation System Using Simulated IoT Sensor Data

Software-only simulation: no Arduino/ESP32/pump required. A Python engine generates gradually changing soil moisture,
temperature and humidity; a virtual pump is switched by automatic (hysteresis) or manual control. Data is stored in SQLite.

## Run locally (VS Code terminals)
**Backend** (Python 3.10+)
```
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py                  # http://127.0.0.1:5000  (creates irrigation.db on first run)
```
**Frontend** (Node 18+), in a second terminal
```
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

## How the logic works
- `simulator.py`: every tick (default 2 s) temperature/humidity random-walk with mean reversion; moisture falls by evaporation
  (hotter + drier air + thirsty plant = faster) and rises 1.2 %/tick while the pump is ON. Time is accelerated for demos.
- `irrigation.py`: pump turns ON below *min*, stays ON until *target*, never runs above *max* (hysteresis). Manual mode overrides auto.
  The pump is always forced OFF when the simulation is paused.
- Each plant keeps its own soil moisture; thresholds shown are illustrative and editable.

## Demo tip
Irrigation Control > "Simulate dry soil" drops moisture so you can watch the pump start, fill to target and stop.

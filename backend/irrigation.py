"""Pump decision logic (pure function, easy to test)."""

def decide(moisture, plant, s, pump_on):
    """Return (pump_should_be_on, mode).

    MANUAL mode overrides everything: the pump follows the manual switch.
    AUTO mode uses HYSTERESIS so the pump doesn't chatter around one threshold:
      * pump OFF -> turn ON only when moisture < min_moisture
      * pump ON  -> keep running until moisture >= target_moisture (target sits between min and max)
      * moisture > max_moisture -> pump is always OFF (overwatering warning raised elsewhere)
    """
    if s["manual_mode"]:
        return (bool(s["manual_pump"]) and moisture < 100), "Manual"
    if not s["auto_irrigation"] or moisture >= plant["max_moisture"]:
        return False, "Automatic"
    if pump_on:
        return moisture < plant["target_moisture"], "Automatic"
    return moisture < plant["min_moisture"], "Automatic"

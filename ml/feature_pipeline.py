#!/usr/bin/env python3
"""
Local feature pipeline placeholder for Buksy ML.
Reads JSON from stdin and returns normalized features to stdout.
"""

import json
import sys


def normalize(payload):
    features = payload.get("features", {}) if isinstance(payload, dict) else {}
    return {
        "duePressure": float(features.get("duePressure", 0.0)),
        "projectPressure": float(features.get("projectPressure", 0.0)),
        "energyMatch": float(features.get("energyMatch", 0.0)),
        "focusMatch": float(features.get("focusMatch", 0.0)),
        "durationFit": float(features.get("durationFit", 0.0)),
        "completionRate": float(features.get("completionRate", 0.0)),
    }


def main():
    raw = sys.stdin.read() or "{}"
    payload = json.loads(raw)
    sys.stdout.write(json.dumps({"ok": True, "features": normalize(payload)}))


if __name__ == "__main__":
    main()

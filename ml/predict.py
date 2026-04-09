#!/usr/bin/env python3
"""
Local inference entrypoint placeholder.
"""

import json
import math
import sys


def sigmoid(x):
    return 1.0 / (1.0 + math.exp(-x))


def main():
    raw = sys.stdin.read() or "{}"
    payload = json.loads(raw)
    features = payload.get("features", {}) if isinstance(payload, dict) else {}
    score = (
        float(features.get("duePressure", 0.0)) * 0.2
        + float(features.get("projectPressure", 0.0)) * 0.15
        + float(features.get("energyMatch", 0.0)) * 0.12
        + float(features.get("focusMatch", 0.0)) * 0.08
        + float(features.get("completionRate", 0.0)) * 0.1
    )
    sys.stdout.write(json.dumps({"ok": True, "score": score, "probability": sigmoid(score)}))


if __name__ == "__main__":
    main()

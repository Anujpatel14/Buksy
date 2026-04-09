#!/usr/bin/env python3
"""
Local training entrypoint placeholder.
Kept lightweight so Buksy can run fully local without extra setup.
"""

import json
import sys
from datetime import datetime


def main():
    raw = sys.stdin.read() or "{}"
    payload = json.loads(raw)
    result = {
        "ok": True,
        "trainedAt": datetime.utcnow().isoformat() + "Z",
        "examples": int(payload.get("examples", 0)),
        "note": "Python local trainer placeholder; JS trainer remains active fallback.",
    }
    sys.stdout.write(json.dumps(result))


if __name__ == "__main__":
    main()

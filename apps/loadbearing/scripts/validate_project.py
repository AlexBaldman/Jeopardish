#!/usr/bin/env python3
"""Static validation that does not require the Godot binary."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

for path in ROOT.rglob("*.json"):
    try:
        json.loads(path.read_text())
    except Exception as exc:
        errors.append(f"invalid JSON: {path.relative_to(ROOT)}: {exc}")

required = [
    "project.godot",
    "src/scenes/main.tscn",
    "src/scenes/main.gd",
    "src/persistence/event_store.gd",
    "src/domain/training/training_engine.gd",
    "src/domain/training/progression_policy.gd",
    "content/coaches/dialogue.json",
]
for relative in required:
    if not (ROOT / relative).exists():
        errors.append(f"missing required file: {relative}")

resource_pattern = re.compile(r'res://([^"\n]+)')
for path in list(ROOT.rglob("*.gd")) + list(ROOT.rglob("*.tscn")):
    text = path.read_text()
    for rel in resource_pattern.findall(text):
        target = ROOT / rel
        if not target.exists():
            errors.append(f"broken res:// reference in {path.relative_to(ROOT)}: {rel}")

if errors:
    print("LOADBEARING static validation: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("LOADBEARING static validation: PASS")
print(f"Validated {len(list(ROOT.rglob('*')))} project entries")

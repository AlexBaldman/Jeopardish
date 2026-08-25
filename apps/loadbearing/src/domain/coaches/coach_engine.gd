class_name CoachEngine
extends RefCounted

const DIALOGUE_PATH := "res://content/coaches/dialogue.json"

var _dialogue: Dictionary = {}


func _init() -> void:
	_load_dialogue()


func council(prescription: Dictionary) -> Array[Dictionary]:
	var state := String(prescription.get("readiness_state", "green"))
	var trigger := "council_%s" % state
	return [
		{"coach": "VANE", "role": "THE MECHANIST", "text": _line("vane", trigger)},
		{"coach": "MORROW", "role": "THE AUDITOR", "text": _line("morrow", trigger)},
		{"coach": "ROOK", "role": "THE YARDMAN", "text": _line("rook", trigger)}
	]


func debrief(decision: Dictionary, ended_for_pain := false) -> Array[Dictionary]:
	var trigger := "pain_stop" if ended_for_pain else String(decision.get("decision", "hold_load"))
	return [
		{"coach": "VANE", "text": _line("vane", trigger)},
		{"coach": "MORROW", "text": _line("morrow", trigger)},
		{"coach": "ROOK", "text": _line("rook", trigger)}
	]


func _load_dialogue() -> void:
	if not FileAccess.file_exists(DIALOGUE_PATH):
		push_error("LOADBEARING dialogue file missing: %s" % DIALOGUE_PATH)
		return
	var file := FileAccess.open(DIALOGUE_PATH, FileAccess.READ)
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) == TYPE_DICTIONARY:
		_dialogue = parsed
	else:
		push_error("LOADBEARING dialogue JSON is invalid")


func _line(coach: String, trigger: String) -> String:
	var coach_lines: Dictionary = _dialogue.get(coach, {})
	var lines: Array = coach_lines.get(trigger, [])
	if lines.is_empty():
		return "No comment."
	return String(lines[randi() % lines.size()])

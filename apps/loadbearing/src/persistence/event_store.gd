class_name EventStore
extends RefCounted

const EVENTS_PATH := "user://loadbearing_events.jsonl"
const SCHEMA_VERSION := 1


func append_event(event_type: String, payload: Dictionary, session_id := "") -> Dictionary:
	var event := {
		"event_id": new_id("evt"),
		"event_type": event_type,
		"schema_version": SCHEMA_VERSION,
		"occurred_at": Time.get_datetime_string_from_system(false, false),
		"occurred_at_unix": int(Time.get_unix_time_from_system()),
		"session_id": session_id,
		"payload": payload
	}

	var file: FileAccess
	if FileAccess.file_exists(EVENTS_PATH):
		file = FileAccess.open(EVENTS_PATH, FileAccess.READ_WRITE)
		if file:
			file.seek_end()
	else:
		file = FileAccess.open(EVENTS_PATH, FileAccess.WRITE_READ)

	if file == null:
		push_error("LOADBEARING could not open event store")
		return {}

	file.store_line(JSON.stringify(event))
	file.flush()
	return event


func load_events() -> Array:
	var events: Array = []
	if not FileAccess.file_exists(EVENTS_PATH):
		return events

	var file := FileAccess.open(EVENTS_PATH, FileAccess.READ)
	if file == null:
		return events

	while file.get_position() < file.get_length():
		var line := file.get_line().strip_edges()
		if line.is_empty():
			continue
		var parsed = JSON.parse_string(line)
		if typeof(parsed) == TYPE_DICTIONARY:
			events.append(parsed)
		else:
			push_warning("LOADBEARING skipped malformed event line")

	return events


func clear_all() -> void:
	if FileAccess.file_exists(EVENTS_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(EVENTS_PATH))


func new_id(prefix: String) -> String:
	return "%s_%d_%04d" % [prefix, int(Time.get_unix_time_from_system()), randi_range(0, 9999)]

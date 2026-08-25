class_name AppState
extends RefCounted


static func profile(events: Array) -> Dictionary:
	for i in range(events.size() - 1, -1, -1):
		var event: Dictionary = events[i]
		if String(event.get("event_type", "")) == "profile_created":
			return event.get("payload", {})
	return {}


static func current_bench_load(events: Array) -> float:
	for i in range(events.size() - 1, -1, -1):
		var event: Dictionary = events[i]
		if String(event.get("event_type", "")) == "progression_decided":
			var payload: Dictionary = event.get("payload", {})
			if String(payload.get("exercise_id", "")) == "bench_press":
				return float(payload.get("new_load", 45.0))

	var athlete := profile(events)
	return float(athlete.get("starting_bench_load", 45.0))


static func total_xp(events: Array) -> int:
	var total := 0
	for event in events:
		if String(event.get("event_type", "")) == "xp_awarded":
			total += int(event.get("payload", {}).get("total", 0))
	return total


static func completed_sessions(events: Array) -> int:
	var count := 0
	for event in events:
		if String(event.get("event_type", "")) == "session_completed":
			count += 1
	return count


static func latest_e1rm(events: Array) -> float:
	for i in range(events.size() - 1, -1, -1):
		var event: Dictionary = events[i]
		if String(event.get("event_type", "")) == "session_completed":
			return float(event.get("payload", {}).get("best_e1rm", 0.0))
	return 0.0

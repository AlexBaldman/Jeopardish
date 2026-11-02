class_name ProgressionPolicy
extends RefCounted

const ENGINE_VERSION := "0.1.0"


static func decide(prescription: Dictionary, performed_sets: Array, ended_for_pain := false) -> Dictionary:
	var base_load := float(prescription.get("base_load", prescription.get("load", 45.0)))
	var increment := float(prescription.get("load_increment", 5.0))
	var readiness_state := String(prescription.get("readiness_state", "green"))
	var target_sets := int(prescription.get("sets", 3))
	var rep_range: Array = prescription.get("rep_range", [4, 6])
	var min_reps := int(rep_range[0])
	var max_reps := int(rep_range[1])
	var target_rir: Array = prescription.get("target_rir", [1, 2])
	var required_rir := float(target_rir[0])
	var reasons: Array[String] = []

	if ended_for_pain or _contains_pain(performed_sets):
		return _decision("hold_load", base_load, base_load, ["pain_flag_prevents_progression"], readiness_state)

	if performed_sets.size() < target_sets:
		return _decision("hold_load", base_load, base_load, ["prescribed_sets_not_completed"], readiness_state)

	# A recovery-adjusted exposure is intentionally not used to opportunistically advance load.
	if readiness_state != "green":
		return _decision("hold_load", base_load, base_load, ["recovery_adjusted_session"], readiness_state)

	var all_at_ceiling := true
	var misses := 0
	var minimum_rir := 99.0
	var minimum_technique := 10.0

	for set_data in performed_sets:
		var reps := int(set_data.get("reps", 0))
		var rir := float(set_data.get("rir", 0.0))
		var technique := float(set_data.get("technique", 0.0))

		if reps < max_reps:
			all_at_ceiling = false
		if reps < min_reps:
			misses += 1
		minimum_rir = min(minimum_rir, rir)
		minimum_technique = min(minimum_technique, technique)

	if all_at_ceiling and minimum_rir >= required_rir and minimum_technique >= 7.0:
		reasons.append("all_sets_reached_rep_ceiling")
		reasons.append("minimum_rir_met")
		reasons.append("technique_threshold_met")
		return _decision("increase_load", base_load, base_load + increment, reasons, readiness_state)

	if misses >= 2 or minimum_technique < 5.0:
		if misses >= 2:
			reasons.append("multiple_sets_below_rep_floor")
		if minimum_technique < 5.0:
			reasons.append("technique_deteriorated")
		return _decision("reduce_load", base_load, max(0.0, base_load - increment), reasons, readiness_state)

	if not all_at_ceiling:
		reasons.append("rep_ceiling_not_completed")
	if minimum_rir < required_rir:
		reasons.append("target_rir_exceeded")
	if minimum_technique < 7.0:
		reasons.append("technique_below_progression_threshold")

	return _decision("hold_load", base_load, base_load, reasons, readiness_state)


static func _contains_pain(performed_sets: Array) -> bool:
	for set_data in performed_sets:
		if bool(set_data.get("pain", false)):
			return true
	return false


static func _decision(action: String, previous_load: float, new_load: float, reasons: Array, readiness_state: String) -> Dictionary:
	return {
		"exercise_id": "bench_press",
		"decision": action,
		"previous_load": previous_load,
		"new_load": new_load,
		"reasons": reasons,
		"readiness_state": readiness_state,
		"engine_version": ENGINE_VERSION
	}

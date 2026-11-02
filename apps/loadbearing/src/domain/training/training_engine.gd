class_name TrainingEngine
extends RefCounted

const ReadinessPolicyScript = preload("res://src/domain/training/readiness_policy.gd")


func prescribe_bench(base_load: float, readiness: Dictionary) -> Dictionary:
	var evaluation: Dictionary = ReadinessPolicyScript.evaluate(readiness)
	var state := String(evaluation.get("state", "green"))
	var working_load := _round_to_increment(base_load, 5.0)
	var sets := 3
	var target_rir: Array = [1, 2]
	var adjustments: Array[String] = []

	match state:
		"yellow":
			sets = 2
			target_rir = [2, 3]
			adjustments.append("removed_one_work_set")
			adjustments.append("increased_rir_margin")
		"red":
			sets = 2
			target_rir = [3, 4]
			working_load = _round_to_increment(max(45.0, base_load * 0.90), 5.0)
			adjustments.append("reduced_working_load")
			adjustments.append("removed_one_work_set")
			adjustments.append("increased_rir_margin")
		_:
			pass

	return {
		"program_id": "vertical_slice_bench_01",
		"exercise_id": "bench_press",
		"exercise_name": "Bench Press",
		"base_load": base_load,
		"load": working_load,
		"unit": "lb",
		"sets": sets,
		"rep_range": [4, 6],
		"target_rir": target_rir,
		"load_increment": 5.0,
		"readiness_state": state,
		"readiness_score": evaluation.get("score", 0.0),
		"readiness_reasons": evaluation.get("reasons", []),
		"adjustments": adjustments,
		"decision_trace": _build_trace(base_load, working_load, sets, target_rir, evaluation, adjustments)
	}


func _build_trace(base_load: float, working_load: float, sets: int, target_rir: Array, evaluation: Dictionary, adjustments: Array[String]) -> Array[String]:
	var trace: Array[String] = []
	trace.append("Base training load: %.0f lb" % base_load)
	trace.append("Readiness: %s (%.1f/5)" % [String(evaluation.get("state", "green")).to_upper(), float(evaluation.get("score", 0.0))])
	for reason in evaluation.get("reasons", []):
		trace.append("Readiness signal: %s" % String(reason).replace("_", " "))
	for adjustment in adjustments:
		trace.append("Adjustment: %s" % adjustment.replace("_", " "))
	trace.append("Prescription: %.0f lb × %d sets, 4–6 reps, RIR %d–%d" % [working_load, sets, int(target_rir[0]), int(target_rir[1])])
	return trace


func _round_to_increment(value: float, increment: float) -> float:
	if increment <= 0.0:
		return value
	return round(value / increment) * increment

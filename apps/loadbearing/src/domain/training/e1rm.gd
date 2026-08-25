class_name E1RM
extends RefCounted


static func epley(weight: float, reps: int) -> float:
	if weight <= 0.0 or reps <= 0:
		return 0.0
	if reps == 1:
		return weight
	return weight * (1.0 + float(reps) / 30.0)


static func best_estimate(performed_sets: Array) -> float:
	var best := 0.0
	for set_data in performed_sets:
		var estimate := epley(float(set_data.get("weight", 0.0)), int(set_data.get("reps", 0)))
		best = max(best, estimate)
	return snappedf(best, 0.1)

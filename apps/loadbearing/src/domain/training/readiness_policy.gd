class_name ReadinessPolicy
extends RefCounted


static func evaluate(readiness: Dictionary) -> Dictionary:
	var reasons: Array[String] = []
	var pain := bool(readiness.get("pain", false))

	if pain:
		return {
			"state": "red",
			"score": 0.0,
			"reasons": ["new_or_unusual_pain_flagged"]
		}

	var sleep := clampf(float(readiness.get("sleep", 3)), 1.0, 5.0)
	var energy := clampf(float(readiness.get("energy", 3)), 1.0, 5.0)
	var soreness := clampf(float(readiness.get("soreness", 3)), 1.0, 5.0)
	var motivation := clampf(float(readiness.get("motivation", 3)), 1.0, 5.0)

	# High soreness should lower readiness, hence the inverted soreness term.
	var score := (sleep + energy + motivation + (6.0 - soreness)) / 4.0
	var state := "green"

	if score < 2.5:
		state = "red"
		reasons.append("readiness_well_below_baseline")
	elif score < 3.5:
		state = "yellow"
		reasons.append("readiness_below_baseline")
	else:
		reasons.append("readiness_supports_normal_session")

	if sleep <= 2.0:
		reasons.append("low_sleep")
	if energy <= 2.0:
		reasons.append("low_energy")
	if soreness >= 4.0:
		reasons.append("high_soreness")

	return {
		"state": state,
		"score": snappedf(score, 0.1),
		"reasons": reasons
	}

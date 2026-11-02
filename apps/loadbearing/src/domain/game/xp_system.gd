class_name XPSystem
extends RefCounted


static func calculate(prescription: Dictionary, performed_sets: Array, decision: Dictionary, ended_for_pain := false) -> Dictionary:
	var awards: Array[Dictionary] = []

	if ended_for_pain:
		awards.append({"label": "Safety stop logged", "amount": 40})
		return _result(awards)

	var prescribed_sets := int(prescription.get("sets", 3))
	if performed_sets.size() == prescribed_sets:
		awards.append({"label": "Session completed", "amount": 100})
		awards.append({"label": "All working sets logged", "amount": 20})

	if _rir_adherent(performed_sets, prescription.get("target_rir", [1, 2])):
		awards.append({"label": "RIR discipline", "amount": 20})

	if _technique_adherent(performed_sets):
		awards.append({"label": "Technique standard", "amount": 20})

	if String(prescription.get("readiness_state", "green")) != "green" and performed_sets.size() == prescribed_sets:
		awards.append({"label": "Recovery discipline", "amount": 30})

	if String(decision.get("decision", "hold_load")) == "increase_load":
		awards.append({"label": "Earned progression", "amount": 40})

	return _result(awards)


static func _rir_adherent(performed_sets: Array, target_rir: Array) -> bool:
	if performed_sets.is_empty():
		return false
	var minimum := float(target_rir[0])
	var maximum := float(target_rir[1])
	for set_data in performed_sets:
		var rir := float(set_data.get("rir", -1.0))
		if rir < minimum or rir > maximum:
			return false
	return true


static func _technique_adherent(performed_sets: Array) -> bool:
	if performed_sets.is_empty():
		return false
	for set_data in performed_sets:
		if float(set_data.get("technique", 0.0)) < 7.0:
			return false
	return true


static func _result(awards: Array[Dictionary]) -> Dictionary:
	var total := 0
	for award in awards:
		total += int(award.get("amount", 0))
	return {"total": total, "awards": awards}

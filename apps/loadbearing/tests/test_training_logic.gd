extends SceneTree

const E1RMScript = preload("res://src/domain/training/e1rm.gd")
const TrainingEngineScript = preload("res://src/domain/training/training_engine.gd")
const ProgressionPolicyScript = preload("res://src/domain/training/progression_policy.gd")
const XPSystemScript = preload("res://src/domain/game/xp_system.gd")

var failures := 0


func _init() -> void:
	_test_e1rm()
	_test_green_prescription()
	_test_yellow_reduces_volume()
	_test_red_reduces_load()
	_test_progression_increase()
	_test_recovery_adjusted_session_holds()
	_test_pain_prevents_progression()
	_test_xp_rewards_recovery_discipline()

	if failures == 0:
		print("LOADBEARING tests: PASS")
	else:
		push_error("LOADBEARING tests: %d failure(s)" % failures)
	quit(failures)


func _test_e1rm() -> void:
	_expect_near(E1RMScript.epley(185.0, 5), 215.8333, 0.01, "Epley estimate")


func _test_green_prescription() -> void:
	var engine = TrainingEngineScript.new()
	var rx: Dictionary = engine.prescribe_bench(185.0, {"sleep": 4, "energy": 4, "soreness": 2, "motivation": 4, "pain": false})
	_expect_equal(rx["readiness_state"], "green", "green readiness")
	_expect_equal(rx["sets"], 3, "green keeps three sets")
	_expect_equal(rx["load"], 185.0, "green keeps working load")


func _test_yellow_reduces_volume() -> void:
	var engine = TrainingEngineScript.new()
	var rx: Dictionary = engine.prescribe_bench(185.0, {"sleep": 3, "energy": 3, "soreness": 4, "motivation": 3, "pain": false})
	_expect_equal(rx["readiness_state"], "yellow", "yellow readiness")
	_expect_equal(rx["sets"], 2, "yellow removes one set")


func _test_red_reduces_load() -> void:
	var engine = TrainingEngineScript.new()
	var rx: Dictionary = engine.prescribe_bench(200.0, {"sleep": 1, "energy": 1, "soreness": 5, "motivation": 1, "pain": false})
	_expect_equal(rx["readiness_state"], "red", "red readiness")
	_expect_equal(rx["sets"], 2, "red uses two sets")
	_expect_true(float(rx["load"]) < 200.0, "red reduces working load")


func _test_progression_increase() -> void:
	var rx := {"base_load": 185.0, "load": 185.0, "sets": 3, "rep_range": [4, 6], "target_rir": [1, 2], "load_increment": 5.0, "readiness_state": "green"}
	var sets := [
		{"weight": 185.0, "reps": 6, "rir": 2, "technique": 8, "pain": false},
		{"weight": 185.0, "reps": 6, "rir": 2, "technique": 8, "pain": false},
		{"weight": 185.0, "reps": 6, "rir": 1, "technique": 8, "pain": false}
	]
	var decision: Dictionary = ProgressionPolicyScript.decide(rx, sets)
	_expect_equal(decision["decision"], "increase_load", "clean ceiling increases load")
	_expect_equal(decision["new_load"], 190.0, "increase is five pounds")


func _test_recovery_adjusted_session_holds() -> void:
	var rx := {"base_load": 185.0, "load": 185.0, "sets": 2, "rep_range": [4, 6], "target_rir": [2, 3], "load_increment": 5.0, "readiness_state": "yellow"}
	var sets := [
		{"weight": 185.0, "reps": 6, "rir": 3, "technique": 9, "pain": false},
		{"weight": 185.0, "reps": 6, "rir": 2, "technique": 9, "pain": false}
	]
	var decision: Dictionary = ProgressionPolicyScript.decide(rx, sets)
	_expect_equal(decision["decision"], "hold_load", "yellow session does not advance base load")


func _test_pain_prevents_progression() -> void:
	var rx := {"base_load": 185.0, "load": 185.0, "sets": 3, "rep_range": [4, 6], "target_rir": [1, 2], "load_increment": 5.0, "readiness_state": "green"}
	var sets := [{"weight": 185.0, "reps": 6, "rir": 2, "technique": 8, "pain": true}]
	var decision: Dictionary = ProgressionPolicyScript.decide(rx, sets, true)
	_expect_equal(decision["decision"], "hold_load", "pain prevents progression")
	_expect_equal(decision["new_load"], 185.0, "pain preserves base load")


func _test_xp_rewards_recovery_discipline() -> void:
	var rx := {"sets": 2, "target_rir": [2, 3], "readiness_state": "yellow"}
	var sets := [
		{"rir": 3, "technique": 8},
		{"rir": 2, "technique": 8}
	]
	var decision := {"decision": "hold_load"}
	var xp: Dictionary = XPSystemScript.calculate(rx, sets, decision)
	_expect_true(int(xp["total"]) >= 170, "recovery adherence earns positive protocol XP")


func _expect_equal(actual, expected, label: String) -> void:
	if actual != expected:
		failures += 1
		push_error("FAIL %s: expected %s, got %s" % [label, str(expected), str(actual)])


func _expect_true(value: bool, label: String) -> void:
	if not value:
		failures += 1
		push_error("FAIL %s" % label)


func _expect_near(actual: float, expected: float, tolerance: float, label: String) -> void:
	if abs(actual - expected) > tolerance:
		failures += 1
		push_error("FAIL %s: expected %.4f, got %.4f" % [label, expected, actual])

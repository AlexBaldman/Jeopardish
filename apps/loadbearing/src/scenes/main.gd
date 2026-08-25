extends Control

const EventStoreScript = preload("res://src/persistence/event_store.gd")
const AppStateScript = preload("res://src/app/app_state.gd")
const TrainingEngineScript = preload("res://src/domain/training/training_engine.gd")
const ProgressionPolicyScript = preload("res://src/domain/training/progression_policy.gd")
const E1RMScript = preload("res://src/domain/training/e1rm.gd")
const CoachEngineScript = preload("res://src/domain/coaches/coach_engine.gd")
const XPSystemScript = preload("res://src/domain/game/xp_system.gd")

const COLOR_BG := Color("10131b")
const COLOR_PANEL := Color("1b2430")
const COLOR_PANEL_ALT := Color("222f3e")
const COLOR_TEXT := Color("f3f0dc")
const COLOR_MUTED := Color("9fb0bf")
const COLOR_ACCENT := Color("ffd166")
const COLOR_GOOD := Color("6ee7a8")
const COLOR_WARN := Color("f7b267")
const COLOR_DANGER := Color("ff6b6b")
const COLOR_BORDER := Color("3c5268")

var event_store = EventStoreScript.new()
var training_engine = TrainingEngineScript.new()
var coach_engine = CoachEngineScript.new()
var events: Array = []

var content: VBoxContainer
var current_readiness: Dictionary = {}
var current_prescription: Dictionary = {}
var current_session_id := ""
var performed_sets: Array = []
var current_set_index := 0


func _ready() -> void:
	randomize()
	events = event_store.load_events()
	_build_shell()
	if AppStateScript.profile(events).is_empty():
		_show_onboarding()
	else:
		_show_locker_room()


func _build_shell() -> void:
	var background := ColorRect.new()
	background.color = COLOR_BG
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 18)
	margin.add_theme_constant_override("margin_right", 18)
	margin.add_theme_constant_override("margin_top", 22)
	margin.add_theme_constant_override("margin_bottom", 18)
	add_child(margin)

	var scroll := ScrollContainer.new()
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	margin.add_child(scroll)

	content = VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 12)
	scroll.add_child(content)


func _clear_screen() -> void:
	for child in content.get_children():
		content.remove_child(child)
		child.queue_free()


func _show_onboarding() -> void:
	_clear_screen()
	_add_brand("LOADBEARING", "VERTICAL SLICE 0.1")
	_add_copy("A real bench session drives the game. Your first job is to give SPOTTER-1 a conservative starting load.")

	var name_label := _label("LIFTER NAME", 14, COLOR_MUTED)
	content.add_child(name_label)
	var name_input := LineEdit.new()
	name_input.placeholder_text = "Lifter"
	name_input.text = "Alex"
	_style_input(name_input)
	content.add_child(name_input)

	var load_label := _label("STARTING BENCH WORK LOAD", 14, COLOR_MUTED)
	content.add_child(load_label)
	var load_input := SpinBox.new()
	load_input.min_value = 45
	load_input.max_value = 1000
	load_input.step = 5
	load_input.value = 135
	load_input.suffix = " lb"
	_style_input(load_input)
	content.add_child(load_input)

	var note := _callout("Use a load you can handle cleanly for roughly 4–6 reps with reps left in reserve. This is a starting work load, not a 1RM test.", COLOR_PANEL_ALT)
	content.add_child(note)

	var create_button := _button("CREATE LIFTER")
	create_button.pressed.connect(func():
		var athlete_name := name_input.text.strip_edges()
		if athlete_name.is_empty():
			athlete_name = "Lifter"
		event_store.append_event("profile_created", {
			"name": athlete_name,
			"unit": "lb",
			"starting_bench_load": float(load_input.value)
		})
		events = event_store.load_events()
		_show_locker_room()
	)
	content.add_child(create_button)


func _show_locker_room() -> void:
	_clear_screen()
	var athlete: Dictionary = AppStateScript.profile(events)
	var bench_load := AppStateScript.current_bench_load(events)
	var xp := AppStateScript.total_xp(events)
	var session_count := AppStateScript.completed_sessions(events)
	var e1rm := AppStateScript.latest_e1rm(events)

	_add_brand("LOADBEARING", "LOCKER ROOM")
	_add_copy("%s // Protocol XP %d" % [String(athlete.get("name", "Lifter")), xp])

	var stats := _panel_vbox()
	stats.add_child(_stat_row("CURRENT BENCH BASE", "%.0f lb" % bench_load))
	stats.add_child(_stat_row("COMPLETED SESSIONS", str(session_count)))
	stats.add_child(_stat_row("LATEST e1RM", "—" if e1rm <= 0 else "%.1f lb" % e1rm))
	content.add_child(_wrap_panel(stats))

	var start_button := _button("BEGIN READINESS CHECK")
	start_button.pressed.connect(_show_readiness)
	content.add_child(start_button)

	var philosophy := _callout("SPOTTER-1 advances load only when the rep ceiling, RIR margin, and technique threshold agree. Recovery-adjusted sessions hold the base load by design.", COLOR_PANEL_ALT)
	content.add_child(philosophy)


func _show_readiness() -> void:
	_clear_screen()
	_add_brand("READINESS SCANNER", "PRE-SESSION")
	_add_copy("Rate the state you actually brought to the gym. The game awards honest recovery decisions, which is less glamorous than lying to a cartoon but considerably more useful.")

	var sleep := _rating_row("SLEEP", 3)
	var energy := _rating_row("ENERGY", 3)
	var soreness := _rating_row("SORENESS", 2)
	var motivation := _rating_row("MOTIVATION", 3)
	content.add_child(sleep[0])
	content.add_child(energy[0])
	content.add_child(soreness[0])
	content.add_child(motivation[0])

	var pain_check := CheckBox.new()
	pain_check.text = "NEW OR UNUSUAL PAIN BEFORE TRAINING"
	pain_check.add_theme_color_override("font_color", COLOR_DANGER)
	pain_check.add_theme_font_size_override("font_size", 14)
	content.add_child(pain_check)

	var generate := _button("ASK SPOTTER-1")
	generate.pressed.connect(func():
		current_readiness = {
			"sleep": int(sleep[1].selected + 1),
			"energy": int(energy[1].selected + 1),
			"soreness": int(soreness[1].selected + 1),
			"motivation": int(motivation[1].selected + 1),
			"pain": pain_check.button_pressed
		}
		current_session_id = event_store.new_id("sess")
		event_store.append_event("readiness_logged", current_readiness, current_session_id)
		var base_load := AppStateScript.current_bench_load(event_store.load_events())
		current_prescription = training_engine.prescribe_bench(base_load, current_readiness)
		event_store.append_event("session_prescribed", current_prescription, current_session_id)
		events = event_store.load_events()
		_show_council()
	)
	content.add_child(generate)

	var back := _secondary_button("BACK")
	back.pressed.connect(_show_locker_room)
	content.add_child(back)


func _show_council() -> void:
	_clear_screen()
	_add_brand("COACH COUNCIL", "SPOTTER-1 PRESCRIPTION")

	var state := String(current_prescription.get("readiness_state", "green"))
	var state_color := COLOR_GOOD
	if state == "yellow":
		state_color = COLOR_WARN
	elif state == "red":
		state_color = COLOR_DANGER

	var header := _callout("READINESS %s  //  %.1f / 5" % [state.to_upper(), float(current_prescription.get("readiness_score", 0.0))], state_color.darkened(0.65))
	content.add_child(header)

	for reaction in coach_engine.council(current_prescription):
		content.add_child(_coach_card(String(reaction["coach"]), String(reaction["role"]), String(reaction["text"])))

	var rx := _panel_vbox()
	rx.add_child(_label("SPOTTER-1", 15, COLOR_ACCENT))
	rx.add_child(_label("%.0f LB  ×  %d SETS  ×  4–6 REPS" % [float(current_prescription["load"]), int(current_prescription["sets"])], 23, COLOR_TEXT))
	var rir: Array = current_prescription["target_rir"]
	rx.add_child(_label("TARGET RIR %d–%d" % [int(rir[0]), int(rir[1])], 15, COLOR_MUTED))
	content.add_child(_wrap_panel(rx, COLOR_PANEL_ALT))

	var why_button := _secondary_button("WHY THIS PRESCRIPTION?")
	why_button.pressed.connect(_show_decision_trace)
	content.add_child(why_button)

	var start := _button("START SESSION")
	start.pressed.connect(func():
		performed_sets = []
		current_set_index = 0
		event_store.append_event("session_started", {
			"exercise_id": "bench_press",
			"prescription": current_prescription
		}, current_session_id)
		_show_workout()
	)
	content.add_child(start)


func _show_decision_trace() -> void:
	_clear_screen()
	_add_brand("SPOTTER-1", "DECISION TRACE")
	for trace_line in current_prescription.get("decision_trace", []):
		content.add_child(_callout(String(trace_line), COLOR_PANEL))
	var back := _button("BACK TO COUNCIL")
	back.pressed.connect(_show_council)
	content.add_child(back)


func _show_workout() -> void:
	_clear_screen()
	var target_sets := int(current_prescription.get("sets", 3))
	if current_set_index >= target_sets:
		_finish_session(false)
		return

	_add_brand("BENCH PRESS", "SET %d / %d" % [current_set_index + 1, target_sets])
	var rir_range: Array = current_prescription.get("target_rir", [1, 2])
	_add_copy("Target: %.0f lb × 4–6 reps // RIR %d–%d" % [float(current_prescription.get("load", 45.0)), int(rir_range[0]), int(rir_range[1])])

	var previous := _callout(_previous_set_summary(), COLOR_PANEL_ALT)
	content.add_child(previous)

	var reps_row := HBoxContainer.new()
	reps_row.add_theme_constant_override("separation", 10)
	var reps_label := _label("REPS", 16, COLOR_MUTED)
	reps_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	reps_row.add_child(reps_label)
	var reps_input := SpinBox.new()
	reps_input.min_value = 1
	reps_input.max_value = 30
	reps_input.step = 1
	reps_input.value = 5
	reps_input.custom_minimum_size = Vector2(130, 48)
	_style_input(reps_input)
	reps_row.add_child(reps_input)
	content.add_child(reps_row)

	var rir_select := _choice_row("RIR", ["0", "1", "2", "3", "4+"])
	rir_select[1].select(clampi(int(rir_range[0]), 0, 4))
	content.add_child(rir_select[0])

	var technique_select := _choice_row("TECHNIQUE", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"])
	technique_select[1].select(7)
	content.add_child(technique_select[0])

	var pain_check := CheckBox.new()
	pain_check.text = "NEW / UNUSUAL PAIN DURING THIS SET"
	pain_check.add_theme_color_override("font_color", COLOR_DANGER)
	pain_check.add_theme_font_size_override("font_size", 14)
	content.add_child(pain_check)

	var complete := _button("COMPLETE SET")
	complete.pressed.connect(func():
		var set_data := {
			"set_index": current_set_index + 1,
			"exercise_id": "bench_press",
			"weight": float(current_prescription.get("load", 45.0)),
			"unit": "lb",
			"reps": int(reps_input.value),
			"rir": int(rir_select[1].selected),
			"technique": int(technique_select[1].selected + 1),
			"pain": pain_check.button_pressed
		}
		performed_sets.append(set_data)
		event_store.append_event("set_logged", set_data, current_session_id)
		if pain_check.button_pressed:
			event_store.append_event("pain_flagged", {
				"exercise_id": "bench_press",
				"set_index": current_set_index + 1,
				"action": "session_ended_early"
			}, current_session_id)
			_finish_session(true)
			return
		current_set_index += 1
		_show_workout()
	)
	content.add_child(complete)

	content.add_child(_callout("RIR means reps in reserve. On this compound lift, the goal is to stop with the prescribed margin rather than collect points for failure.", COLOR_PANEL_ALT))


func _finish_session(ended_for_pain: bool) -> void:
	var decision: Dictionary = ProgressionPolicyScript.decide(current_prescription, performed_sets, ended_for_pain)
	var best_e1rm := E1RMScript.best_estimate(performed_sets)
	var xp: Dictionary = XPSystemScript.calculate(current_prescription, performed_sets, decision, ended_for_pain)

	event_store.append_event("session_completed", {
		"exercise_id": "bench_press",
		"sets_completed": performed_sets.size(),
		"sets_prescribed": int(current_prescription.get("sets", 3)),
		"best_e1rm": best_e1rm,
		"ended_for_pain": ended_for_pain
	}, current_session_id)
	event_store.append_event("progression_decided", decision, current_session_id)
	event_store.append_event("xp_awarded", xp, current_session_id)
	events = event_store.load_events()
	_show_debrief(decision, xp, best_e1rm, ended_for_pain)


func _show_debrief(decision: Dictionary, xp: Dictionary, best_e1rm: float, ended_for_pain: bool) -> void:
	_clear_screen()
	_add_brand("SESSION DEBRIEF", "PROTOCOL COMPLETE" if not ended_for_pain else "SAFETY STOP")

	var summary := _panel_vbox()
	summary.add_child(_stat_row("SETS LOGGED", str(performed_sets.size())))
	summary.add_child(_stat_row("BEST e1RM", "%.1f lb" % best_e1rm if best_e1rm > 0 else "—"))
	summary.add_child(_stat_row("DECISION", String(decision.get("decision", "hold_load")).replace("_", " ").to_upper()))
	summary.add_child(_stat_row("NEXT BASE", "%.0f lb" % float(decision.get("new_load", current_prescription.get("base_load", 45.0)))))
	content.add_child(_wrap_panel(summary))

	var awards_box := _panel_vbox()
	awards_box.add_child(_label("PROTOCOL XP", 15, COLOR_ACCENT))
	for award in xp.get("awards", []):
		awards_box.add_child(_stat_row(String(award.get("label", "Award")), "+%d" % int(award.get("amount", 0))))
	awards_box.add_child(_stat_row("TOTAL", "+%d XP" % int(xp.get("total", 0)), COLOR_GOOD))
	content.add_child(_wrap_panel(awards_box, COLOR_PANEL_ALT))

	for reaction in coach_engine.debrief(decision, ended_for_pain):
		content.add_child(_coach_card(String(reaction["coach"]), "", String(reaction["text"])))

	var reasons: Array = decision.get("reasons", [])
	if not reasons.is_empty():
		var reason_text := "WHY: " + ", ".join(PackedStringArray(reasons)).replace("_", " ")
		content.add_child(_callout(reason_text, COLOR_PANEL_ALT))

	if ended_for_pain:
		content.add_child(_callout("The app stops progression after a pain flag. It does not diagnose the cause. New, sharp, worsening, or concerning pain deserves appropriate real-world evaluation before loading the movement again.", COLOR_DANGER.darkened(0.65)))

	var done := _button("RETURN TO LOCKER ROOM")
	done.pressed.connect(func():
		current_readiness = {}
		current_prescription = {}
		current_session_id = ""
		performed_sets = []
		current_set_index = 0
		_show_locker_room()
	)
	content.add_child(done)


func _previous_set_summary() -> String:
	if performed_sets.is_empty():
		return "No working sets logged yet. Keep the first one deliberately clean."
	var previous: Dictionary = performed_sets[-1]
	return "Previous set: %.0f × %d // RIR %d // technique %d/10" % [float(previous["weight"]), int(previous["reps"]), int(previous["rir"]), int(previous["technique"])]


func _add_brand(title: String, subtitle: String) -> void:
	var brand := VBoxContainer.new()
	brand.add_theme_constant_override("separation", 2)
	brand.add_child(_label(title, 30, COLOR_ACCENT))
	brand.add_child(_label(subtitle, 13, COLOR_MUTED))
	content.add_child(brand)


func _add_copy(text: String) -> void:
	var copy := _label(text, 16, COLOR_TEXT)
	copy.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(copy)


func _label(text: String, size := 16, color := COLOR_TEXT) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return label


func _button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(0, 54)
	button.add_theme_font_size_override("font_size", 17)
	button.add_theme_color_override("font_color", COLOR_BG)
	button.add_theme_stylebox_override("normal", _style_box(COLOR_ACCENT, COLOR_ACCENT))
	button.add_theme_stylebox_override("hover", _style_box(COLOR_ACCENT.lightened(0.08), COLOR_ACCENT))
	button.add_theme_stylebox_override("pressed", _style_box(COLOR_ACCENT.darkened(0.12), COLOR_ACCENT))
	return button


func _secondary_button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(0, 48)
	button.add_theme_font_size_override("font_size", 15)
	button.add_theme_color_override("font_color", COLOR_TEXT)
	button.add_theme_stylebox_override("normal", _style_box(COLOR_PANEL, COLOR_BORDER))
	button.add_theme_stylebox_override("hover", _style_box(COLOR_PANEL_ALT, COLOR_ACCENT))
	return button


func _style_input(control: Control) -> void:
	control.custom_minimum_size = Vector2(0, 48)
	control.add_theme_font_size_override("font_size", 17)


func _style_box(background: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(2)
	style.corner_radius_top_left = 3
	style.corner_radius_top_right = 3
	style.corner_radius_bottom_left = 3
	style.corner_radius_bottom_right = 3
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	return style


func _wrap_panel(inner: Control, color := COLOR_PANEL) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _style_box(color, COLOR_BORDER))
	panel.add_child(inner)
	return panel


func _panel_vbox() -> VBoxContainer:
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	return box


func _callout(text: String, color: Color) -> PanelContainer:
	var label := _label(text, 14, COLOR_TEXT)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _style_box(color, COLOR_BORDER))
	panel.add_child(label)
	return panel


func _stat_row(left: String, right: String, right_color := COLOR_TEXT) -> HBoxContainer:
	var row := HBoxContainer.new()
	var left_label := _label(left, 14, COLOR_MUTED)
	left_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(left_label)
	row.add_child(_label(right, 15, right_color))
	return row


func _coach_card(coach: String, role: String, line: String) -> PanelContainer:
	var box := _panel_vbox()
	var heading := coach
	if not role.is_empty():
		heading += " // " + role
	box.add_child(_label(heading, 13, COLOR_ACCENT))
	box.add_child(_label(line, 15, COLOR_TEXT))
	return _wrap_panel(box)


func _rating_row(label_text: String, default_value: int) -> Array:
	return _choice_row(label_text, ["1", "2", "3", "4", "5"], default_value - 1)


func _choice_row(label_text: String, choices: Array[String], default_index := 0) -> Array:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	var label := _label(label_text, 15, COLOR_MUTED)
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(label)
	var select := OptionButton.new()
	for choice in choices:
		select.add_item(choice)
	select.select(clampi(default_index, 0, choices.size() - 1))
	select.custom_minimum_size = Vector2(130, 48)
	select.add_theme_font_size_override("font_size", 16)
	row.add_child(select)
	return [row, select]

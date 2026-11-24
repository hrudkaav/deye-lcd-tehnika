/*
 * Deye · LCD ТЕХНіКА — custom card for Home Assistant
 * Author: channel «ТЕХНіКА» — https://www.youtube.com/@TEXHiKA2024
 * Source: https://github.com/hrudkaav/deye-lcd-tehnika
 */
(() => {
  const cardTag = "deye-lcd-tehnika";
  // Older installs used «custom:deye-lcd-8k»; that type keeps working as an alias.
  const legacyCardTag = "deye-lcd-8k";
  if (customElements.get(cardTag)) return;

  const version = "Alpha 0.8.37";
  const currentVersion = version.replace(/^[^\d]*/, "");
  const models = [3, 5, 6, 8, 10, 12, 15, 20, 30, 80, 160];
  const defaultModel = 8;
  const themes = [
    { value: "classic", label: "КЛАСіК" },
    { value: "technika", label: "ТЕХНіКА" },
    { value: "3d", label: "3D" },
  ];
  const manualAppearances = ["light", "dark"];
  const visualValues = { lcd_scene3d:["scene","separate"], lcd_motion:["on","off"], lcd_theme:["classic","technika","3d"], lcd_palette:["olive","graphite"],
    lcd_appearance:["light","dark","auto"], lcd_auto_source:["ha","sun","device"], lcd_particles:["dot","glow","packet"] };
  /*
   * 0.8.33 · «Майстерня»: personal options ordered by the card's sponsors. They are not for everyone,
   * so every option is OFF by default and only switched on by the user in «Т» → «Майстерня».
   * Entry format: { id:"sponsor-id", name:"Name or nickname", options:[{ id:"option-id", label:{ en:"…", uk:"…" }, note:{ en:"…", uk:"…" } }] }
   * An enabled option appears in the card's data-workshop attribute, so its styles and code can check it.
   */
  const workshop = [];
  const workshopKey = "deye-lcd-tehnika:workshop";
  const storedWorkshop = () => { try { const value = JSON.parse(localStorage.getItem(workshopKey) || "{}"); return value && typeof value === "object" ? value : {}; } catch { return {}; } };
  const workshopOptionIds = new Set(workshop.flatMap(entry => entry.options.map(option => option.id)));
  // One language switch for the card and its editor: the flags in «Т» and the editor field write the same browser value.
  const languageKey = "deye-lcd-tehnika:language";
  const languageEvent = "deye-lcd-tehnika-language";
  const storedLanguage = () => { try { const value = localStorage.getItem(languageKey); return value === "en" || value === "uk" ? value : null; } catch { return null; } };
  const storeLanguage = (value) => {
    try { localStorage.setItem(languageKey, value === "en" ? "en" : "uk"); } catch { /* kept for this page only */ }
    window.dispatchEvent(new CustomEvent(languageEvent, { detail:value }));
  };
  // Frame of the ТЕХНіКА cards: one switch shared with the «Графік відключень · ТЕХНіКА» card.
  const frameKey = "tehnika-cards:frame";
  const frameEvent = "tehnika-cards-frame";
  const storedFrame = () => { try { return localStorage.getItem(frameKey) === "off" ? "off" : "on"; } catch { return "on"; } };
  const storeFrame = (value) => {
    try { localStorage.setItem(frameKey, value === "off" ? "off" : "on"); } catch { /* this page only */ }
    window.dispatchEvent(new CustomEvent(frameEvent, { detail:value }));
  };
  // Release check: the card asks GitHub at most every two hours and shares the answer between its copies on the page.
  const releaseUrl = "https://api.github.com/repos/hrudkaav/deye-lcd-tehnika/releases/latest";
  const releaseKey = "deye-lcd-tehnika:latest-release";
  const updateDismissKey = "deye-lcd-tehnika:update-dismissed";
  const releaseInterval = 2 * 60 * 60 * 1000;
  const versionParts = (text) => String(text ?? "").replace(/^[^\d]*/, "").split(".").map(part => parseInt(part, 10) || 0);
  const newerVersion = (candidate, current) => {
    const a = versionParts(candidate), b = versionParts(current);
    for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
    return false;
  };
  const threePhaseValues = ["3", 3];
  const acSources = ["grid", "load"];
  const screenWhite = "#ffffff";
  const flowThreshold = 5;
  const gridOffVoltage = 20;
  const pvInputs = [1, 2, 3, 4, 5, 6];
  const gaugeRadius = 41;
  const gaugeStart = 142;
  const gaugeSweep = 256;
  const gaugeLength = gaugeRadius * gaugeSweep * Math.PI / 180;
  const settingTimeout = 45000;
  const weekdays = { Mon: "Пн", Tue: "Вт", Wed: "Ср", Thu: "Чт", Fri: "Пт", Sat: "Сб", Sun: "Нд" };
  const modelLabel = (model) => model === 160 ? "Deye 80 + 80 кВт (160 кВт)" : `Deye ${model} кВт`;
  const pair = (en, uk) => ({ en, uk });
  const page = (title, caption, controls, extra = []) => ({ title, caption, controls, extra });
  const number = (name, en, uk, x, y, w, unit = "", h = 26) => ({
    name, label: pair(en, uk), x, y, w, h, unit, kind: "number", domain: "number",
  });
  const toggle = (name, en, uk, x, y, w, h = 24) => ({
    name, label: pair(en, uk), x, y, w, h, kind: "checkbox", domain: "switch",
  });
  const radio = (name, option, en, uk, x, y, w) => ({
    ...toggle(name, en, uk, x, y, w, 20), kind: "radio", option, domain: "select",
  });
  const option = (name, en, uk, x, y, w) => ({
    ...number(name, en, uk, x, y, w), kind: "select", domain: "select",
  });
  const time = (name, en, uk, x, y, w) => ({
    ...number(name, en, uk, x, y, w, "", 24), kind: "time", domain: ["time", "number", "select"],
  });
  const action = (name, en, uk, x, y, w, h = 24) => ({ ...toggle(name, en, uk, x, y, w, h), domain: "button" });
  const label = (en, uk, x, y, w, align = "start", h = 20, font = 3.48) => ({
    label: pair(en, uk), x, y, w, h, align, font, kind: "label",
  });
  const line = (y) => ({ x: 6, y, w: 338, h: 1, kind: "line" });
  const readout = (name, en, uk, x, y, w, h = 20) => ({
    ...label(en, uk, x, y, w, "start", h), kind: "readout", name,
  });

  const days = [
    ["mon", "Mon", "Пн"], ["tue", "Tue", "Вт"], ["wed", "Wed", "Ср"], ["thu", "Thu", "Чт"],
    ["fri", "Fri", "Пт"], ["sat", "Sat", "Сб"], ["sun", "Sun", "Нд"],
  ];
  const touControls = Array.from({ length: 6 }, (_, index) => {
    const n = index + 1;
    const y = 80 + 30.7 * index;
    return [
      toggle(`tou_${n}_grid_charge`, `Slot ${n} · Grid Charge`, `Період ${n} · заряд від мережі`, 22, y, 31),
      toggle(`tou_${n}_gen_charge`, `Slot ${n} · Gen Charge`, `Період ${n} · заряд від генератора`, 76, y, 31),
      time(`tou_${n}_start`, `Slot ${n} · start`, `Період ${n} · початок`, 125, y, 49),
      { ...time(`tou_${n % 6 + 1}_start`, `Slot ${n} · end`, `Період ${n} · кінець`, 179, y, 49), alias: true },
      number(`tou_${n}_power`, `Slot ${n} · Power`, `Період ${n} · потужність`, 233, y, 49, "", 24),
      number(`tou_${n}_battery`, `Slot ${n} · Batt`, `Період ${n} · поріг АКБ`, 287, y, 49, "%", 24),
    ].map(control => ({ ...control, compact: true }));
  }).flat();

  const connectionControls = ["normal", "reconnect"].flatMap((mode, index) => {
    const y = 38 + 97 * index;
    const prefix = `grid_${mode}_`;
    return [
      label(index ? "Reconnect after trip" : "Normal connect", index ? "Після відключення" : "Звичайне підключення", 12, y, 136, "start", 23, 3.02),
      label(index ? "Reconnect Ramp rate" : "Normal Ramp rate", index ? "Наростання після відкл." : "Наростання потужності", 153, y, 114, "start", 23, 2.8),
      number(`${prefix}ramp`, "Ramp rate", "Наростання потужності", 270, y - 1, 67, "s", 24),
      label("Low frequency", "Нижня частота", 12, y + 32, 90, "start", 24, 2.95),
      number(`${prefix}low_hz`, "Low frequency", "Нижня частота", 105, y + 32, 65, "Hz", 24),
      label("High frequency", "Верхня частота", 177, y + 32, 91, "start", 24, 2.95),
      number(`${prefix}high_hz`, "High frequency", "Верхня частота", 270, y + 32, 67, "Hz", 24),
      label("Low voltage", "Нижня напруга", 12, y + 65, 90, "start", 24, 2.95),
      number(`${prefix}low_v`, "Low voltage", "Нижня напруга", 105, y + 65, 65, "V", 24),
      label("High voltage", "Верхня напруга", 177, y + 65, 91, "start", 24, 2.95),
      number(`${prefix}high_v`, "High voltage", "Верхня напруга", 270, y + 65, 67, "V", 24),
    ];
  });
  const protectionControls = [
    ["hv3", "hf3"], ["hv2", "hf2"], ["hv1", "hf1"], ["lv1", "lf1"], ["lv2", "lf2"], ["lv3", "lf3"],
  ].flatMap((names, index) => names.flatMap((id, column) => {
    const x = 7 + column * 175, y = 67 + index * 33.6;
    const key = `grid_protection_${id}`;
    const caption = id.toUpperCase();
    const fields = [
      label(caption, caption, x, y + 2, 25),
      number(key, caption, caption, x + 26, y, 61, column ? "Hz" : "V", 25),
    ];
    if (index > 0 && index < 5) fields.push(label("–", "–", x + 89, y, 12, "center"),
      number(`${key}_delay`, `${caption} delay`, `${caption} · затримка`, x + 102, y, 51, "s", 25));
    return fields;
  }));

  const settingsMenus = [
    { id: "battery", title: pair("Battery Setting", "Налаштування АКБ"), pages: [
      page(null, pair("Batt Mode", "Режим АКБ"), [
        label("Batt Mode", "Режим АКБ", 12, 36, 125),
        ...[
          ["lithium", "Lithium", "Літієва"], ["voltage", "Use Batt V", "За напругою"],
          ["soc", "Use Batt %", "За зарядом"], ["none", "No Batt", "Без АКБ"],
        ].map(([id, en, uk], i) => radio("battery_mode", id, en, uk, 14, 74 + i * 28.5, 135)),
        label("Batt Capacity", "Ємність АКБ", 157, 75, 114),
        number("battery_capacity", "Batt Capacity", "Ємність АКБ", 274, 71, 58, "Ah"),
        label("Max A Charge", "Струм заряду", 157, 108, 114),
        number("battery_max_charging_current", "Max A Charge", "Макс. струм заряду", 274, 104, 58, "A"),
        label("Max A Discharge", "Струм розряду", 157, 141, 114),
        number("battery_max_discharging_current", "Max A Discharge", "Макс. струм розряду", 274, 137, 58, "A"),
        toggle("battery_activate", "Activate Battery", "Активувати АКБ", 10, 224, 152, 29),
        toggle("battery_disable_float_charge", "Disable Float Charge", "Вимкнути підтримку", 166, 224, 177, 29),
      ], ["battery_control_mode", "battery_operation_mode"]),
      page(null, pair("Batt Set2", "АКБ 2"), [
        label("Start", "Пуск", 26, 55, 59),
        number("generator_start", "Gen Start", "Пуск генератора", 85, 51, 67),
        number("grid_start", "Grid Start", "Пуск від мережі", 214, 51, 67),
        label("A", "А", 26, 91, 46),
        number("generator_charge_current", "Gen charge current", "Струм заряду від генератора", 85, 88, 67, "A"),
        number("grid_charge_current", "Grid charge current", "Струм заряду від мережі", 214, 88, 67, "A"),
        toggle("generator_charge", "Gen Charge", "Заряд від GEN", 30, 125, 146, 27),
        toggle("grid_charge", "Grid Charge", "Заряд від мережі", 184, 125, 155, 27),
        toggle("generator_signal", "Gen Signal", "Сигнал GEN", 30, 159, 146, 27),
        toggle("grid_signal", "Grid Signal", "Сигнал мережі", 184, 159, 155, 27),
        toggle("generator_force", "Gen Force", "Примусовий пуск GEN", 30, 205, 305, 29),
        label("Experimental · the inverter may ignore it", "Експериментально · інвертор може не виконати команду", 31, 236, 309, "start", 27, 2.8),
      ], ["generator_charge_start_soc", "generator_charge_start_voltage", "grid_charge_start_soc", "grid_charge_start_voltage", "charging_signal"]),
      page(null, pair("Batt Set3", "АКБ 3"), [
        label("Lithium Mode", "Режим літієвої АКБ", 12, 57, 119, "start", 32, 3.1),
        { ...option("battery_lithium_mode", "Lithium Mode", "Режим літієвої АКБ", 135, 60, 98), domain: ["select", "number"] },
        readout("battery_lithium_profile", "BMS profile", "Профіль BMS", 248, 62, 96),
        label("Shutdown", "Вимкнення", 12, 106, 119),
        number("battery_shutdown", "Shutdown", "Поріг вимкнення", 135, 102, 98),
        label("Low Batt", "Низький заряд", 12, 148, 119),
        number("battery_low", "Low Batt", "Поріг низького заряду", 135, 144, 98),
        label("Restart", "Перезапуск", 12, 190, 119),
        number("battery_restart", "Restart", "Поріг перезапуску", 135, 186, 98),
      ], ["battery_shutdown_voltage", "battery_low_voltage", "battery_restart_voltage"]),
    ] },
    { id: "work", title: pair("Work Mode", "Режим роботи"), pages: [
      page(null, pair("Work Mode1", "Режим 1"), [
        radio("work_mode", "sell", "Selling First", "Продаж у пріоритеті", 12, 40, 149),
        radio("work_mode", "load", "Zero Export To Load", "Нульовий експорт · Load", 12, 77, 168),
        radio("work_mode", "ct", "Zero Export To CT", "Нульовий експорт · CT", 12, 115, 168),
        number("max_solar_power", "Max Solar Power", "Ліміт сонячної генерації", 163, 42, 65, "W"),
        label("Max Solar Power", "Ліміт сонця", 232, 43, 114, "start", 23, 2.95),
        // One Solar Sell setting shown in both zero-export rows; only the row of the selected mode is active.
        { ...toggle("solar_sell", "Solar Sell", "Продаж надлишку", 185, 77, 153), forMode:"load" },
        { ...toggle("solar_sell", "Solar Sell", "Продаж надлишку", 185, 114, 153), forMode:"ct" },
        label("Max Sell Power", "Ліміт продажу", 9, 156, 103),
        number("max_sell_power", "Max Sell Power", "Ліміт продажу", 113, 150, 50, "", 26),
        label("Zero-export Power", "Нульовий експорт", 167, 156, 128),
        number("zero_export_power", "Zero-export Power", "Потужність нульового експорту", 295, 150, 45),
        label("Energy pattern", "Пріоритет", 9, 194, 109),
        radio("energy_pattern", "battery", "Batt First", "АКБ", 116, 193, 96),
        radio("energy_pattern", "load", "Load First", "Навантаження", 214, 193, 128),
        toggle("grid_peak_shaving", "Grid Peak Shaving", "Шейвінг мережі", 10, 232, 158, 27),
        number("grid_peak_shaving_power", "Power", "Ліміт шейвінгу мережі", 171, 232, 69, "W"),
        label("Power", "Потужність", 243, 234, 96),
      ]),
      page(null, pair("Work Mode2", "Режим 2"), [
        label("Grid Charge", "Мережа", 9, 40, 57, "center", 33),
        label("Gen", "GEN", 68, 49, 45, "center"),
        { ...toggle("time_of_use", "Time Of Use", "Time Of Use", 159, 36, 180, 27), domain: ["switch", "select"] },
        label("Time", "Час", 124, 63, 105, "center", 15),
        label("Power", "Потужн.", 233, 63, 49, "center", 15),
        label("Batt", "АКБ", 287, 63, 49, "center", 15),
        ...touControls,
      ], Array.from({ length: 6 }, (_, index) => [
        `tou_${index + 1}_charge`, `tou_${index + 1}_battery_voltage`,
      ]).flat()),
      page(null, pair("Work Mode4", "Режим 4"), days.flatMap(([id, en, uk], index) => [
        label(en, uk, 7 + 50 * index, 66, 34, "center"),
        { ...toggle(`tou_${id}`, en, uk, 11 + 50 * index, 85, 29, 28), compact: true },
      ])),
    ] },
    { id: "smart", title: pair("Smart Devices", "Смартпристрої"), pages: [page(null, pair("Smart", "Смарт"), [])] },
    { id: "grid", title: pair("Grid Setting", "Налаштування мережі"), pages: [
      page(null, pair("Grid Set1", "Мережа 1"), [
        toggle("grid_unlock", "Unlock Grid Setting", "Розблокувати налаштування мережі", 10, 37, 329, 27),
        label("Grid Mode", "Стандарт", 10, 73, 79),
        option("grid_mode", "Grid Mode", "Стандарт мережі", 90, 69, 199),
        { ...readout("grid_mode_index", "Grid mode index", "Номер стандарту", 296, 72, 44), align: "center" },
        label("Grid Frequency", "Частота мережі", 10, 101, 115),
        radio("grid_frequency", "50", "50Hz", "50 Гц", 125, 104, 77),
        radio("grid_frequency", "60", "60Hz", "60 Гц", 125, 129, 77),
        label("INV Output Voltage", "Вихідна напруга", 204, 116, 134, "center"),
        { ...number("grid_output_voltage", "INV Output Voltage", "Вихідна напруга інвертора", 216, 136, 116, "V"), domain: ["number", "select"] },
        label("Grid Type", "Тип мережі", 10, 179, 101),
        radio("grid_type", "single", "Single Phase", "Одна фаза", 113, 182, 223),
        radio("grid_type", "split", "120/240V Split Phase", "120/240 В · розщеплена", 113, 207, 223),
        radio("grid_type", "three", "120/208V 3 Phase", "120/208 В · три фази", 113, 232, 223),
      ]),
      page(pair("Grid Setting/Connect", "Мережа / Підключення"), pair("Grid Set2", "Мережа 2"), [
        ...connectionControls, line(132), line(231),
        label("Reconnection Time", "Час підключення", 12, 239, 134),
        number("grid_reconnect_time", "Reconnection Time", "Час повторного підключення", 146, 235, 66, "s", 25),
        label("PF", "PF", 229, 239, 33),
        number("grid_power_factor", "Power factor", "Коефіцієнт потужності", 270, 235, 67, "", 25),
      ]),
      page(pair("Grid Setting/IP protection", "Мережа / Захист"), pair("Grid Set3", "Мережа 3"), [
        label("Over voltage U>(10 min. running mean)", "Перенапруга U> (середнє за 10 хв)", 24, 38, 255, "center", 25, 2.75),
        number("grid_protection_10min_v", "10-minute overvoltage", "Середня перенапруга за 10 хв", 283, 38, 54, "V", 25),
        ...protectionControls,
      ]),
    ] },
    { id: "gen", title: pair("Gen Port Use", "Порт генератора"), pages: [
      page(pair("Gen PORT USE", "Порт генератора"), pair("PORT Set1", "Порт 1"), [
        label("Mode", "Режим", 24, 36, 104, "center"),
        radio("gen_port_mode", "gen", "Generator Input", "Вхід генератора", 10, 66, 162),
        label("Rated Power", "Номінал", 25, 87, 107, "start", 14, 2.95),
        number("gen_rated_power", "Rated Power", "Номінальна потужність", 28, 102, 73, "W", 29),
        radio("gen_port_mode", "load", "SmartLoad Output", "Вихід SmartLoad", 10, 138, 162),
        label("Power", "Потужність", 25, 161, 100, "start", 14, 2.95),
        number("gen_smart_load_power", "SmartLoad Power", "Потужність SmartLoad", 28, 177, 68, "W", 28),
        radio("gen_port_mode", "micro", "Micro Inv Input", "Вхід мікроінвертора", 10, 215, 169),
        label("ON", "УВІМК.", 3, 239, 30),
        number("gen_on_threshold", "ON threshold", "Поріг увімкнення", 28, 235, 67, "%", 27),
        label("OFF", "ВИМК.", 99, 239, 31),
        number("gen_off_threshold", "OFF threshold", "Поріг вимкнення", 130, 235, 65, "%", 27),
        toggle("gen_ac_grid", "AC couple on grid side", "AC-зв’язок з мережею", 181, 40, 162, 23),
        toggle("gen_ac_load", "AC couple on load side", "AC-зв’язок з Load", 181, 73, 162, 23),
        toggle("gen_grid_input", "GEN connect to Grid input", "GEN на вході Grid", 145, 102, 200, 23),
        toggle("gen_always_on", "On Grid always on", "З мережею завжди увімк.", 181, 136, 162, 23),
        toggle("gen_off_grid_off", "off grid immediately off", "Без мережі вимикати", 145, 177, 199, 23),
        label("AC Couple Frz High", "Верхня частота AC", 208, 212, 135, "center", 22, 2.95),
        number("gen_ac_frequency", "AC Couple Frz High", "Верхня частота AC-зв’язку", 236, 235, 66, "Hz", 27),
      ]),
      page(null, pair("PORT Set2", "Порт 2"), [
        toggle("generator_peak_shaving", "Gen Peak Shaving", "Шейвінг генератора", 14, 51, 239, 29),
        label("Power", "Потужність", 15, 95, 114),
        number("generator_peak_shaving_power", "Gen Peak Shaving Power", "Ліміт шейвінгу генератора", 134, 92, 103, "W"),
      ]),
    ] },
    { id: "basic", title: pair("Basic Setting", "Основні налаштування"), pages: [
      page(null, pair("Basic Set1", "Основні 1"), [
        toggle("basic_time_sync", "Time Syncs", "Синхронізація", 17, 50, 132, 27),
        toggle("basic_beep", "Beep", "Звук", 151, 50, 88, 27),
        toggle("basic_auto_dim", "Auto Dim", "Автозатемнення", 241, 50, 102, 27),
        ...[
          ["year", "Year", "Рік", 12, 84], ["month", "Month", "Місяць", 128, 84], ["day", "Day", "День", 244, 84],
          ["hour", "Hour", "Година", 128, 154], ["minute", "Minute", "Хвилина", 244, 154],
        ].flatMap(([id, en, uk, x, y]) => [
          label(en, uk, x, y, 95, "center"),
          { ...number(`basic_${id}`, en, uk, x, y + 22, 95, "", 35), steppers: true },
        ]),
        toggle("basic_24_hour", "24-Hour", "24 години", 18, 181, 104, 27),
        action("basic_factory_reset", "Factory Reset", "Скидання налаштувань", 18, 226, 153, 27),
        toggle("basic_lock", "Lock out all changes", "Блокувати всі зміни", 175, 226, 169, 27),
      ], ["basic_datetime"]),
    ] },
    { id: "advanced", title: pair("Advanced Function", "Додаткові функції"), pages: [
      page(null, pair("Func Set1", "Функції 1"), [
        toggle("adv_arc_fault", "Solar Arc Fault ON", "Контроль дуги PV", 9, 43, 182, 28),
        action("adv_clear_arc_fault", "Clear Arc_Fault", "Очистити збій дуги", 42, 79, 146, 24),
        toggle("adv_selfcheck", "System selfcheck", "Самоперевірка", 9, 113, 181, 27),
        toggle("adv_drm", "DRM", "DRM", 9, 152, 181, 27),
        toggle("adv_island_signal", "Signal ISLAND MODE", "Сигнал режиму острова", 9, 189, 183, 27),
        toggle("adv_bms_error_stop", "BMS_Err_Stop", "Зупинка при збої BMS", 9, 226, 180, 27),
        label("Backup Delay", "Затримка резерву", 201, 40, 141),
        number("adv_backup_delay", "Backup Delay", "Затримка резерву", 201, 64, 72, "ms", 29),
        toggle("generator_peak_shaving", "Gen peak-shaving", "Шейвінг GEN", 193, 113, 148, 27),
        label("CT Ratio", "Коефіцієнт CT", 201, 149, 140),
        number("adv_ct_ratio", "CT Ratio", "Коефіцієнт CT", 201, 173, 72, ":1", 27),
        toggle("adv_cei_report", "CEI 0-21 Report", "Звіт CEI 0-21", 193, 226, 148, 27),
      ]),
      page(null, pair("Paral. Set3", "Паралель 3"), [
        toggle("adv_parallel_enable", "Parallel", "Паралель", 11, 45, 108, 28),
        label("Modbus SN", "Адреса Modbus", 124, 45, 114),
        number("adv_modbus_sn", "Modbus SN", "Адреса Modbus", 133, 74, 70, "", 28),
        radio("adv_parallel_role", "master", "Master", "Master", 13, 79, 106),
        radio("adv_parallel_role", "slave", "Slave", "Slave", 13, 108, 106),
        ...["A", "B", "C"].map((phase, i) => radio("adv_parallel_phase", phase.toLowerCase(), `${phase} Phase`, `Фаза ${phase}`, 243, 46 + i * 29, 98)),
        line(135),
        toggle("adv_external_meter", "Ex_Meter For CT", "Зовнішній лічильник CT", 11, 144, 178, 27),
        label("Meter Select", "Лічильник", 192, 145, 146),
        option("adv_meter_select", "Meter Select", "Вибір лічильника", 192, 176, 119),
        { ...readout("adv_meter_index", "Meter index", "Номер лічильника", 315, 180, 27), align: "center" },
        ...["A", "B", "C"].map((phase, i) => toggle(`adv_meter_phase_${phase.toLowerCase()}`, `${phase} Phase`, `Фаза ${phase}`, 29, 177 + i * 28, 127, 25)),
        toggle("adv_meter_2", "Grid Tie Meter2", "Мережевий лічильник 2", 171, 235, 171, 25),
      ]),
      page(null, pair("Func Set4", "Функції 4"), [
        toggle("adv_ats", "ATS", "ATS", 10, 45, 67, 27),
        { ...readout("adv_ats_status", "ATS status", "Стан ATS", 87, 46, 72, 27), box: true },
        number("adv_ac_output_limit", "AC Output Power Limit", "Ліміт вихідної потужності AC", 201, 45, 72, "W"),
        label("AC Output Power Limit", "Ліміт виходу AC", 201, 71, 142, "start", 15, 2.85),
        number("adv_export_limit", "Export power limiter", "Ліміт експорту", 10, 87, 72, "W"),
        label("Export power limiter", "Ліміт експорту", 10, 116, 185, "start", 15),
        number("adv_import_limit", "Import power limiter", "Ліміт імпорту", 201, 87, 72, "W"),
        label("Import power limiter", "Ліміт імпорту", 201, 116, 143, "start", 15),
        line(135),
        toggle("adv_low_noise", "Low Noise Mode", "Тихий режим", 10, 144, 331, 27),
        toggle("adv_low_power", "Low Power Mode<Low Batt", "Мала потужність при низькому заряді", 10, 177, 331, 27),
        toggle("adv_mppt_scan", "MPPT Multi-Point Scanning", "Багатоточкове сканування MPPT", 10, 211, 331, 25),
        ...[1, 2, 3].map((n, i) => toggle(`adv_pv_${n}_enable`, `PV${n} Enable`, `Увімк. PV${n}`, 60 + 96 * i, 237, 92, 24)),
      ]),
    ] },
    { id: "device", title: pair("Device Info.", "Інформація"), pages: [
      page(null, pair("Device Info.", "Інфо"), [
        label("Inverter ID", "ID інвертора", 86, 37, 104, "end", 16),
        readout("device_serial", "Inverter ID", "ID інвертора", 194, 37, 103, 16),
        readout("device_flash", "Flash", "Flash", 304, 37, 40, 16),
        label("HMI: Ver", "Версія HMI", 9, 54, 84, "start", 16),
        readout("device_hmi", "HMI version", "Версія HMI", 93, 54, 77, 16),
        label("MAIN: Ver", "Версія MAIN", 170, 54, 82, "start", 16),
        readout("device_main", "MAIN version", "Версія MAIN", 251, 54, 93, 16),
        line(72),
        label("Alarms Code", "Код тривоги", 9, 75, 216, "start", 18),
        label("Occurred", "Час", 226, 75, 116, "center", 18),
        { kind: "alarms", x: 8, y: 95, w: 336, h: 165, name: "device_alarms" },
      ], ["device_info"]),
    ] },
  ];
  const nativeAliases = new Set(["generator_start", "grid_start"]);
  const nativeFields = settingsMenus.flatMap(({ pages }) => pages.flatMap(({ controls }) =>
    controls.filter(({ domain, name, alias }) => domain && !nativeAliases.has(name) && !alias)));
  const readingBindings = new Set(settingsMenus.flatMap(({ pages }) => pages.flatMap(({ controls }) =>
    controls.filter(({ kind }) => kind === "readout" || kind === "alarms").map(({ name }) => name))));
  const programBindings = Array.from({ length: 6 }, (_, i) => {
    const n = i + 1;
    return [
      [`tou_${n}_charge`, "select", `Період ${n} · спільний селектор заряду`, `Slot ${n} · shared charge selector`],
      [`tou_${n}_battery_voltage`, "number", `Період ${n} · поріг АКБ у вольтах`, `Slot ${n} · battery setpoint in volts`],
    ];
  }).flat();
  const legacyBindings = [
    ...programBindings,
    ["basic_datetime", "datetime", "Спільна сутність дати й часу", "Combined date and time entity"],
    ["device_info", "sensor", "Device Info · спільний сенсор", "Device Info · combined sensor"],
    ["battery_control_mode", "select", "Тип АКБ · літій / свинець", "Battery chemistry"],
    ["battery_operation_mode", "select", "Керування АКБ · напруга / заряд / без АКБ", "Battery operation mode"],
    ["generator_charge_start_soc", "number", "Gen Start · заряд, %", "Gen Start · charge, %"],
    ["generator_charge_start_voltage", "number", "Gen Start · напруга, В", "Gen Start · voltage, V"],
    ["grid_charge_start_soc", "number", "Grid Start · заряд, %", "Grid Start · charge, %"],
    ["grid_charge_start_voltage", "number", "Grid Start · напруга, В", "Grid Start · voltage, V"],
    ["charging_signal", "select", "Charging Signal · спільний селектор Gen / Grid", "Charging Signal · shared selector Gen / Grid"],
    ["battery_shutdown_voltage", "number", "Поріг вимкнення · напруга, В", "Shutdown · voltage, V"],
    ["battery_low_voltage", "number", "Поріг низького заряду · напруга, В", "Low Batt · voltage, V"],
    ["battery_restart_voltage", "number", "Поріг перезапуску · напруга, В", "Restart · voltage, V"],
  ];
  const settingFields = [...new Map([
    ...nativeFields.map(({ name, label: text, domain }) => [name, [name, domain, text.uk, text.en]]),
    ...legacyBindings.map(field => [field[0], field]),
  ]).values()];
  const bindingDomains = Object.fromEntries(settingFields.map(([name, domain]) => [name, domain]));
  const batteryChoices = {
    lithium: ["Lithium"],
    voltage: ["Use Batt V", "Voltage"],
    soc: ["Use Batt %", "Capacity", "SOC"],
    none: ["No Batt", "No Battery"],
  };
  const batteryChemistries = {
    lithium: batteryChoices.lithium,
    lead: ["Lead-Battery, four-stage charging method", "Lead Acid", "Lead Battery"],
  };
  const batteryOperationModes = { voltage: batteryChoices.voltage, soc: batteryChoices.soc, none: batteryChoices.none };
  const settingOptions = {
    work_mode: {
      sell: ["Selling First", "Export First"],
      load: ["Zero Export To Load"],
      ct: ["Zero Export To CT"],
    },
    energy_pattern: {
      battery: ["Batt First", "Battery First"],
      load: ["Load First"],
    },
    grid_frequency: { 50: ["50Hz", "50 Hz", "50"], 60: ["60Hz", "60 Hz", "60"] },
    grid_type: {
      single: ["Single Phase"],
      split: ["120/240V Split Phase", "Split Phase"],
      three: ["120/208V 3 Phase", "3 Phase", "Three Phase"],
    },
    gen_port_mode: {
      gen: ["Generator Input", "Generator"],
      load: ["SmartLoad Output", "Smart Load", "SmartLoad"],
      micro: ["Micro Inv Input", "Micro Inverter", "Microinverter", "Micro Inverter Input"],
    },
    adv_parallel_role: { master: ["Master"], slave: ["Slave"] },
    adv_parallel_phase: { a: ["A Phase", "Phase A", "A"], b: ["B Phase", "Phase B", "B"], c: ["C Phase", "Phase C", "C"] },
    charging_signal: {
      0: ["Normal", "None", "Disabled", "Off"],
      1: ["Generator", "Gen"],
      2: ["Grid"],
      3: ["Both", "Grid and Generator", "Gen and Grid"],
    },
  };
  const settingsButtonIcons = {
    up: "M12 2 22 13h-6v9H8v-9H2Z",
    down: "M8 2h8v9h6L12 22 2 11h6Z",
    cancel: "M6 3l6 6 6-6 3 3-6 6 6 6-3 3-6-6-6 6-3-3 6-6-6-6Z",
    apply: "m2 12 4-4 4 4L19 3l4 4-13 13Z",
  };
  const settingUnits = { A: "А", W: "Вт", kW: "кВт" };
  const gaugeLayout = [
    { key: "pv_power", source: "pv", label: "Сонячна генерація", english: "Solar", icon: "solar", x: 70, y: 87 },
    { key: "grid_power", source: "grid", label: "Мережа", english: "Grid", icon: "grid", x: 333, y: 87, invert: "invert_grid" },
    { key: "battery_power", source: "battery", label: "Батарея", english: "Battery", icon: "battery", x: 70, y: 204, invert: "invert_battery" },
    { key: "load_power", source: "load", label: "Навантаження", english: "Load", icon: "house", x: 333, y: 204 },
  ];
  const gaugeByKey = Object.fromEntries(gaugeLayout.map(gauge => [gauge.key, gauge]));
  const measurementFields = [
    { key: "current", label: "Струм", unit: "А" },
    { key: "voltage", label: "Напруга", unit: "В" },
    { key: "power", label: "Потужність", unit: "кВт" },
    { key: "temperature", label: "Температура АКБ", unit: "°C" },
  ];
  const metricEnglish = { current: "Current", voltage: "Voltage", power: "Power", temperature: "Battery temperature", soc: "Battery charge" };
  const generatorGauge = { key: "generator_power", source: "generator", label: "Генератор", english: "Generator" };
  gaugeByKey.generator_power = generatorGauge;
  const acMeasurements = measurementFields.filter(({ key }) => key !== "temperature");
  const phaseColumns = [
    { prefix: "l1", label: "L1" },
    { prefix: "l2", label: "L2" },
    { prefix: "l3", label: "L3" },
  ];
  const batteryColumns = [
    { prefix: "battery_1", label: "АКБ 1" },
    { prefix: "battery_2", label: "АКБ 2" },
  ];
  const detailBreakdowns = [
    { key: "phases", title: "Покази по фазах", columns: phaseColumns, fields: acMeasurements },
    { key: "batteries", title: "Окремі АКБ", columns: batteryColumns, fields: measurementFields },
  ];
  const measurementUnits = { ...settingUnits, mA: "мА", V: "В", mV: "мВ", kV: "кВ", "°C": "°C", "°F": "°F" };
  const historyDuration = 24 * 60 * 60 * 1000;
  const measurementFormat = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2, useGrouping: false });
  const chartFormat = new Intl.NumberFormat("uk-UA", { maximumSignificantDigits: 4, useGrouping: false });
  const englishMeasurementFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, useGrouping: false });
  const wireLayout = [
    { name: "solar", from: [118, 83], bendX: 143, to: [168, 133] },
    { name: "grid", from: [285, 83], bendX: 259, to: [235, 133] },
    { name: "battery", from: [168, 150], bendX: 143, to: [118, 200] },
    { name: "load", from: [235, 150], bendX: 259, to: [285, 200] },
  ];

  const batterySocField = { key: "soc", label: "Заряд АКБ", unit: "%" };
  const inverterColumns = [0, 1, 2].map(index => ({ prefix: `inv${index}`, label: `#${index + 1}` }));
  detailBreakdowns.push({ key: "inverters", title: "Окремі інвертори", columns: inverterColumns,
    fields: [...measurementFields, batterySocField] });
  const groupEnglish = {
    phases: "Phase readings", batteries: "Individual batteries", inverters: "Individual inverters",
    inv0: "Inverter 1 · phases", inv1: "Inverter 2 · phases", inv2: "Inverter 3 · phases",
  };
  const generatorActive = (config, states) => {
    const value = states[config.generator_signal_state]?.state;
    const active = typeof config.generator_signal_active_value === "string" && config.generator_signal_active_value.trim() || "on";
    return typeof value === "string" && !["unavailable", "unknown", ""].includes(value.trim().toLowerCase()) &&
      value.trim().toLowerCase() === active.toLowerCase();
  };

  function powerSources(config, gauge) {
    const source = gauge.source;
    const mode = source === "battery" ? config?.battery_power_mode : config?.generator_power_mode;
    const summed = mode === "inverters" || mode === "channels";
    const primaryOnly = source === "generator" ? !summed : source === "battery"
      && (mode === "total" || !summed && !batterySeparate(config));
    const indices = primaryOnly ? [0] : installedInverters(config);
    return indices.map(index => {
      const invert = gauge.invert ? config?.[inverterField(index, gauge.invert)] === true : false;
      const id = config?.[inverterField(index, gauge.key)];
      // Solar without a total sensor: the card adds up the separate PV inputs (PV1…PV6).
      const strings = source === "pv" && !id
        ? pvInputs.map(n => config?.[inverterField(index, `pv_${n}_power`)]).filter(value => typeof value === "string" && value) : [];
      return {
        index, id, invert,
        ...(strings.length ? { parts:strings.map(part => ({ id:part, invert:false })) } : {}),
        ...(source === "battery" && mode === "channels" ? { parts:[1,2].map(channel => ({
          id:config?.[inverterField(index, `battery_${channel}_power`)], invert,
        })) } : {}),
      };
    });
  }

  const powerParts = (sources) => sources.flatMap(source => source.parts ?? [source]);

  function powerTotal(sources, states, optional = false) {
    const parts = powerParts(sources);
    const ids = parts.map(({ id }) => id).filter(Boolean);
    if (!ids.length) return optional ? 0 : null;
    if (new Set(ids).size !== ids.length) return null;
    const values = parts.map(({ id, invert }) => !id && optional ? 0 : signed(watts(states[id]), invert));
    return values.includes(null) ? null : values.reduce((total, value) => total + value, 0);
  }

  function sumHistory(series) {
    const events = series.flatMap((points, index) => points.map(point => ({ ...point, index })));
    events.sort((a, b) => a.time - b.time);
    const values = new Array(series.length).fill(null);
    const sums = [];
    for (let index = 0; index < events.length;) {
      const time = events[index].time;
      while (events[index]?.time === time) {
        const sample = events[index++];
        values[sample.index] = sample.value;
      }
      sums.push({ time, value: values.includes(null) ? null : values.reduce((a, b) => a + b, 0) });
    }
    return sums;
  }

  function charge(entity) {
    const soc = reading(entity);
    return soc === null || soc < 0 || soc > 100 ? null : soc;
  }

  const percent = (value) => value === null ? "—" : `${Math.round(value)}%`;
  const ampFactors = { a: 1, "а": 1, ma: .001, "ма": .001, ka: 1000, "ка": 1000 };

  function currentTotal(ids, states) {
    if (new Set(ids).size !== ids.length) return null;
    const values = ids.map(id => {
      const entity = states[id];
      const unit = entity?.attributes?.unit_of_measurement?.trim().toLowerCase() || "a";
      const value = reading(entity);
      return value === null || ampFactors[unit] == null ? null : value * ampFactors[unit];
    });
    return values.includes(null) ? null : values.reduce((total, value) => total + value, 0);
  }

  function numericState(state) {
    if (typeof state !== "string" || !state.trim()) return null;
    const value = Number(state);
    return Number.isFinite(value) ? value : null;
  }

  function reading(entity) {
    return numericState(entity?.state);
  }

  function powerFactor(unit) {
    const normalized = typeof unit === "string" ? unit.trim().toLowerCase() : "";
    return normalized === "kw" || normalized === "квт" ? 1000 : 1;
  }

  function watts(entity) {
    const value = reading(entity);
    if (value === null) return null;
    return value * powerFactor(entity.attributes?.unit_of_measurement);
  }

  function signed(value, invert) {
    return value === null ? null : (invert ? -value : value);
  }

  function isGridDisconnected(statusEntity, voltageEntity) {
    if (statusEntity?.state === "off") return true;
    if (statusEntity?.state === "on") return false;
    // Without a status entity: below 20 V on the grid input counts as no grid (inverters often show a few volts of residual voltage).
    const unit = voltageEntity?.attributes?.unit_of_measurement?.trim().toLowerCase() || "v";
    const factor = { v:1, "в":1, mv:0.001, "мв":0.001, kv:1000, "кв":1000 }[unit];
    const volts = reading(voltageEntity);
    return factor !== undefined && volts !== null && volts * factor < gridOffVoltage;
  }

  function formatPower(w) {
    if (w === null) return "—";
    const kw = Math.sign(w) * Math.round(Math.abs(w) / 10) / 100;
    return kw.toFixed(2);
  }

  function gaugePoint(radius, angle) {
    const radians = angle * Math.PI / 180;
    return [radius * Math.cos(radians), radius * Math.sin(radians)].map(n => n.toFixed(3)).join(" ");
  }

  /* ── 0.8.33 · 3D theme: photo-like pictures + a live fill and a light animation layer ──
   * 0.8.35 · the pictures lie next to the card file (3d-*.webp in the same folder, no subfolders): they are assets
   * of the GitHub release, and the Marketplace (HACS) downloads every asset of the release into the card's folder.
   * Nothing is loaded from the internet. */
  const assetBase = (() => { try { return new URL("./", import.meta.url).href; } catch { return "/hacsfiles/deye-lcd-tehnika/"; } })();
  const asset3d = (name) => `${assetBase}3d-${name}.webp?v=${encodeURIComponent(currentVersion)}`;
  const object3d = { solar:"sun", grid:"grid", battery:"battery", house:"house", generator:"generator" };
  const seasonal3d = new Set(["sun", "grid", "house"]);
  const picture3d = (object, night) => asset3d(seasonal3d.has(object) ? `${object}_${night ? "night" : "day"}_summer` : `${object}_${night ? "night" : "day"}`);
  // 0.8.36 · HUD gauge of the 3D theme: a 240° arc open at the bottom, drawn in code (no picture).
  const bezelStart = 150, bezelSweep = 240;
  function arc3d(fraction) {
    const end = bezelStart + fraction * bezelSweep;
    return `M${gaugePoint(gaugeRadius, bezelStart)} A${gaugeRadius} ${gaugeRadius} 0 ${fraction * bezelSweep > 180 ? 1 : 0} 1 ${gaugePoint(gaugeRadius, end)}`;
  }
  const smoke3d = (x, y, dark) => [0, 1, 2].map(k => `<circle class="a3-smoke${dark ? " a3-dark" : ""}" style="animation-delay:${k}s" cx="${x}" cy="${y}" r="2.2" filter="url(#deye-3d-soft)"/>`).join("");
  /*
   * 0.8.36 · energy on the power-line wires: the same particles as on the card's lines (style «Потоки»).
   * Each wire is a small «wire» of the flow engine; its path runs from the far pole to the near one, i.e. towards
   * the centre of the card, so importing power runs «forward» exactly like the Grid line.
   * Points are pixels of the picture, measured on it; the group is scaled down so the particles fit thin wires.
   */
  function poleWires(prefix, wires, map, scale) {
    return wires.map((points, k) => {
      const d = points.map(([cmd, ...xy]) => cmd + xy.reduce((out, value, i) => {
        if (i % 2) return out;
        const [x, y] = map(value, xy[i + 1]);
        return `${out}${out ? " " : ""}${(x / scale).toFixed(2)} ${(y / scale).toFixed(2)}`;
      }, "")).join(" ");
      return `<g class="pole-wire" data-wire="${prefix}${k}" data-flow="off" transform="scale(${scale})" aria-hidden="true"><path class="wire-track" d="${d}"/><g class="flow-layer"></g></g>`;
    }).join("");
  }
  // The separate grid picture (1254 px) inside the gauge: 74 units at (-37,-42).
  const tileGridWires = [
    [["M", 830, 180], ["Q", 630, 341, 430, 350]],
    [["M", 840, 220], ["Q", 640, 387, 440, 385]],
    [["M", 860, 250], ["Q", 655, 435, 450, 420]],
  ];
  // The scene (1536 × 1024 px) covers the card: 0.2617 units per pixel, 1 unit cut on each side.
  const sceneScale = 268 / 1024;
  const scenePoint = (x, y) => [-1 + x * sceneScale, y * sceneScale];
  // 0.8.37 · Orange beacon on the repair truck cab (pictures with no grid).
  const beacon3d = ([x, y], r) => `<g class="beacon3d" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><circle class="bc-halo" r="${(r * 2.6).toFixed(2)}"/><circle class="bc-core" r="${r}"/></g>`;
  const sceneGridWires = [
    [["M", 1340, 280], ["Q", 1262, 340, 1186, 305], ["Q", 1095, 330, 1010, 354]],
    [["M", 1357, 284], ["Q", 1282, 348, 1204, 306], ["Q", 1105, 350, 1010, 376]],
    [["M", 1375, 288], ["Q", 1300, 356, 1224, 304], ["Q", 1115, 365, 1010, 394]],
  ];
  const poleWireNames = [0, 1, 2].flatMap(k => [`pole_tile_${k}`, `pole_scene_${k}`]);

  function anim3d(icon, box = [-37, -42, 74]) {
    const [bx, by, size] = box;
    const P = (u, v) => [(bx + size * u).toFixed(1), (by + size * v).toFixed(1)];
    const pt = (u, v) => P(u, v).join(" ");
    const smoke = (u, v, dark) => smoke3d(...P(u, v), dark);
    if (icon === "solar") {
      const quad = [P(.12, .48), P(.33, .18), P(.84, .31), P(.63, .64)].map(p => p.join(",")).join(" ");
      return `<clipPath id="deye-3d-pv-clip"><polygon points="${quad}"/></clipPath>
        <circle class="a3-sun a3-day" cx="${P(.16, .16)[0]}" cy="${P(.16, .16)[1]}" r="6" filter="url(#deye-3d-soft)"/>
        <g clip-path="url(#deye-3d-pv-clip)"><g transform="skewX(-28)"><rect class="a3-glint" x="${bx - 30}" y="${by}" width="7" height="${size}" filter="url(#deye-3d-soft)"/></g></g>`;
    }
    if (icon === "grid") return "";
    if (icon === "battery") return [.339, .502, .666].flatMap((v, row) => [.307, .33, .352, .375].map((u, k) =>
      `<circle class="a3-led" style="animation-delay:${(k * .25 + row * .08).toFixed(2)}s" cx="${P(u, v)[0]}" cy="${P(u, v)[1]}" r="1.1" filter="url(#deye-3d-soft)"/>`)).join("");
    if (icon === "house") return smoke(.678, .14, false);
    if (icon === "generator") return smoke(.865, .37, true);
    return "";
  }

  function arc(from, to) {
    const start = gaugeStart + from * gaugeSweep;
    const end = gaugeStart + to * gaugeSweep;
    const large = (to - from) * gaugeSweep > 180 ? 1 : 0;
    return `M${gaugePoint(gaugeRadius, start)} A${gaugeRadius} ${gaugeRadius} 0 ${large} 1 ${gaugePoint(gaugeRadius, end)}`;
  }

  const sunRays = Array.from({ length: 16 }, (_, index) =>
    `<path d="M-2.1 -10.1L-.3 -13.3Q0 -13.7 .3 -13.3L2.1 -10.1Z" transform="rotate(${index * 22.5})"/>`
  ).join("");
  const towerArms = [-1, 1].map(direction => `<g transform="scale(${direction} 1)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.5-16 11.5-9v3.8m-7-3.8h7M4.5-5.1l7 7v3.8m-7-3.8h7" stroke-width="1.65"/>
    <path d="M12.2-9.5Q17.9-5.1 24 .2M12.2-4.2Q18.6-.8 24 1.7M12.2 2.4Q18.3 3.2 24 3.3" stroke-width=".8"/>
  </g>`).join("");
  const gearIcon = `
    <path fill-rule="evenodd" d="M13.35 0a13.35 13.35 0 1 0-26.7 0 13.35 13.35 0 1 0 26.7 0ZM8.3 0a8.3 8.3 0 1 0-16.6 0 8.3 8.3 0 1 0 16.6 0Z"/>
    ${Array.from({ length: 12 }, (_, index) =>
      `<path d="M-2.9-12.6-2.65-16.1Q-2.6-16.7-2-16.7h4q.6 0 .65.6l.25 3.5Z" transform="rotate(${index * 30})"/>`
    ).join("")}
    <circle r="3.45"/>`;
  const icons = {
    solar: `<g transform="translate(-10.6 -8.2)" fill="currentColor">
      <circle r="11.15"/>${sunRays}
      <circle r="8.85" fill="none" stroke="${screenWhite}" stroke-width="1.2"/>
      <path d="M-6.65 3.45C-9.25-2.35-4.87-8.22 1.42-7.48C-3.9-6.54-6.96-2.18-6.65 3.45Z" fill="${screenWhite}"/>
    </g>
    <path d="M-10.3-6H16.4L22 12.8H-15.2Z" fill="currentColor" stroke="${screenWhite}" stroke-width="1.25" stroke-linejoin="round"/>
    <path d="M-3.6-6-5.9 12.8M3.1-6l.3 18.8M9.8-6l2.9 18.8M-12 .2h30.3m-32 6.2h33.8" fill="none" stroke="${screenWhite}" stroke-width="1.1"/>
    <path d="M-15.2 13.4H22v2.4H5.8v3l2.5 1.4h4.4v1.7h-18v-1.7h4.7l2.3-1.4v-3h-16.9Z" fill="currentColor"/>`,
    grid: `${towerArms}
    <path d="M-9.9 21.7-4.55 1.6V-16.9Q-4.55-18.65-2.8-18.65h5.6q1.75 0 1.75 1.75V1.6L9.9 21.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M-4.15-17.5 4.15-8.95M4.15-17.5-4.15-8.95M-4.15-8.95 4.15 1.6M4.15-8.95-4.15 1.6
      M-4.15 1.6 7.05 11.7M4.15 1.6-7.05 11.7M-7.05 11.7 9.9 21.7M7.05 11.7-9.9 21.7
      M-4.35-8.95h8.7M-4.35 1.6h8.7M-7.05 11.7h14.1" fill="none" stroke="currentColor" stroke-width="1.18" stroke-linejoin="round"/>
    <rect x="-13.7" y="21" width="27.4" height="3.2" rx=".25" fill="currentColor"/>`,
    battery: `<rect x="-23" y="-9" width="44" height="21" rx="3" fill="none" stroke="currentColor" stroke-width="2.3"/>
    <path d="M22-3h3v9h-3M-17-6 4 8l-2-7 13 4L-6-6l2 5z" fill="currentColor"/>`,
    dual: [-7, 7].map(x => `<g transform="translate(${x} 0)"><rect x="-5.8" y="-9" width="11.6" height="24" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M-2-11h4v2h-4m4 3-6 10h4l-2 7 6-10H0Z" fill="currentColor"/></g>`).join(""),
    house: `<path d="M-24-5 0-18l10 5v-5h5v8l9 5-2 3L0-14-22-2Z" fill="currentColor"/>
    <path d="M-18-1 0-11l18 10v21h-36zm10 5v12h6V4zm10 0v12h6V4zM-19 23h38l3 3h-44z" fill="currentColor" fill-rule="evenodd"/>`,
  };

  function technikaGlow(id, deviation, opacity) {
    return `<filter id="deye-technika-${id}" x="-55%" y="-55%" width="210%" height="210%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${deviation}" result="halo"/>
      <feComponentTransfer in="halo" result="softHalo"><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer>
      <feMerge><feMergeNode in="softHalo"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  }

  const technikaDefinitions = `
    <radialGradient id="deye-technika-status" cx=".43" cy=".34" r=".75">
      <stop stop-color="#667847"/>
      <stop offset=".55" stop-color="#4f6333"/>
      <stop offset="1" stop-color="#374728"/>
    </radialGradient>
    <radialGradient id="deye-technika-face" cx=".4" cy=".31" r=".76">
      <stop offset="0" stop-color="#fbfbe8"/>
      <stop offset="0.55" stop-color="#e5ebc7"/>
      <stop offset="1" stop-color="#b7c48f"/>
    </radialGradient>
    <linearGradient id="deye-technika-power" gradientUnits="userSpaceOnUse" x1="-33" y1="0" x2="34" y2="0">
      <stop offset="0" stop-color="#64832d"/>
      <stop offset=".37" stop-color="#8ca935"/>
      <stop offset=".64" stop-color="#b99239"/>
      <stop offset="1" stop-color="#ca6e3c"/>
    </linearGradient>
    <linearGradient id="deye-technika-icon-dark" x1="0" y1="0" x2=".18" y2="1">
      <stop offset="0" stop-color="#73814c"/>
      <stop offset="0.48" stop-color="#535f38"/>
      <stop offset="1" stop-color="#313b21"/>
    </linearGradient>
    <linearGradient id="deye-technika-icon-light" x1="0" y1="0" x2=".18" y2="1">
      <stop offset="0" stop-color="#fbfbe4"/>
      <stop offset="0.53" stop-color="#d8dfac"/>
      <stop offset="1" stop-color="#a5b37a"/>
    </linearGradient>
    <clipPath id="deye-technika-face-cut" clipPathUnits="userSpaceOnUse">
      <path d="M-48-48H48V19.5H32Q25 28.5 19.2 28.5H-19.2Q-25 28.5-32 19.5H-48Z"/>
    </clipPath>
    <radialGradient id="deye-technika-sun" cx=".34" cy=".27" r=".78">
      <stop offset="0" stop-color="#FFE09A"/>
      <stop offset=".59" stop-color="#EAC16B"/>
      <stop offset="1" stop-color="#C49346"/>
    </radialGradient>
    <linearGradient id="deye-technika-gear" x1=".20" y1="0" x2=".67" y2="1">
      <stop offset="0" stop-color="#8a9961"/>
      <stop offset=".38" stop-color="#6b794a"/>
      <stop offset=".62" stop-color="#4e5c33"/>
      <stop offset="1" stop-color="#3a4827"/>
    </linearGradient>
    <mask id="deye-technika-gear-hole" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-22" y="-22" width="44" height="44">
      <rect x="-22" y="-22" width="44" height="44" fill="#fff"/>
      <circle r="5.36" fill="#000"/>
    </mask>
    <linearGradient id="deye-technika-gear-bevel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b4632"/>
      <stop offset="1" stop-color="#b6c398"/>
    </linearGradient>
    ${technikaGlow("ring-light", 1.1, .75)}
    ${technikaGlow("ring-dark", 2.25, 1.65)}
    ${technikaGlow("dot-light", 1.2, .75)}
    ${technikaGlow("dot-dark", 2.2, 1.65)}
  `;
  const technikaIcons = {
    solar: `
      <g stroke-width="1.08" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="-12.7" cy="-9.9" r="6.2" fill="url(#deye-technika-sun)" stroke="#A07035" stroke-width=".85"/>
        <path d="M-12.7-19.5v2.05m-6.8-.2 1.4 1.45m-4.45 6.3h2.1m.5 6.55 1.5-1.45m12.4-12.85-1.4 1.45m4.1 6.3h-2.05" fill="none" stroke="#A07035" stroke-width="1.1"/>
        <path d="M-12-3h27l6 16h-39z" fill="url(#deye-technika-icon-dark)" stroke="#3e4929"/>
        <path d="M-12.1-2.6h27.7" fill="none" stroke="#f5f8df"/>
        <path d="M-14.6 5h32.7M-3.1-2l-2.3 14M6.5-2l2.2 14" fill="none" stroke="#C3D9CC"/>
        <path d="M1.5 13v6m-8 0h16" fill="none" stroke="#3e4929" stroke-width="2"/>
      </g>`,
    grid: `
      <g fill="none" stroke="#3e4929" stroke-width="1.12" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-22-9q4 3 9 .5q13 11 26 4q4 2.5 8.4 1.0                M-21-3.8q3 2.4 8 1.1q13 9.4 26 3.1q4 2.2 8 1.3" stroke="#3e4929" stroke-width="1.16"/>
        <path d="M-13.7-19h2.9l.35 39h-3.7zM12.0-14h2.2l.3 31.5h-2.8z" fill="url(#deye-technika-icon-dark)" stroke-width=".8"/>
        <path d="M-13.05-16.7l-.25 33.4m25.8-28.6-.18 27.4" stroke="#e6ebc9" stroke-width=".85"/>
        <path d="M-19.8-12.8h15.4m-.8 0v2.8m-13.8-2.8v2.8m-1 2.7h14.1                M8.1-8.4h10.4m-.7 0v2.1m-8.9-2.1v2.1m.6 2.3h7.5" stroke-width="1.45"/>
        <path d="M-15.4 20.2h6.4m20-2.5h5.3" stroke-width="1.3"/>
      </g>`,
    battery: `
      <g stroke-width="1.08" stroke-linecap="round" stroke-linejoin="round">
        <rect x="-20" y="-9" width="38" height="19" rx="3.5" fill="url(#deye-technika-icon-light)" stroke="#3e4929" stroke-width="1.6"/>
        <rect class="bat-fill" x="-18.4" y="-7.4" width="0" height="15.8" clip-path="url(#deye-bat-clip)" stroke="none"/>
        <path class="bat-glass" d="M-17.5-6.8h33.2q1 0 1 1v2.2q-17.6 2.6-35.2 0v-2.2q0-1 1-1z" fill="#fff" opacity=".38" stroke="none"/>
        <path d="M18-3h4v7h-4z" fill="#486F59" stroke="#3e4929"/>
        <path class="battery-bolt" d="M2.3-6-6.6 1.5h6L-2.1 7l8.9-8.6H1z" fill="url(#deye-technika-icon-dark)" stroke="#fff" stroke-width=".9" paint-order="stroke"/>
      </g>`,
    house: `
      <g stroke-width="1.08" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-15 1 0-12 15 1v19h-30z" fill="url(#deye-technika-icon-light)" stroke="#3e4929"/>
        <path d="m-21 1 21-18 9 7.7v-4.7h3.6v7.6L21 1l-2.4 2.6L0-12-18.6 3.6Z" fill="url(#deye-technika-icon-dark)" stroke="#3e4929"/>
        <path d="M-18.3 1.1 0-15l10.1 8.7" fill="none" stroke="#D3E2CD" stroke-opacity=".76"/>
        <path d="M-4 10h8v10h-8z" fill="#394927"/>
        <rect x="-12.7" y="3.2" width="6" height="7.2" rx=".65" fill="#f1f3d4" stroke="#394927" stroke-width="1"/>
        <path d="M-11.95 6.8h4.5" fill="none" stroke="#394927" stroke-width=".75"/>
        <rect x="6.7" y="3.2" width="6" height="7.2" rx=".65" fill="#f1f3d4" stroke="#394927" stroke-width="1"/>
        <path d="M7.45 6.8h4.5" fill="none" stroke="#394927" stroke-width=".75"/>
      </g>`,
  };
  const technikaGearShape = "M-4.28 -11.75L-2.85 -12.17L-2.33 -15.02L-1.87 -15.69L1.87 -15.69L2.33 -15.02L2.85 -12.17L4.28 -11.75L5.64 -11.16L7.87 -13.00L8.65 -13.22L11.52 -10.82L11.44 -10.01L10.01 -7.49L10.83 -6.25L11.49 -4.92L14.39 -4.90L15.13 -4.57L15.78 -0.88L15.20 -0.32L12.48 0.70L12.31 2.17L11.97 3.61L14.17 5.50L14.52 6.22L12.65 9.46L11.85 9.52L9.11 8.56L8.03 9.58L6.84 10.46L7.32 13.32L7.12 14.10L3.61 15.38L2.95 14.91L1.48 12.41L0.00 12.50L-1.48 12.41L-2.95 14.91L-3.61 15.38L-7.12 14.10L-7.32 13.32L-6.84 10.46L-8.03 9.58L-9.11 8.56L-11.85 9.52L-12.65 9.46L-14.52 6.22L-14.17 5.50L-11.97 3.61L-12.31 2.17L-12.48 0.70L-15.20 -0.32L-15.78 -0.88L-15.13 -4.57L-14.39 -4.90L-11.49 -4.92L-10.83 -6.25L-10.01 -7.49L-11.44 -10.01L-11.52 -10.82L-8.65 -13.22L-7.87 -13.00L-5.64 -11.16Z";


  function technikaGear(dark) {
    const outline = dark ? "#748451" : "#3e4929";
    const face = technikaGearShape + (dark ? "" : " M-5.55 0a5.55 5.55 0 1 1 11.1 0a5.55 5.55 0 1 1 -11.1 0Z");
    const center = dark
      ? '<circle r="5.83" fill="none" stroke="url(#deye-technika-gear-bevel)" stroke-width=".82" stroke-opacity=".94"/>'
      : `<path d="M-5.9 .7A5.95 5.95 0 0 1 4.65-3.72" fill="none" stroke="#223d33" stroke-width="1.4" stroke-linecap="round"/>
         <path d="M5.59 2.05A5.95 5.95 0 0 1-4.55 3.86" fill="none" stroke="#d5dfb4" stroke-width="1.08" stroke-linecap="round" opacity=".66"/>`;
    return `<g class="technika-gear-${dark ? "dark" : "light"}"${dark ? ' mask="url(#deye-technika-gear-hole)"' : ""}>
      <path d="${face}" fill="#1c3a2f" fill-rule="evenodd" opacity=".13" transform="translate(.65 1.75)" stroke="#1c3a2f" stroke-width="1.45" stroke-linejoin="round"/>
      <path d="${face}" fill="${dark ? "#2c4538" : "#394927"}" fill-rule="evenodd" transform="translate(.22 1.1)" stroke="${dark ? "#bdc894" : outline}" stroke-width="1.25" stroke-linejoin="round"/>
      <path d="${face}" fill="url(#deye-technika-gear)" fill-rule="evenodd" stroke="${outline}" stroke-width="1" stroke-linejoin="round"/>
      <path d="${technikaGearShape}" transform="scale(.91)" fill="none" stroke="${dark ? "#eaf2d1" : "#d2e6d3"}" stroke-width=".88" stroke-linejoin="round" opacity=".42"/>
      ${center}
    </g>`;
  }

  const technikaBackground = "data:image/png;base64,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";

  const graphiteBackground = "data:image/png;base64,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AAILAEBgAQAgsAAABBYAgMACAEBgAQAILACADjS5k/v0ph+2qAYAamMECwAgWZMjWEatAICaGcECAEj2dAigda+rEqffeRj0BTidESwAgGRGsKB5rwNUhqwABBaQz24mABcyRQid1xUA5zOCBX3WlVErAIEFpJFWAJczRQj9iwiThgBnMoIFfRbV8MUwmmVMC0BgAXspKoBrmSIEABBYAAACCwBAYAG0x8WSQD0scgcqraXHytX6lvYDAgtALQHdMkUIACCwAAAEFgCAwAIAQGABAAgsAACBBQCAwAIAEFgAAAILAACBBQAgsAAABBYAgMACAEBgAQAILAAAgQUAgMACABBYAAACCwAAgQUAILAAAAQWAAACCwBAYAH0IyIiwnGAjj0dAoCTlVIcBOibESwAAIEFACCwAAAEFgBns/IdemKRO0AVrHyHnhjBAgAQWADnMnMHCCyAZCbvAIEFACCwALiOqxfhCK4iBO6eF8MX++cBXzOliblFE6AgsADqzQulAoxMEQK0yuweVMsIFkCrjJmBwAIOMQxgONFW8hexJ33ejkX5mwWBBVzACbihv4i3Nby/zNQ2CCyAO5pWVES8baCfYZR4wSMgsCDhrOaERA22ddVj8dDU8APTmPPMB4EFJ53PoLmn4qpf7mkPNbBNAwCAwAIAqJspQoB89lwAgQVAsu97MQACC4Cc3krc8goQWAB3Z8cQEFgAJNNVcDeuIgQAEFgAAAILAEBgAQAgsAAABBYAgMACAEBgAQAILAAAgQUAgMACABBYAAACCwBAYAEAILAAAAQWAIDAAgBAYAEACCwAAIEFAIDAAgAQWAAAAgsAAIEFACCwAAAEFgCAwAIAQGABAAgsAACBBQCAwAIAEFgAAAILAACBBQAgsAAABBYAAAILAEBgAQAILAAAgQUAgMACABBYAAACCwAAgQUAILAAAAQWAAACCwBAYAEACCwAAAQWAIDAAgAQWAAAAgsAAIEFACCwAAAEFgAAyzwdAg4VEa/fLKU4MgAILEigqwAQWCCtAEBgIa0AoAIWuQMACCwAAIEFACCwAAAQWAAAAgsAQGABACCwoHFvbzQEgMACtrNNK4DAAgBAYAEACCwAAIEFACCwAAAQWAAAAgsAQGABACCwAAAEFgCAwAIAQGABAAgsAACBBQAgsBwCAACBBQBQtb9cC9eSNaxlugAAAABJRU5ErkJggg==";

  const smokedLightBackground = "data:image/webp;base64,UklGRrIFAABXRUJQVlA4IKYFAADwUwCdASpYApIBPikUiUOhoSEQBAAYAoS0t34+RAzork7ZlmpbCzDf//2AubGVIB8/6kfP25W2h90dnflv3AJ7DERcnIwfbJx5vUbzbHKLRudYcIS//lfIu7HBvlfylVQUV3t2nz2jFPXf09YhUHAnnNVsVLBuI8GqRWhPUQpXy3pyKT0uQe1gPI3gd6e/CHvHEtw8ECwr+cRI3raEJez9VwPJ6p3jbsFh3Ov4lKYeCgQrjoZ9BvJIqkESs9cpzhIgB/c5nXGM3aamo7L1GSiIZFJ4oN+9eNyCpTQRzwcURoOQW1zJPZpg8lGYYYyCXcU43I1Hzbv3h3NZI1Cjpc1RWCfiFENVFyZJyF5iRPislJESDWrmDAiXt04H3Qp0ETfyepkrg3+m9dKpEOpWQ5MnWcDAaIVkOeRFpEGUFZQ+bZ7tcm4c7SGcL+hn/8MeI1mzv3nlrdXMn/xqPwTXATQ0HteBEocbk6ITB1gauMnvQtnu1xlnBoek34KlAZacGu2thhVwIQIFhbCQYSntMpqQJRQK2QpLIVkaGsI+NyeMp2pRBd67sylxlwb6T51IJFJKwxLfw0ZMxlStldRDIiIs3NASu/NTK/6N6FC4/XE2tZc14C7IS7z1FEeJ9d0rAUwLrcmrXM9z3w07Tk4LteoqTqfZO+ITaof4qhvRBbHEFiC0JA96VOLIfobvPOkEWgoo5pjTUOxJpC/43GEc6Kzg4upeS8qBZZEZqcYECdTVqmODRKBkOeX2m5qKn7zzKf7eT7p79aHfXd9tU8Ye1ESLP49tDd56aYB3xB9Khuj7GcR3QKA6Rg3TjIRBkufvPUVP2XkUQoU5BFS28ZLgoCub5v/oUcILpECBDRTXe8/4RM3iRQZ3TAn2qJtVhOz2lPki4IF4iJXIoAD+4dV5iCtiM/HkUQQkRdJl/bxCjM7TXE2F5PZbFRTFz7Mxdzepuk42s21BCJ8s2IfUgxrIR1IH0fPsRDWFM5Ih88cdgLbQeAnSU2CZLBt2VhrXRJOanRB2NOK5SMOQPLuN+N1D1dGTAjV3mgAa/iYMnKxo/OHdcdh9mToRu1jGhxAOCf8/DWhSVfI5qpgqGwRQsFCM7bcg7pwq9siQCQeKSwnBvvLlA9LYXg3O7yzueSxHBDv73L2qZJyZs3VWMhPLKeXe/7c5NnLHD0g8fAzWcl5bjvvW23EN5Ni85q8ADDm1mWuoDnoR6cfuvlO8fzjvw2zRsR+JAZxwcFybSO7KxcS81qtiTfSKWntFnAi9BiCYJp6KgNLV9ILiUl7iZRuqPS81e6G3T6yABgdi6MZQ0VPRxUGcY8jZoxxpuG3R/a8D97xEOb6Q/ZZgtkYUhBRCVMYDl7dUVcvK1+3sSMIUTgjVRItf0GKgMHh1a9GYhxB0mO+VGDK2ehp3ZYXXgbyFoJMOLhwQ7la496rYtXqaBufcx02t5axnxb7pY7a19VuR6NbH409qEXJjv7QZ4OPCnbp2MMzLTfe0+As03ZrOqtya04ppvikZxBbSp7Ay50w1iuntSt63SJvhJbJF1rTKsibAm29SOBZjZyYwsDqvSo/7RmGm0Pep6V0pbEc2vIMqzqnRR8TArgATdCa5eBsAzmJDMV+8Xke1QiLzrDY9zxN6hr0dIBWPlAJbryqPBVfiKmACmCK/fdQwlcBysjGnr8AyftRVnYIu6Ubpprjh1aXsg7MXDsat5jUikXEu+Y0dcdq2xWZNA9D3z92fAj4Bq9CiNDefgE+8wPsQYmJwAm3+ml7eKABVIgDkPqRXP9TUKXtVFTRp0coRNhfFgoWFP1KegYFAcfAVLyZ7d1fY8feSFxgl7V/UBWBTw8gC1FX5D5n0E39HXGBZzh9+74AcIFKMCEMoGlR/uDwIxGbs70BsBYAQKgKty9j8AcfIZ4KgDiyy6cEw/QDYAAA=";
  const smokedDarkBackground = "data:image/webp;base64,UklGRpoDAABXRUJQVlA4II4DAADwRwCdASpYApIBPikUiUOhoSEQBAAYAoS0t34+PbxbVyf9X/6C9j7PqOvPgb+b9wCs3a8XJyHvtk5D32ych77ZOQ99snIe+sT1CkBnjoKGdexSzPlECyXa8XJx/KUu2mII1oixcnIe+sQilLtdwo1s2qTaLxlbU2rJ4iImkiJpjEUzdIqzVUEci4/bHvHeEiUKd04FA15Klgkiq7JU7WBF6hUTCiUKIlsiaaU1bVCiuYiqQQosh/P5FAlSEiJ/KlpQsDymUIo7tLnauE3WdnDCITENGl3M8g/TpUaFPEiOyGrMTaErfSfp7u5NmU9dUOS6i4Mf6/Akit/iYDgn6dKImHWUE5S52yYlZNxeyE2DjgJTZe0EIpSltKHsPZ/A+Lp0XqkETgzReeWtBE8R4jyhQGiG61ygEEMp7TpREyr8a45MSggoLmxNqmKQzDztjpAiIhkRR90pZ6IM6ygmVgqclgPwFLtRU/eYhFdYS9KQRKIDnEUxwkDPzMtBWAFFLGanoGMqohT/KVJkoZqCiNv0biY6YQptvQIFFPpS6MZsSnlMXItOIdRGd4hEMvn4/oxmysSuEHGXuZ/g9/cJUiJwXrxlLlIwKkaUPYiC7sxuesp08URFwLRERMsfBN9GCJQonCZ24vXQ9eAhEq62cR4h1cCGAXtTsqTBygicGDnNE9/plECAgWv59h9Xw5giVwgv3NEQilLtyGj8/3tkxIifWGlQLRzMREREOoi5OFRDIppS6NURcnDG6CREREQyIiImmNLAPWp2AAD+8RbdW52HpqyAQ/JIQnB1Yc1wWPt6O/HC2NmgufnVJFIKGs+aTEpLAABUGTxScL2mKdgmMZiduHXx1kgfuwE494tSMRpxRqQbl93UVoADnvNh3HndGcVz2ps5c93ur1p9PBygWSgX3dpqPMxGsISlzvojXvA4jkw6CrKmMj5WtZmi20Ou19uFjDS0CqOrf0gDM0W2h0ZFdM//Q3xriKXroN9Ok+U6+hchE8C1Vxt0fLKGKbcd2FzYlA47g22bFpeSuoox1llvCMaThAj332rLkrpLS9GavOJqKeWHrugQ3aubrGxIseWQehQ5418hXo6t3309naJjwW6Pgdv3RlLv+NslOXosfQBt8R0SzUS5KD4MaxVLtIpVprByYzA9Lvjiypnfyz6h32gPRFwAAc3JWh50ShdJEDsKJh2ACoD5YytMAAAA";

  const generatorIcon = '<path fill="currentColor" fill-rule="evenodd" d="M55 1L78 1L78 2L80 2L80 1L85 1L85 2L86 2L86 10L82 10L82 11L81 11L81 16L79 16L79 15L78 15L78 16L71 15L71 16L69 16L69 17L68 17L68 16L58 16L58 15L57 15L57 11L52 8L52 4L53 4ZM30 25L109 25L109 26L118 34L119 37L134 37L135 39L137 39L137 96L120 96L119 98L117 98L117 99L115 99L114 101L112 101L112 102L105 108L105 110L102 112L102 115L100 116L100 128L99 128L99 129L100 129L100 133L99 133L99 134L50 134L50 135L49 135L47 138L45 138L44 141L43 141L42 143L40 143L39 145L15 145L15 135L14 135L14 134L11 134L10 132L8 132L8 131L3 127L3 122L2 122L2 117L1 117L1 116L2 116L2 115L1 115L1 114L2 114L2 112L1 112L1 111L2 111L2 109L1 109L1 108L2 108L2 105L1 105L1 102L2 102L2 100L1 100L1 99L2 99L2 89L1 89L1 87L2 87L2 86L1 86L1 84L2 84L2 82L1 82L1 79L2 79L2 77L1 77L1 73L2 73L2 72L1 72L1 71L2 71L2 67L1 67L1 65L2 65L2 63L1 63L1 59L2 59L2 57L1 57L1 54L2 54L2 53L1 53L2 41L3 41L3 38L6 38L6 37L19 37ZM11 43L9 44L9 55L8 55L8 57L9 57L9 59L8 59L8 60L9 60L9 85L8 85L8 87L9 87L9 88L26 88L26 89L28 89L28 88L130 88L130 87L131 87L131 44L130 44L130 43ZM78 55L85 55L85 56L86 56L86 59L88 60L88 62L90 63L90 66L91 66L91 69L90 69L89 73L88 73L87 75L84 75L84 76L81 76L81 77L78 76L78 75L76 75L76 74L73 72L73 63L74 63L75 60L77 59L77 56L78 56ZM105 55L113 55L113 56L114 56L114 59L116 60L116 63L118 64L118 70L116 71L116 73L115 73L114 75L109 76L109 77L106 76L106 75L103 75L103 73L101 72L101 69L99 68L99 66L101 65L101 62L104 60L104 56L105 56ZM28 56L29 56L29 57L44 57L44 56L47 56L47 57L48 57L48 56L54 57L56 60L58 60L58 71L55 73L55 75L23 75L23 74L20 72L20 60L21 60L22 58L28 57ZM23 95L22 95L22 96L20 97L20 99L19 99L19 101L20 101L19 103L22 104L22 105L33 105L33 104L34 104L34 105L37 105L37 104L38 104L38 105L41 105L41 104L42 104L42 105L48 105L48 104L50 104L50 105L56 105L56 104L59 103L59 97L56 96L56 95ZM127 104L133 105L133 106L135 106L135 107L138 106L140 109L142 109L142 110L146 113L146 115L148 116L149 121L150 121L150 123L151 123L151 131L149 132L148 138L147 138L141 145L139 145L138 147L132 147L132 148L121 147L120 145L118 145L117 143L115 143L115 142L113 141L113 139L111 138L111 135L110 135L110 133L109 133L109 130L108 130L108 122L110 121L110 118L111 118L111 115L113 114L113 112L114 112L116 109L118 109L118 108L120 108L120 107L122 107L122 106L125 106L125 105L127 105ZM23 111L19 114L19 116L20 116L19 120L20 120L20 121L58 121L58 120L59 120L59 112L58 112L58 111ZM127 115L126 115L125 117L122 117L121 120L119 121L119 123L118 123L118 131L121 133L121 135L122 135L123 137L133 138L133 137L135 137L136 135L138 135L139 132L141 131L141 122L138 120L137 117L134 117L133 115Z"/>';
  function generatorMarkup() {
    const text = pair("Generator", "Генератор");
    return `<g class="generator" data-generator hidden role="button" tabindex="0" ${textAttributes(text, "label")} aria-label="Генератор">
      <title ${textAttributes(text)}>Генератор</title>
      <path class="generator-connector" d="M193 173v28"/>
      <text class="generator-status" x="171" y="184" ${textAttributes(pair("Signal", "Сигнал"))}>Сигнал</text>
      <text class="generator-status" x="171" y="198" ${textAttributes(pair("on", "увімк."))}>увімк.</text>
      <text class="generator-amount" x="227" y="185" data-generator-power>—</text>
      <text class="unit" x="227" y="198">KW</text>
      <g class="gen-icon" transform="translate(178.4 204.6) scale(.3495)">${generatorIcon}</g>
      <g class="look3d-only" aria-hidden="true"><image class="obj3d gen3d" x="168" y="190" width="58" height="58" data-obj3d="generator"/><g class="anim3d">${anim3d("generator", [168, 190, 58])}</g></g>
      <rect class="hit" x="151" y="169" width="93" height="91" rx="5" fill="transparent"/>
    </g>`;
  }

  function dialIcon(icon) {
    const technika = icon === "dual" ? [-7, 7].map(x => `<g transform="translate(${x} 0)">
      <rect x="-5.3" y="-9" width="10.6" height="24" rx="1.8" fill="url(#deye-technika-icon-light)" stroke="#3e4929" stroke-width="1.1"/>
      <path class="battery-bolt" d="M-2-11h4v2h-4zM-1 0l-3 5.6h3l-.9 4.5 4.6-6.1H.1L1.1 0z" fill="url(#deye-technika-icon-dark)"/>
    </g>`).join("") : technikaIcons[icon];
    return `<g class="classic-only">${icons[icon]}</g><g class="technika-only" aria-hidden="true">${technika}</g>`;
  }

  function gauge({ key, label, english, icon, x, y }) {
    const isBattery = key === "battery_power";
    const track = arc(0, 1);
    return `<g class="gauge" data-gauge="${key}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${label}" ${textAttributes(pair(english, label), "label")} aria-controls="details-screen">
      <title ${textAttributes(pair(english, label))}>${label}</title>
      <rect class="hit" fill-opacity="0" x="-54" y="-47" width="108" height="107" rx="4"/>
      <g class="look3d-only" aria-hidden="true">
        <g class="sep3d">
          <image class="obj3d" x="-37" y="-42" width="74" height="74" data-obj3d="${object3d[icon] ?? ""}"/>
          <g class="anim3d">${anim3d(icon)}</g>
          ${icon === "grid" ? poleWires("pole_tile_", tileGridWires, (x, y) => [-37 + 74 * x / 1254, -42 + 74 * y / 1254], .55) : ""}
          ${icon === "grid" ? beacon3d([-37 + 74 * 552 / 1254, -42 + 74 * 860 / 1254], .65) : ""}
        </g>
        <path class="hud-track" d="${arc3d(1)}"/>
        <path class="hud-glow" stroke="url(#deye-3d-hud)" filter="url(#deye-3d-glow)"/>
        <path class="hud-edge"/>
        <path class="hud-fill" stroke="url(#deye-3d-hud)"/>
        <ellipse class="under3d" cx="0" cy="${isBattery ? 40 : 45}" rx="${isBattery ? 33 : 30}" ry="${isBattery ? 24 : 18}" fill="url(#deye-3d-under)"/>
      </g>
      <circle class="technika-only" r="36.65" fill="url(#deye-technika-face)" stroke="#f8f9e7" stroke-width=".55" stroke-opacity=".569" clip-path="url(#deye-technika-face-cut)" aria-hidden="true"/>
      <path class="technika-only" d="${track}" fill="none" stroke="#3e423e" stroke-width="9" stroke-linecap="round" aria-hidden="true"/>
      <path class="track" d="${track}"/>
      <path class="fill" fill="none" stroke="url(#deye-lcd-arc)"/>
      <path class="technika-only fill-gloss" fill="none" stroke="url(#deye-technika-gloss)" stroke-width="8.4" stroke-linecap="round" aria-hidden="true"/>
      <g class="symbol ${isBattery ? "single-battery" : ""}" transform="translate(0 ${isBattery ? "11" : "0"})">${dialIcon(icon)}</g>
      ${isBattery ? `<g class="dual-battery">
        <g class="symbol" transform="translate(0 4) scale(1.45)">${dialIcon("dual")}</g>
        <text class="soc-side" x="-43" y="-33" data-soc-left="">—</text>
        <text class="soc-side" x="43" y="-33" data-soc-right="">—</text>
      </g><text class="soc single-battery" x="0" y="-10" data-soc="">—</text>
      <g class="bat-time" data-bat-time hidden aria-hidden="true"><g class="bat-clock"><circle r="3.4"/><path d="M0 -1.9V0L1.4 .9"/></g><text x="5.2" y="3.2" data-bat-time-text=""></text></g>` : ""}
      <text class="scale" x="-46" y="46" text-anchor="middle">0</text>
      <text class="scale" x="47" y="46" text-anchor="middle" data-scale="">${defaultModel.toFixed(1)}</text>
      <text class="value" x="0" y="46">—</text>
      <text class="unit" x="0" y="57">KW</text>
    </g>`;
  }

  function flowArrows([x, y], bendX, direction) {
    // Use the same endpoint as the wire, with the point facing away from its nearest bend.
    const sign = Math.sign(x - bendX);
    const base = x - sign * 7;
    const tail = x - sign * 8;
    const notch = x - sign * 5.6;
    return `<path class="classic-only arrow ${direction}" d="M${base} ${y - 3}L${x} ${y}L${base} ${y + 3}Z"/>
      <path class="technika-only technika-arrow ${direction}" d="M${x} ${y}L${tail} ${y - 3.8}L${notch} ${y}L${tail} ${y + 3.8}Z"/>`;
  }

  function wire({ name, from, bendX, to }, index) {
    const path = `M${from.join(" ")}H${bendX}V${to[1]}H${to[0]}`;
    return `<g class="wire" data-wire="${name}" data-flow="off">
      <path class="wire-track" d="${path}"/>
      ${flowArrows(to, bendX, "forward")}${flowArrows(from, bendX, "backward")}
      <circle class="classic-only dot forward" r="2.8"><animateMotion dur="2s" path="${path}" repeatCount="indefinite"/></circle>
      <circle class="classic-only dot backward" r="2.8"><animateMotion dur="2s" path="${path}" repeatCount="indefinite" calcMode="linear" keyTimes="0;1" keyPoints="1;0"/></circle>
      <g class="technika-only flow-layer" aria-hidden="true"></g>
      ${name === "grid" ? `<g class="grid-outage" role="img" aria-label="Мережу від’єднано">
        <g class="outage-legacy">
          <text x="259" y="77">Off grid</text>
          <path d="M254 102h10v13h-10z" fill="${screenWhite}"/>
          <path d="M255 103l8 11m0-11-8 11" fill="none" stroke="currentColor" stroke-width="2.3"/>
        </g>
        <g class="look3d-only outage-x" transform="translate(259 108.5)">
          <g class="ox-pulse"><path d="M-4.5 -4.5 4.5 4.5M4.5 -4.5 -4.5 4.5"/></g>
          <path class="ox-glow" d="M-4.5 -4.5 4.5 4.5M4.5 -4.5 -4.5 4.5" filter="url(#deye-3d-glow)"/>
          <path class="ox-core" d="M-4.5 -4.5 4.5 4.5M4.5 -4.5 -4.5 4.5"/>
        </g>
      </g>` : ""}
    </g>`;
  }

  function onActivate(element, action) {
    element.addEventListener("click", action);
    element.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      action();
    });
  }

  const measurementMarkup = '<span data-metric-value>—</span><small data-metric-unit></small>';

  function breakdownMarkup({ key, title, columns, fields }) {
    const invColumn = index => key === "inverters" ? ` data-inv-column="${index}"` : "";
    return `<div class="details-breakdown" data-breakdown="${key}" hidden>
      <table>
        <caption>${translated(pair(groupEnglish[key], title))}</caption>
        <thead><tr><th scope="col">${translated(pair("Reading", "Показ"))}</th>${columns.map(({ label }, index) => `<th scope="col"${invColumn(index)}>${
          key === "batteries" ? translated(pair(`Battery ${index + 1}`, label)) : label}</th>`).join("")}</tr></thead>
        <tbody>
          ${fields.map(({ key: metric, label }) => `<tr data-detail-row="${metric}">
            <th scope="row">${translated(pair(metricEnglish[metric], label))}</th>
            ${columns.map(({ prefix }, index) => `<td data-reading="${prefix}_${metric}"${invColumn(index)}>${measurementMarkup}</td>`).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
  }

  function measurementNodes(row, field) {
    return { ...field, row, value: row.querySelector("[data-metric-value]"), unitText: row.querySelector("[data-metric-unit]") };
  }

  function renderMeasurement({ key, unit, row, value, unitText }, id, states, invert, english) {
    const entity = states[id];
    const unitName = entity?.attributes?.unit_of_measurement;
    const power = key === "power";
    const amount = power ? signed(watts(entity), invert) : key === "soc" ? charge(entity) : reading(entity);
    value.textContent = amount === null ? "—" : (english ? englishMeasurementFormat : measurementFormat).format(power ? amount / 1000 : amount);
    const englishUnits = { "А": "A", "В": "V", "кВт": "kW" };
    unitText.textContent = amount === null ? "" : english ? (power ? "kW" : unitName ?? englishUnits[unit] ?? unit)
      : power ? unit : measurementUnits[unitName] ?? unitName ?? unit;
    row.title = amount === null ? id ? english ? "Reading unavailable" : "Показ недоступний"
      : english ? "No entity selected" : "Сутність не вибрано" : "";
  }

  function detailsMarkup() {
    const back = pair("Back", "Назад");
    return `<section class="details-screen" id="details-screen" aria-labelledby="details-title" hidden>
      <header class="details-header">
        <button type="button" class="details-back" aria-label="Назад" title="Назад" ${textAttributes(back, "label")}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6m-6-6h12"/></svg>
        </button>
        <h2 id="details-title" tabindex="-1"></h2>
      </header>
      <div class="details-body" data-details-body></div>
      <section class="details-history" aria-labelledby="details-history-title">
        <div class="details-history-head">
          <h3 id="details-history-title">Потужність за 24 год</h3>
          <div class="details-history-tools">
            <button type="button" class="details-back details-history-toggle" data-history-reset hidden></button>
            <button type="button" class="details-back details-history-toggle" data-history-month aria-pressed="false">${translated(pair("Month", "Місяць"))}</button>
            <button type="button" class="details-back details-history-toggle" data-history-toggle aria-pressed="false" hidden>${translated(pair("Individual", "Окремо"))}</button>
          </div>
        </div>
        <p class="history-message" role="status"></p>
        <div class="history-chart" hidden></div>
      </section>
    </section>`;
  }

  function dateFormatter(locale, options, timeZone) {
    try {
      return new Intl.DateTimeFormat(locale, { ...options, timeZone });
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      const alias = timeZone === "Europe/Kyiv" ? "Europe/Kiev" : undefined;
      return new Intl.DateTimeFormat(locale, { ...options, timeZone: alias });
    }
  }

  function historyPoints(rows, start, end, defaultUnit, invert) {
    if (!Array.isArray(rows)) return [];
    let factor = powerFactor(defaultUnit);
    const points = [];
    for (const row of rows) {
      const stamp = row.lu ?? row.lc ?? row.last_updated ?? row.last_changed;
      const timestamp = typeof stamp === "number" ? stamp * 1000 : Date.parse(stamp);
      if (!Number.isFinite(timestamp) || timestamp > end) continue;
      const unit = (row.a ?? row.attributes)?.unit_of_measurement;
      if (unit) factor = powerFactor(unit);
      const value = numericState(row.s ?? row.state);
      const point = { time: Math.max(start, timestamp), value: signed(value === null ? null : value * factor / 1000, invert) };
      if (points.at(-1)?.time === point.time) points.pop();
      points.push(point);
    }
    return points;
  }

  function plotSamples(points, start, end, columns) {
    const samples = [];
    let bucket;
    // Keep extremes as well as the first and last sample within each plot column.
    const flush = () => {
      if (!bucket) return;
      const retained = new Set([bucket.first, bucket.low, bucket.high, bucket.last]);
      samples.push(...[...retained].sort((left, right) => left.time - right.time));
      bucket = null;
    };
    for (const point of points) {
      if (point.value === null) {
        flush();
        if (samples.at(-1)?.value !== null) samples.push(point);
        continue;
      }
      const column = Math.floor((point.time - start) * columns / (end - start));
      if (bucket?.column !== column) {
        flush();
        bucket = { column, first: point, low: point, high: point, last: point };
      }
      if (point.value < bucket.low.value) bucket.low = point;
      if (point.value > bucket.high.value) bucket.high = point;
      bucket.last = point;
    }
    flush();
    return samples;
  }

  function historyPlot(points, fullStart, fullEnd, zone, english = false, view = null) {
    const left = 45, right = 379, top = 16, bottom = 121;
    // 0.8.33 · zoom: only the visible window is sampled, so a short window shows every recorded change (down to seconds).
    const start = view?.start ?? fullStart, end = view?.end ?? fullEnd;
    let before = null;
    const visible = [];
    for (const point of points) {
      if (point.time <= start) before = point;
      else if (point.time <= end) visible.push(point);
    }
    if (before) visible.unshift({ ...before, time:start });
    const samples = plotSamples(visible, start, end, right - left);
    let low = 0, high = 0;
    for (const { value } of samples) {
      if (value === null) continue;
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
    if (low === high) high = 1;
    const interval = (high - low) / 3;
    const magnitude = 10 ** Math.floor(Math.log10(interval));
    const step = [1, 2, 2.5, 5, 10].find(size => interval <= size * magnitude) * magnitude;
    const lowTick = Math.floor(low / step), highTick = Math.ceil(high / step);
    const x = (time) => (left + (time - start) * (right - left) / (end - start)).toFixed(1);
    const y = (value) => (bottom - (value / step - lowTick) * (bottom - top) / (highTick - lowTick)).toFixed(1);
    const seconds = end - start <= 15 * 60 * 1000;
    const formatTime = dateFormatter(english ? "en-GB" : "uk-UA", { hour: "2-digit", minute: "2-digit", ...(seconds ? { second:"2-digit" } : {}), hourCycle: "h23" }, zone);
    const horizontal = Array.from({ length: highTick - lowTick + 1 }, (_, index) => {
      const tick = lowTick + index;
      const value = tick * step;
      return `<path class="history-rule${tick === 0 ? " history-zero" : ""}" d="M${left} ${y(value)}H${right}"/>
        <text x="${left - 5}" y="${y(value)}" dy=".34em" text-anchor="end">${english ? chartFormat.format(value).replace(",", ".") : chartFormat.format(value)}</text>`;
    }).join("");
    const vertical = Array.from({ length: 5 }, (_, index) => {
      const time = start + index * (end - start) / 4;
      return `<path class="history-rule" d="M${x(time)} ${top}V${bottom}"/>
        <text x="${x(time)}" y="142" text-anchor="${index === 0 ? "start" : index === 4 ? "end" : "middle"}">${formatTime.format(time)}</text>`;
    }).join("");
    const trace = [];
    let previous = null;
    for (const { time, value } of samples) {
      const position = x(time);
      if (previous !== null) trace.push(`H${position}`);
      if (value !== null) {
        trace.push(previous === null ? `M${position} ${y(value)}` : `V${y(value)}`);
      }
      previous = value;
    }
    if (previous !== null) trace.push(`H${right}`);
    return `<svg viewBox="0 0 390 150" role="img" data-history-plot aria-label="${english ? "Power over the past 24 hours in kW" : "Графік потужності за останні 24 години у кіловатах"}">
      <text x="4" y="9">${english ? "kW" : "кВт"}</text>
      ${horizontal}${vertical}
      <path class="history-trace" d="${trace.join(" ")}"/>
    </svg>`;
  }

  /* 0.8.33 · month view: one group of bars per day (solar / load / grid), from Home Assistant long-term statistics. */
  function monthPlot(days, series, english = false) {
    const left = 34, right = 382, top = 22, bottom = 121;
    const high = Math.max(1, ...series.flatMap(item => item.values.filter(Number.isFinite)));
    const interval = high / 3;
    const magnitude = 10 ** Math.floor(Math.log10(interval));
    const step = [1, 2, 2.5, 5, 10].find(size => interval <= size * magnitude) * magnitude;
    const ticks = Math.ceil(high / step);
    const y = (value) => (bottom - value * (bottom - top) / (ticks * step)).toFixed(1);
    const slot = (right - left) / days.length;
    const bar = Math.max(1, (slot - 1.6) / series.length);
    const format = (value) => english ? chartFormat.format(value).replace(",", ".") : chartFormat.format(value);
    const rules = Array.from({ length:ticks + 1 }, (_, k) => `<path class="history-rule${k ? "" : " history-zero"}" d="M${left} ${y(k * step)}H${right}"/>
      <text x="${left - 4}" y="${y(k * step)}" dy=".34em" text-anchor="end">${format(k * step)}</text>`).join("");
    const bars = days.map((day, d) => series.map((item, k) => {
      const value = item.values[d];
      if (!Number.isFinite(value) || value <= 0) return "";
      const x = left + d * slot + .8 + k * bar;
      return `<rect class="month-bar month-${item.key}" x="${x.toFixed(1)}" y="${y(value)}" width="${(bar - .3).toFixed(2)}" height="${(bottom - y(value)).toFixed(1)}"><title>${escapeHtml(`${day.label} · ${item.label}: ${format(Math.round(value * 10) / 10)} ${english ? "kWh" : "кВт·год"}`)}</title></rect>`;
    }).join("")).join("");
    const labels = days.map((day, d) => d % 5 === 0 || d === days.length - 1
      ? `<text x="${(left + (d + .5) * slot).toFixed(1)}" y="140" text-anchor="middle">${escapeHtml(day.short)}</text>` : "").join("");
    const legend = series.map((item, k) => `<rect class="month-bar month-${item.key}" x="${120 + k * 88}" y="3" width="9" height="9" rx="1.5"/><text x="${133 + k * 88}" y="11">${escapeHtml(item.label)}</text>`).join("");
    return `<svg viewBox="0 0 390 150" role="img" aria-label="${english ? "Energy per day over the last 30 days, kWh" : "Енергія по днях за останні 30 днів, кВт·год"}">
      <text x="4" y="11">${english ? "kWh" : "кВт·год"}</text>${legend}${rules}${bars}${labels}</svg>`;
  }

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const textAttributes = ({ en, uk }, attribute = "text") =>
    `data-uk-${attribute}="${escapeHtml(uk)}" data-en-${attribute}="${escapeHtml(en)}"`;
  const translated = (text) => `<span ${textAttributes(text)}>${escapeHtml(text.uk)}</span>`;
  const unitsUk = { ...settingUnits, V: "В", Hz: "Гц", s: "с", ms: "мс", Ah: "А·год" };

  function settingsButton(name, text) {
    const localized = textAttributes(text, "label");
    return `<button class="settings-button" type="${name === "apply" ? "submit" : "button"}" data-settings-button="${name}" ${localized} aria-label="${text.uk}" title="${text.uk}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${settingsButtonIcons[name]}"/></svg>
    </button>`;
  }

  function nativeControl(control) {
    const { kind, x, y, w, h, name, label: text, align, compact, box, steppers, font } = control;
    const position = `style="--x:${x};--y:${y - 34};--w:${w};--h:${h};text-align:${align ?? "start"}"`;
    if (kind === "line") return `<div class="native-rule" ${position}></div>`;
    if (kind === "label") return `<span class="native-caption" ${position.replace(';text-align', `;--caption-font:${font}cqi;text-align`)} ${textAttributes(text)}>${escapeHtml(text.uk)}</span>`;
    if (kind === "readout") return `<output class="native-readout${box ? " native-box" : ""}" ${position} data-readout="${name}" ${textAttributes(text, "label")} title="${escapeHtml(text.uk)}">—</output>`;
    if (kind === "alarms") return `<div class="native-alarms" ${position} data-readout="${name}" tabindex="0">—</div>`;
    const aria = `${textAttributes(text, "label")} aria-label="${escapeHtml(text.uk)}"`;
    if (kind === "checkbox" || kind === "radio") {
      return `<label class="lcd-setting lcd-check native-check" data-setting="${name}" ${position}${compact ? " data-compact" : ""}${control.forMode ? ` data-for-mode="${control.forMode}"` : ""}>
        <input type="${kind}"${kind === "radio" ? ` name="${name}" value="${control.option}"` : ""} ${aria} disabled/>
        ${compact ? "" : translated(text)}
      </label>`;
    }
    const fieldInput = `<input type="text" inputmode="${kind === "time" ? "text" : "decimal"}" autocomplete="off" placeholder="—" ${aria} disabled${kind === "select" ? " hidden" : ""}/>`;
    const select = kind === "select" ? `<select ${aria} disabled><option value="">—</option></select>` : "";
    const input = select + fieldInput;
    const stepButton = (direction, glyph, text) =>
      `<button type="button" data-local-step="${direction}" ${textAttributes(text, "label")} aria-label="${text.uk}" disabled>${glyph}</button>`;
    return `<div class="lcd-setting lcd-number native-number" data-setting="${name}" data-kind="${kind}" data-unit="${control.unit ?? ""}" ${position}>
      ${steppers ? stepButton(1, "+", pair("Increase", "Збільшити")) : ""}
      <div class="lcd-number-value">${input}<span class="lcd-unit"></span></div>
      ${steppers ? stepButton(-1, "−", pair("Decrease", "Зменшити")) : ""}
    </div>`;
  }

  function settingsMarkup() {
    return `<section class="settings" id="settings-screen" aria-labelledby="settings-title" hidden>
      <div class="lcd-surface">
        <header class="settings-header"><h2 id="settings-title" tabindex="-1">Налаштування системи</h2>
          <button class="settings-home" type="button" data-back-to-screen ${textAttributes(pair("Home screen", "На головний екран"), "label")} aria-label="На головний екран" title="На головний екран">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.2 2.5 11.6h2.7V20h5.1v-5.6h3.4V20h5.1v-8.4h2.7z"/></svg>
          </button>
        </header>
        <div class="settings-menu">
          <div class="settings-tiles">
            ${settingsMenus.map(({ id, title }) => `<button class="settings-tile" type="button" data-settings-menu="${id}" ${textAttributes(title)}>${escapeHtml(title.uk)}</button>`).join("")}
          </div>
        </div>
        <form class="settings-body" hidden>
          <div class="settings-main">
            ${settingsMenus.flatMap(({ id, pages }) => pages.map(({ controls }, index) => `
              <section class="settings-page" data-settings-page="${id}:${index}" hidden>
                ${controls.length ? controls.map(nativeControl).join("") :
                  `<p class="lcd-placeholder">${translated(pair("In development", "У процесі розробки"))}</p>`}
              </section>`)).join("")}
          </div>
          <div class="settings-controls">
            <div class="settings-nav">
              ${settingsButton("up", pair("Previous page", "Попередня сторінка"))}
              <span class="settings-page-name" data-settings-page-name></span>
              ${settingsButton("down", pair("Next page", "Наступна сторінка"))}
            </div>
            <div class="settings-actions">
              ${settingsButton("cancel", pair("Back · discard unapplied changes", "Назад · скасувати незастосовані зміни"))}
              ${settingsButton("apply", pair("Apply page changes", "Застосувати зміни сторінки"))}
            </div>
          </div>
        </form>
      </div>
      <section class="numeric-panel" data-numeric-panel aria-labelledby="numeric-title" hidden>
        <div class="numeric-header">
          <h3 id="numeric-title"></h3>
          <span data-numeric-step></span>
        </div>
        <div class="numeric-actions">
          <button type="button" data-numeric-minus ${textAttributes(pair("Decrease", "Зменшити"), "label")} aria-label="Зменшити">−</button>
          <label class="numeric-entry">
            <input type="text" inputmode="decimal" autocomplete="off" aria-labelledby="numeric-title"/>
            <span data-numeric-unit></span>
          </label>
          <button type="button" data-numeric-plus ${textAttributes(pair("Increase", "Збільшити"), "label")} aria-label="Збільшити">+</button>
          <button type="button" class="numeric-close" data-numeric-close>${translated(pair("Collapse", "Згорнути"))}</button>
        </div>
      </section>
      <div class="settings-feedback">
        <p class="settings-hint" data-view-only hidden>${translated(pair("View only · changes require an HA administrator", "Лише перегляд · зміни доступні адміністратору HA"))}</p>
        <p class="settings-hint" data-read-only-menu hidden>${translated(pair("View only · change grid settings on the inverter itself", "Лише перегляд · налаштування мережі змінюйте на самому інверторі"))}</p>
        <p class="settings-hint" data-no-settings hidden>${translated(pair("Link control entities in the card editor.", "Під’єднай сутності керування в редакторі картки."))}</p>
        <p class="settings-hint" data-settings-message role="status" hidden></p>
      </div>
      <dialog class="apply-confirm" aria-labelledby="apply-confirm-title">
        <h3 id="apply-confirm-title">${translated(pair("Apply to the inverter?", "Застосувати на інверторі?"))}</h3>
        <ul class="apply-list" data-apply-list></ul>
        <div class="apply-actions">
          <button type="button" data-apply-cancel>${translated(pair("Cancel", "Скасувати"))}</button>
          <button type="button" class="apply-go" data-apply-go>${translated(pair("Apply", "Застосувати"))}</button>
        </div>
      </dialog>
    </section>`;
  }

  function decodeTime(value) {
    if (typeof value === "string" && /^\d{1,4}$/.test(value.trim())) value = Number(value);
    if (typeof value === "number") {
      if (!Number.isInteger(value) || value < 0 || value > 2359) return null;
      value = String(value).padStart(4, "0");
    }
    const match = String(value).trim().match(/^(\d{1,2}):?(\d{2})(?::([0-5]\d))?$/);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  const aboutCovers = [
    { alt: "Локальний моніторинг Deye", src: "data:image/webp;base64,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" },
    { alt: "Батарея Deye FE 16C", src: "data:image/webp;base64,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" },
    { alt: "Deye 6 кВт проти 80 кВт", src: "data:image/webp;base64,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" },
    { alt: "Fenix E08R UE проти E06R PRO", src: "data:image/webp;base64,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" },
  ];

  function aboutMarkup() {
    const id = "about-dialog";
    const title = "ТЕХНіКА";
    return `<dialog class="about" id="${id}" aria-labelledby="${id}-title">
      <form class="about-close" method="dialog">
        <button type="submit" aria-label="Закрити" ${textAttributes(pair("Close", "Закрити"), "label")} autofocus><span aria-hidden="true">×</span></button>
      </form>
      <div class="about-content">
        <p class="about-version">Deye · LCD · ${version}</p>
        <h2 id="${id}-title">${title}</h2>
        <p class="about-message">${translated(pair("Deye card for Home Assistant by ТЕХНіКА.", "Картка Deye для Home Assistant від каналу «ТЕХНіКА»."))}</p>
        <div class="about-links">
          <a class="about-youtube" href="https://www.youtube.com/@TEXHiKA2024" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 28 20" aria-hidden="true" focusable="false">
              <path fill="#fff" fill-rule="evenodd" d="M5 0h18a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5zm6 5v10l8-5z"/>
            </svg>
            <span>${translated(pair("YouTube channel", "Канал YouTube"))}</span>
          </a>
          <a class="about-monobank" href="${supportUrl}" target="_blank" rel="noopener noreferrer">${translated(pair("Support via monobank", "Підтримка monobank"))}</a>
        </div>
        <div class="about-media">
          <svg class="about-qr" role="img" aria-label="QR-код Банки H-Auto та ТЕХНіКА" viewBox="0 0 ${supportQrSize} ${supportQrSize}" shape-rendering="crispEdges">
            <rect width="${supportQrSize}" height="${supportQrSize}" fill="white"/>
            <path fill="black" d="${supportQrPath}"/>
          </svg>
          <p class="about-support">${translated(pair("H-Auto and ТЕХНіКА jar", "Банка H-Auto та ТЕХНіКА"))}</p>
          <div class="about-collage" role="group" aria-label="Обкладинки відео каналу «ТЕХНіКА»">
            ${aboutCovers.map(({ src, alt }) => `<img src="${src}" alt="${alt}" width="320" height="180" decoding="async">`).join("")}
          </div>
        </div>
      </div>
    </dialog>`;
  }

  function clockPanelMarkup(config) {
    const t = (en, uk) => local(pair(en, uk), config);
    const channel = atob("aHR0cHM6Ly93d3cueW91dHViZS5jb20vQFRFWEhpS0EyMDI0");
    const jar = atob("aHR0cHM6Ly9zZW5kLm1vbm9iYW5rLnVhL2phci85VFdHVFVCd1Vk");
    const qr = atob("TTQgNGg3djFoLTd6TTEyIDRoMXYxaC0xek0xNyA0aDF2MWgtMXpNMTkgNGgydjFoLTJ6TTI2IDRoN3YxaC03ek00IDVoMXYxaC0xek0xMCA1aDF2MWgtMXpNMTIgNWgxdjFoLTF6TTE1IDVoMnYxaC0yek0yMyA1aDJ2MWgtMnpNMjYgNWgxdjFoLTF6TTMyIDVoMXYxaC0xek00IDZoMXYxaC0xek02IDZoM3YxaC0zek0xMCA2aDF2MWgtMXpNMTIgNmgydjFoLTJ6TTE2IDZoMXYxaC0xek0xOCA2aDF2MWgtMXpNMjAgNmg1djFoLTV6TTI2IDZoMXYxaC0xek0yOCA2aDN2MWgtM3pNMzIgNmgxdjFoLTF6TTQgN2gxdjFoLTF6TTYgN2gzdjFoLTN6TTEwIDdoMXYxaC0xek0xMiA3aDN2MWgtM3pNMTYgN2gxdjFoLTF6TTE4IDdoM3YxaC0zek0yMiA3aDJ2MWgtMnpNMjYgN2gxdjFoLTF6TTI4IDdoM3YxaC0zek0zMiA3aDF2MWgtMXpNNCA4aDF2MWgtMXpNNiA4aDN2MWgtM3pNMTAgOGgxdjFoLTF6TTEzIDhoMnYxaC0yek0xNiA4aDJ2MWgtMnpNMjAgOGgxdjFoLTF6TTIyIDhoMXYxaC0xek0yNCA4aDF2MWgtMXpNMjYgOGgxdjFoLTF6TTI4IDhoM3YxaC0zek0zMiA4aDF2MWgtMXpNNCA5aDF2MWgtMXpNMTAgOWgxdjFoLTF6TTEyIDloM3YxaC0zek0xNyA5aDF2MWgtMXpNMjAgOWgxdjFoLTF6TTIyIDloMnYxaC0yek0yNiA5aDF2MWgtMXpNMzIgOWgxdjFoLTF6TTQgMTBoN3YxaC03ek0xMiAxMGgxdjFoLTF6TTE0IDEwaDF2MWgtMXpNMTYgMTBoMXYxaC0xek0xOCAxMGgxdjFoLTF6TTIwIDEwaDF2MWgtMXpNMjIgMTBoMXYxaC0xek0yNCAxMGgxdjFoLTF6TTI2IDEwaDd2MWgtN3pNMTQgMTFoMnYxaC0yek0xOCAxMWgydjFoLTJ6TTIxIDExaDN2MWgtM3pNNCAxMmgydjFoLTJ6TTggMTJoM3YxaC0zek0xNCAxMmgxdjFoLTF6TTE2IDEyaDF2MWgtMXpNMjAgMTJoM3YxaC0zek0yNCAxMmgxdjFoLTF6TTI3IDEyaDF2MWgtMXpNMjkgMTJoNHYxaC00ek00IDEzaDF2MWgtMXpNNyAxM2gxdjFoLTF6TTkgMTNoMXYxaC0xek0xMSAxM2gxdjFoLTF6TTE3IDEzaDJ2MWgtMnpNMjAgMTNoM3YxaC0zek0yNiAxM2gxdjFoLTF6TTI4IDEzaDV2MWgtNXpNNiAxNGgxdjFoLTF6TTEwIDE0aDJ2MWgtMnpNMTMgMTRoMnYxaC0yek0xOCAxNGgzdjFoLTN6TTIyIDE0aDF2MWgtMXpNMjcgMTRoMXYxaC0xek0zMiAxNGgxdjFoLTF6TTUgMTVoMnYxaC0yek04IDE1aDF2MWgtMXpNMTIgMTVoMnYxaC0yek0xNiAxNWgxdjFoLTF6TTE5IDE1aDF2MWgtMXpNMjEgMTVoNXYxaC01ek0yOSAxNWgxdjFoLTF6TTMxIDE1aDJ2MWgtMnpNNSAxNmgzdjFoLTN6TTEwIDE2aDN2MWgtM3pNMTUgMTZoMXYxaC0xek0xNyAxNmgydjFoLTJ6TTIwIDE2aDJ2MWgtMnpNMjQgMTZoMnYxaC0yek0zMSAxNmgxdjFoLTF6TTQgMTdoMXYxaC0xek02IDE3aDF2MWgtMXpNMTEgMTdoNHYxaC00ek0xNiAxN2gxdjFoLTF6TTE4IDE3aDF2MWgtMXpNMjAgMTdoM3YxaC0zek0yNiAxN2g3djFoLTd6TTYgMThoNnYxaC02ek0xNSAxOGg1djFoLTV6TTI0IDE4aDF2MWgtMXpNMjcgMThoNHYxaC00ek0zMiAxOGgxdjFoLTF6TTQgMTloMXYxaC0xek03IDE5aDN2MWgtM3pNMTEgMTloMXYxaC0xek0xMyAxOWgxdjFoLTF6TTE1IDE5aDF2MWgtMXpNMTcgMTloMXYxaC0xek0yMSAxOWgxdjFoLTF6TTI2IDE5aDF2MWgtMXpNMjggMTloMXYxaC0xek0zMSAxOWgydjFoLTJ6TTQgMjBoMnYxaC0yek03IDIwaDF2MWgtMXpNOSAyMGgzdjFoLTN6TTE0IDIwaDF2MWgtMXpNMTYgMjBoMnYxaC0yek0yMSAyMGgxdjFoLTF6TTIzIDIwaDN2MWgtM3pNMzEgMjBoMXYxaC0xek00IDIxaDF2MWgtMXpNNiAyMWgydjFoLTJ6TTkgMjFoMXYxaC0xek0xMyAyMWgydjFoLTJ6TTE3IDIxaDJ2MWgtMnpNMjAgMjFoMXYxaC0xek0yMiAyMWgxdjFoLTF6TTI2IDIxaDR2MWgtNHpNMzEgMjFoMnYxaC0yek02IDIyaDJ2MWgtMnpNMTAgMjJoM3YxaC0zek0xNCAyMmgxdjFoLTF6TTE5IDIyaDF2MWgtMXpNMjEgMjJoMXYxaC0xek0zMCAyMmgxdjFoLTF6TTMyIDIyaDF2MWgtMXpNNiAyM2g0djFoLTR6TTEzIDIzaDJ2MWgtMnpNMTYgMjNoMXYxaC0xek0xOCAyM2gxdjFoLTF6TTIxIDIzaDN2MWgtM3pNMzEgMjNoMnYxaC0yek00IDI0aDJ2MWgtMnpNOCAyNGg2djFoLTZ6TTE1IDI0aDF2MWgtMXpNMTcgMjRoMnYxaC0yek0yMCAyNGgydjFoLTJ6TTIzIDI0aDd2MWgtN3pNMzIgMjRoMXYxaC0xek0xMiAyNWgxdjFoLTF6TTE2IDI1aDF2MWgtMXpNMjAgMjVoMXYxaC0xek0yMyAyNWgydjFoLTJ6TTI4IDI1aDF2MWgtMXpNMzIgMjVoMXYxaC0xek00IDI2aDd2MWgtN3pNMTMgMjZoMXYxaC0xek0xNSAyNmg2djFoLTZ6TTIzIDI2aDJ2MWgtMnpNMjYgMjZoMXYxaC0xek0yOCAyNmgzdjFoLTN6TTMyIDI2aDF2MWgtMXpNNCAyN2gxdjFoLTF6TTEwIDI3aDF2MWgtMXpNMTIgMjdoMXYxaC0xek0xNSAyN2gxdjFoLTF6TTE3IDI3aDF2MWgtMXpNMTkgMjdoMXYxaC0xek0yMSAyN2gxdjFoLTF6TTIzIDI3aDJ2MWgtMnpNMjggMjdoMXYxaC0xek00IDI4aDF2MWgtMXpNNiAyOGgzdjFoLTN6TTEwIDI4aDF2MWgtMXpNMTIgMjhoMnYxaC0yek0xNiAyOGgydjFoLTJ6TTIwIDI4aDEwdjFoLTEwek0zMSAyOGgxdjFoLTF6TTQgMjloMXYxaC0xek02IDI5aDN2MWgtM3pNMTAgMjloMXYxaC0xek0xNCAyOWgxdjFoLTF6TTE3IDI5aDJ2MWgtMnpNMjAgMjloM3YxaC0zek0yNSAyOWgxdjFoLTF6TTMyIDI5aDF2MWgtMXpNNCAzMGgxdjFoLTF6TTYgMzBoM3YxaC0zek0xMCAzMGgxdjFoLTF6TTE0IDMwaDF2MWgtMXpNMTkgMzBoMXYxaC0xek0yMiAzMGg0djFoLTR6TTI5IDMwaDR2MWgtNHpNNCAzMWgxdjFoLTF6TTEwIDMxaDF2MWgtMXpNMTIgMzFoMXYxaC0xek0xNiAzMWgxdjFoLTF6TTE4IDMxaDV2MWgtNXpNMjQgMzFoMXYxaC0xek0yOCAzMWgydjFoLTJ6TTMxIDMxaDJ2MWgtMnpNNCAzMmg3djFoLTd6TTEyIDMyaDR2MWgtNHpNMTcgMzJoNnYxaC02ek0yNCAzMmgxdjFoLTF6TTI2IDMyaDF2MWgtMXpNMjggMzJoMXYxaC0xek0zMSAzMmgxdjFoLTF6");
    return `<dialog class="about" id="about-signature" aria-labelledby="about-signature-title">
      <form class="about-close" method="dialog">
        <button type="submit" aria-label="${t("Close", "Закрити")}" autofocus>×</button>
      </form>
      <div class="about-content">
        <p class="about-version">Deye · LCD · ${version}</p>
        <h2 id="about-signature-title">${t("An Easter egg from ТЕХНіКА", "Пасхалка від ТЕХНіКА")}</h2>
        <p class="about-message">${t("Deye · LCD by ТЕХНіКА", "Deye · LCD від каналу «ТЕХНіКА»")}</p>
        <div class="about-links">
          <a class="about-youtube" href="${channel}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 28 20" aria-hidden="true" focusable="false">
              <path fill="#fff" fill-rule="evenodd" d="M5 0h18a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5zm6 5v10l8-5z"/>
            </svg>
            <span>${t("YouTube channel", "Канал YouTube")}</span>
          </a>
          <a class="about-monobank" href="${jar}" target="_blank" rel="noopener noreferrer">${t("Support via monobank", "Підтримка monobank")}</a>
        </div>
        <div class="about-media">
          <svg class="about-qr" role="img" aria-label="monobank QR" viewBox="0 0 37 37" shape-rendering="crispEdges">
            <rect width="37" height="37" fill="white"/><path fill="black" d="${qr}"/>
          </svg>
          <p class="about-support">${t("H-Auto and ТЕХНіКА jar", "Банка H-Auto та ТЕХНіКА")}</p>
          <div class="about-collage" role="group" aria-label="ТЕХНіКА">
            ${aboutCovers.map(({ src, alt }) => `<img src="${src}" alt="${alt}" width="320" height="180" decoding="async">`).join("")}
          </div>
        </div>
      </div>
    </dialog>`;
  }

  function settingValue(entity, domain) {
    if (domain === "datetime") {
      const stamp = Date.parse(entity?.state);
      return Number.isFinite(stamp) ? new Date(stamp).toISOString() : null;
    }
    if (domain === "number") return reading(entity);
    if (domain === "button") return entity && entity.state !== "unavailable" ? entity.state : null;
    if (domain === "time") return decodeTime(entity?.state) ? `${decodeTime(entity.state)}:00` : null;
    if (domain === "select") {
      return Array.isArray(entity?.attributes?.options) && entity.attributes.options.includes(entity.state)
        ? entity.state : null;
    }
    if (entity?.state === "on") return true;
    if (entity?.state === "off") return false;
    return null;
  }

  function optionKey(value) {
    return typeof value === "string" ? value.trim().toLowerCase().replace(/[._-]/g, " ").replace(/\s+/g, " ") : "";
  }

  function optionMatches(target, choices) {
    if (!target) return {};
    const options = target.entity.attributes.options;
    return Object.fromEntries(Object.entries(choices).map(([key, aliases]) => {
      const keys = aliases.map(optionKey);
      return [key, options.find(option => keys.includes(optionKey(option)))];
    }).filter(([, option]) => option !== undefined));
  }

  function selectedChoice(target, options) {
    return Object.keys(options).find(key => options[key] === target?.value) ?? null;
  }

  const calendarBounds = {
    year:{min:2000,max:2099,step:1}, month:{min:1,max:12,step:1}, day:{min:1,max:31,step:1},
    hour:{min:0,max:23,step:1}, minute:{min:0,max:59,step:1},
  };
  function calendarParts(value, zone) {
    const stamp = Date.parse(value);
    if (!Number.isFinite(stamp)) return null;
    const formatter = dateFormatter("en-GB", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23" }, zone);
    return Object.fromEntries(formatter.formatToParts(new Date(stamp)).filter(part => part.type !== "literal").map(part => [part.type,Number(part.value)]));
  }
  function calendarISO(parts, zone, t) {
    const { year, month, day, hour, minute } = parts;
    const requested = Date.UTC(year, month-1, day, hour, minute, 0);
    const check = new Date(requested);
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month-1 || check.getUTCDate() !== day) {
      throw new Error(t("This calendar date does not exist.", "Такої календарної дати не існує."));
    }
    let stamp = requested;
    for (let i=0; i<4; i++) {
      const local = calendarParts(new Date(stamp).toISOString(), zone);
      const difference = requested - Date.UTC(local.year,local.month-1,local.day,local.hour,local.minute,local.second);
      if (difference === 0) return new Date(stamp).toISOString();
      stamp += difference;
    }
    throw new Error(t("This local time is unavailable due to the daylight-saving transition.", "Цей місцевий час недоступний через переведення годинника."));
  }

  const unavailableSetting = { current: null, targets: [] };
  // Factory reset is never sent from the card, even when an entity is bound by hand.
  const lockedSettings = new Set(["basic_factory_reset"]);
  const lockedSetting = { current: null, targets: [], locked: true };
  // The Grid Setting menu shows values only: on the inverter itself it usually needs a password.
  const readOnlyMenus = new Set(["grid"]);
  const riskySettings = {
    basic_lock: pair("The inverter may then refuse every change, including changes from this card. It can be unlocked only on the inverter itself.",
      "Після цього інвертор може заборонити будь-які зміни, зокрема з цієї картки. Зняти блокування можна лише на самому інверторі."),
    generator_force: pair("The generator will be started regardless of the battery charge.",
      "Генератор буде запущено примусово, незалежно від заряду АКБ."),
    battery_activate: pair("The inverter will apply voltage to wake the battery. Do it only when the battery really needs it.",
      "Інвертор подасть напругу, щоб пробудити АКБ. Робіть це лише тоді, коли це справді потрібно."),
  };
  const thresholdSettings = new Set(["battery_shutdown", "battery_low", "battery_restart"]);

  function selectControl(target, choices) {
    const options = optionMatches(target, choices);
    return {
      current: selectedChoice(target, options),
      targets: target ? [target] : [],
      choices: Object.keys(options),
      writes: value => [{ target, value: options[value] }],
    };
  }

  function sameSetting(first, second) {
    if (typeof first !== "number" || typeof second !== "number") return first === second;
    return Math.abs(first - second) < 1e-8;
  }

  function validateSettingNumber(text, attributes, translate = (_, uk) => uk) {
    let value = text;
    if (typeof text === "string") {
      const normalized = text.trim().replace(",", ".");
      value = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
    }
    if (!Number.isFinite(value)) throw new Error(translate("Enter a number.", "Введи число."));
    const { min, max, step } = attributes;
    const hasMin = Number.isFinite(min);
    const hasMax = Number.isFinite(max);
    if ((hasMin && value < min) || (hasMax && value > max)) {
      const range = hasMin && hasMax ? `від ${min} до ${max}` : hasMin ? `від ${min}` : `до ${max}`;
      const en = hasMin && hasMax ? `from ${min} to ${max}` : hasMin ? `from ${min}` : `up to ${max}`;
      throw new Error(translate(`Allowed range: ${en}.`, `Допустиме значення ${range}.`));
    }
    if (Number.isFinite(step) && step > 0) {
      const steps = (value - (hasMin ? min : 0)) / step;
      if (Math.abs(steps - Math.round(steps)) > 1e-7) throw new Error(translate(`Use a step of ${step}.`, `Допустимий крок ${step}.`));
    }
    return value;
  }

  /* ── 0.8.29 · gauge windows: one layout for the card (work) and for the editor (settings) ── */
  const gridUnits = {
    kw:pair("kW", "кВт"), v:pair("V", "В"), a:pair("A", "А"), kwh:pair("kWh", "кВт·год"), mwh:pair("MWh", "МВт·год"),
    pct:pair("%", "%"), c:pair("°C", "°C"), none:pair("", ""),
  };
  const gridAggText = { sum:pair("sum", "сума"), avg:pair("average", "середнє"), avgOn:pair("average", "середнє"), max:pair("highest", "найвища") };
  const gridTile = (k, en, uk, unit, agg, field, extra = {}) => ({ k, label:pair(en, uk), unit, agg, field, dom:"sensor", ...extra });
  const gridLayouts = {
    pv: { sub:"inputs", tiles:[
      gridTile("power", "Power", "Потужність", "kw", "sum", "pv_power", { main:true }),
      gridTile("today", "Today", "Сьогодні", "kwh", "sum", "pv_energy_today"),
      gridTile("total", "Total", "Всього", "kwh", "sum", "pv_energy_total"),
    ] },
    grid: { sub:"phases", tiles:[
      gridTile("power", "Power", "Потужність", "kw", "sum", "grid_power", { main:true }),
      gridTile("voltage", "Voltage", "Напруга", "v", "avgOn", "grid_voltage", { fromSub:true }),
      gridTile("today", "Imported today", "Спожито за добу", "kwh", "sum", "grid_energy_today"),
      gridTile("current", "Current", "Струм", "a", "sum", "grid_current", { fromSub:true }),
      gridTile("status", "Grid", "Мережа", "none", "status", "grid_connected", { dom:"binary_sensor" }),
    ] },
    battery: { runtime:true, chartPage:true, tiles:[
      gridTile("power", "Power", "Потужність", "kw", "sum", "battery_power", { main:true }),
      gridTile("soc", "Charge", "Заряд", "pct", "avg", "battery_soc", { main:true }),
      gridTile("voltage", "Voltage", "Напруга", "v", "avg", "battery_voltage"),
      gridTile("current", "Current", "Струм", "a", "sum", "battery_current"),
      gridTile("temperature", "Temperature", "Температура", "c", "max", "battery_temperature"),
    ] },
    load: { sub:"phases", tiles:[
      gridTile("power", "Power", "Потужність", "kw", "sum", "load_power", { main:true }),
      gridTile("voltage", "Voltage", "Напруга", "v", "avg", "load_voltage", { fromSub:true }),
      gridTile("current", "Current", "Струм", "a", "sum", "load_current", { fromSub:true }),
      gridTile("today", "Today", "Сьогодні", "kwh", "sum", "load_energy_today"),
    ] },
    generator: { sub:"phases", tiles:[
      gridTile("power", "Power", "Потужність", "kw", "sum", "generator_power", { main:true }),
      gridTile("voltage", "Voltage", "Напруга", "v", "avg", "generator_voltage", { fromSub:true }),
      gridTile("current", "Current", "Струм", "a", "sum", "generator_current", { fromSub:true }),
      gridTile("today", "Today", "Сьогодні", "kwh", "sum", "generator_energy_today"),
    ] },
  };
  const gridSubMetrics = [
    { k:"voltage", label:pair("Voltage", "Напруга"), unit:"v" },
    { k:"current", label:pair("Current", "Струм"), unit:"a" },
    { k:"power", label:pair("Power", "Потужність"), unit:"kw" },
  ];
  const gridShortNames = { pv:pair("Solar", "Сонце"), grid:pair("Grid", "Мережа"), battery:pair("Battery", "Батарея"), load:pair("Load", "Навантаження"), generator:pair("Generator", "Генератор") };
  const gaugeOfSource = (source) => source === "generator" ? generatorGauge : gaugeLayout.find(gauge => gauge.source === source);
  const gridInverters = (config, source) => powerSources(config, gaugeOfSource(source)).map(({ index }) => index);
  const gridHasSub = (config, source) => source === "pv" || (gridLayouts[source]?.sub === "phases" && threePhaseValues.includes(config.inverter_phases));
  const gridSubField = (source, column, metric) => `${source}_${column}_${metric}`;
  const gridBound = (config, name) => hasEditorBinding(config?.[name]);
  function pvInputCount(config, index) {
    const stored = Number(config?.[inverterField(index, "pv_inputs")]);
    let highest = 0;
    for (const n of pvInputs) if (gridSubMetrics.some(({ k }) => gridBound(config, inverterField(index, `pv_${n}_${k}`)))) highest = n;
    return Math.min(6, Math.max(1, highest, Number.isFinite(stored) ? Math.round(stored) : 0));
  }
  const gridColumns = (config, source, index) => source === "pv"
    ? Array.from({ length:pvInputCount(config, index) }, (_, i) => String(i + 1)) : ["l1", "l2", "l3"];
  const gridColumnTitle = (source, column) => source === "pv" ? `PV${column}` : column.toUpperCase();

  function energyKwh(entity) {
    const value = reading(entity);
    if (value === null) return null;
    const unit = String(entity?.attributes?.unit_of_measurement ?? "kWh").trim().toLowerCase();
    const factor = { kwh:1, "квт·год":1, "квт*год":1, wh:.001, "вт·год":.001, mwh:1000, "мвт·год":1000 }[unit];
    return factor === undefined ? value : value * factor;
  }
  function gridValue(metric, unit, id, states) {
    if (!id) return null;
    if (unit === "a") return currentTotal([id], states);
    if (unit === "kw") return watts(states[id]);
    if (unit === "kwh") return energyKwh(states[id]);
    if (metric === "soc") return charge(states[id]);
    if (unit === "v") {
      const entity = states[id];
      const factor = { v:1, "в":1, mv:.001, "мв":.001, kv:1000, "кв":1000 }[String(entity?.attributes?.unit_of_measurement ?? "v").trim().toLowerCase()];
      const value = reading(entity);
      return value === null ? null : value * (factor ?? 1);
    }
    if (unit === "c") {
      const entity = states[id];
      const value = reading(entity);
      const fahrenheit = /f$/.test(String(entity?.attributes?.unit_of_measurement ?? "").trim().toLowerCase());
      return value === null ? null : fahrenheit ? (value - 32) * 5 / 9 : value;
    }
    return reading(states[id]);
  }
  const batteryFactor = (config, source) => source === "battery" && config.battery_power_x2 === true ? 2 : 1;

  // One inverter's reading for a tile: { v, bound, derived } or null when nothing is linked.
  function gridReading(config, states, source, tile, index) {
    if (tile.k === "power") {
      const item = powerSources(config, gaugeOfSource(source)).find(entry => entry.index === index);
      if (!item || !powerParts([item]).some(part => part.id)) return null;
      const total = powerTotal([item], states, source === "pv" && !item.id);
      return { v:total === null ? null : total * batteryFactor(config, source), bound:Boolean(item.id), derived:!item.id && source === "pv" ? "pv" : "" };
    }
    const id = config[inverterField(index, tile.field)];
    if (tile.k === "status") {
      if (!id) return null;
      const state = String(states[id]?.state ?? "").toLowerCase();
      return { v:state === "on" ? "on" : state === "off" ? "off" : null, bound:true, derived:"" };
    }
    if (!hasEditorBinding(id) && tile.k === "current" && source === "battery" && config.battery_power_mode === "channels") {
      const channels = [1, 2].map(channel => config[inverterField(index, `battery_${channel}_current`)]).filter(hasEditorBinding);
      if (channels.length === 2) return { v:currentTotal(channels, states), bound:false, derived:"channels" };
    }
    if (hasEditorBinding(id)) {
      return { v:gridValue(tile.k, tile.unit, id, states), bound:true, derived:"" };
    }
    if (tile.fromSub && gridHasSub(config, source)) {
      const ids = gridColumns(config, source, index).map(column => config[inverterField(index, gridSubField(source, column, tile.k))]).filter(hasEditorBinding);
      if (!ids.length) return null;
      const values = ids.map(phase => gridValue(tile.k, tile.unit, phase, states)).filter(Number.isFinite);
      return { v:values.length ? values.reduce((a, b) => a + b, 0) / values.length : null, bound:false, derived:"phases" };
    }
    return null;
  }

  function combinedSoc(config, states) {
    const count = inverterCount(config);
    if (!(batterySeparate(config) && count > 1)) return charge(states[config.battery_soc]);
    const banks = installedInverters(config).map(index => ({
      charge:charge(states[config[inverterField(index, "battery_soc")]]),
      capacity:Number(config[inverterField(index, "battery_soc_capacity_kwh")]),
    }));
    if (banks.every(bank => Number.isFinite(bank.capacity) && bank.capacity > 0 && bank.charge !== null)) {
      return banks.reduce((sum, bank) => sum + bank.capacity * bank.charge, 0) / banks.reduce((sum, bank) => sum + bank.capacity, 0);
    }
    const known = banks.map(bank => bank.charge).filter(value => value !== null);
    return known.length ? known.reduce((a, b) => a + b, 0) / known.length : null;
  }

  // Combined value of a tile across the inverters of this window.
  function gridTotal(config, states, source, tile, indices) {
    if (tile.k === "power") {
      const sources = powerSources(config, gaugeOfSource(source));
      if (!powerParts(sources).some(part => part.id)) return null;
      const total = powerTotal(sources, states, source === "pv");
      return total === null ? null : total * batteryFactor(config, source);
    }
    const rows = indices.map(index => ({ index, row:gridReading(config, states, source, tile, index) })).filter(({ row }) => row);
    if (tile.k === "soc" && indices.length > 1) {
      const soc = combinedSoc(config, states);
      if (soc !== null) return soc;
    }
    const values = rows.map(({ row }) => row.v).filter(Number.isFinite);
    if (!values.length) return null;
    if (tile.agg === "sum") {
      // The same entity bound on two inverters (a shared meter) is counted once, not doubled.
      const seen = new Set();
      return rows.reduce((total, { index, row }) => {
        if (!Number.isFinite(row.v)) return total;
        const id = row.bound ? config[inverterField(index, tile.field)] : "";
        if (id) { if (seen.has(id)) return total; seen.add(id); }
        return total + row.v;
      }, 0);
    }
    if (tile.agg === "max") return Math.max(...values);
    if (tile.agg === "avgOn") {
      // An inverter without the grid must not pull the average voltage down.
      const live = rows.filter(({ index, row }) => Number.isFinite(row.v) && row.v > gridOffVoltage
        && String(states[config[inverterField(index, "grid_connected")]]?.state ?? "").toLowerCase() !== "off").map(({ row }) => row.v);
      return live.length ? live.reduce((a, b) => a + b, 0) / live.length : 0;
    }
    const positive = tile.unit === "v" ? values.filter(value => value > 0) : values;
    const pool = positive.length ? positive : values;
    return pool.reduce((a, b) => a + b, 0) / pool.length;
  }

  function gridStatus(config, states, indices) {
    const tile = gridLayouts.grid.tiles.find(item => item.k === "status");
    const values = indices.map(index => gridReading(config, states, "grid", tile, index));
    if (values.every(value => !value)) return null;
    return { values:values.map(value => value?.v ?? null), on:values.filter(value => value?.v === "on").length, known:values.filter(value => value?.v).length };
  }

  function gridFormat(tile, value, english) {
    if (value === null || value === undefined || !Number.isFinite(value)) return { text:"—", unit:"" };
    // 0.8.32 · a tiny negative reading rounds to −0; show it as a plain 0.
    const base = english ? englishMeasurementFormat : measurementFormat;
    const format = { format:(number) => base.format(number === 0 ? 0 : number) };
    const unit = (key) => english ? gridUnits[key].en : gridUnits[key].uk;
    if (tile.unit === "kw") return { text:format.format(Math.round(value / 10) / 100), unit:unit("kw") };
    if (tile.unit === "kwh") return Math.abs(value) >= 1000
      ? { text:format.format(Math.round(value / 100) / 10), unit:unit("mwh") } : { text:format.format(Math.round(value * 10) / 10), unit:unit("kwh") };
    if (tile.unit === "pct") return { text:String(Math.round(value)), unit:"%" };
    return { text:format.format(Math.round(value * 10) / 10), unit:unit(tile.unit) };
  }

  /* battery runtime, shared by the card window and the editor preview */
  function batteryCapacityOf(config, states) {
    // Order: the value typed in the editor, separate banks, a kWh sensor, then Ah × battery voltage.
    const manual = Number(config.battery_runtime_capacity_kwh);
    if (config.battery_runtime_capacity_kwh !== "" && Number.isFinite(manual) && manual > 0) return { kwh:manual, source:"manual" };
    if (batterySeparate(config) && inverterCount(config) > 1) {
      const banks = installedInverters(config).map(index => Number(config[inverterField(index, "battery_soc_capacity_kwh")]));
      if (banks.every(value => Number.isFinite(value) && value > 0)) return { kwh:banks.reduce((a, b) => a + b, 0), source:"banks" };
    }
    const sensor = states[config.battery_capacity_sensor];
    const amount = reading(sensor);
    if (amount !== null && amount > 0) {
      const unit = String(sensor.attributes?.unit_of_measurement ?? "kWh").trim().toLowerCase();
      const factor = { kwh:1, "квт·год":1, wh:0.001, "вт·год":0.001, mwh:1000 }[unit];
      if (factor) return { kwh:amount * factor, source:"sensor" };
    }
    const unitOf = entity => String(entity?.attributes?.unit_of_measurement ?? "").trim().toLowerCase();
    const ahSensor = states[config.battery_capacity], voltSensor = states[config.battery_voltage];
    const ahRaw = reading(ahSensor), voltRaw = reading(voltSensor);
    const ahFactor = { "":1, ah:1, "а·год":1, "аг":1, mah:0.001, "ма·год":0.001 }[unitOf(ahSensor)];
    const voltFactor = { "":1, v:1, "в":1, mv:0.001, "мв":0.001, kv:1000, "кв":1000 }[unitOf(voltSensor)];
    const ah = ahRaw === null || !ahFactor ? null : ahRaw * ahFactor;
    const volts = voltRaw === null || !voltFactor ? null : voltRaw * voltFactor;
    if (ah !== null && ah > 0 && volts !== null && volts > 0) return { kwh:ah * volts / 1000, source:"ah" };
    return null;
  }
  function runtimeCutoffOf(config, states) {
    const custom = config.battery_runtime_cutoff;
    if (custom !== undefined && custom !== null && custom !== "" && Number.isFinite(Number(custom))) return Math.min(95, Math.max(0, Number(custom)));
    const shutdown = states[config.battery_shutdown];
    const unit = String(shutdown?.attributes?.unit_of_measurement ?? "").trim();
    const value = reading(shutdown);
    return unit === "%" && value !== null && value >= 0 && value < 100 ? value : 20;
  }
  function durationText(minutes, t) {
    if (minutes >= 48 * 60) return t("over 2 days", "понад 2 доби");
    const hours = Math.floor(minutes / 60), rest = Math.round(minutes % 60);
    const h = hours + (rest === 60 ? 1 : 0), m = rest === 60 ? 0 : rest;
    if (!h) return t(`${m} min`, `${m} хв`);
    return m ? t(`${h} h ${m} min`, `${h} год ${m} хв`) : t(`${h} h`, `${h} год`);
  }
  // Idle threshold: 5 W per kW of all installed inverters together (6 kW → 30 W, 2×80 kW → 800 W), at least 30 W.
  function idleThreshold(config) {
    const indices = installedInverters(config);
    const kw = indices.reduce((total, index) => total + readModel(config[inverterField(index, "inverter_model")], indices.length > 1), 0);
    return Math.max(30, kw * 5);
  }
  function runtimeInfo(config, states, soc, t) {
    const raw = powerTotal(powerSources(config, gaugeByKey.battery_power), states);
    const power = raw === null ? null : raw * (config.battery_power_x2 === true ? 2 : 1);
    const capacity = batteryCapacityOf(config, states);
    const cutoff = runtimeCutoffOf(config, states);
    const idle = idleThreshold(config);
    const number = value => (preferEnglish(config) ? englishMeasurementFormat : measurementFormat).format(Math.round(value * 10) / 10);
    const status = gridStatus(config, states, gridInverters(config, "grid"));
    const gridPower = powerTotal(powerSources(config, gaugeByKey.grid_power), states);
    const onGrid = status ? status.on > 0 : gridPower !== null && Math.abs(gridPower) >= idle;
    const load = powerTotal(powerSources(config, gaugeByKey.load_power), states);
    const charging = power !== null && power <= -idle;
    const label = charging ? t("Time to full charge", "До повного заряду")
      : onGrid ? t("If the grid goes down", "Якщо зникне мережа") : t("Battery runtime", "Час роботи від АКБ");
    let value = "—", note;
    if (!capacity) note = t("Set the battery capacity in the card editor (Main screen → Battery).", "Вкажіть ємність АКБ у редакторі картки («Головний екран» → Батарея).");
    else if (soc === null) note = t("Battery charge is unavailable.", "Немає даних про заряд АКБ.");
    else if (charging) {
      value = soc >= 100 ? t("Full", "Заряджено") : durationText(capacity.kwh * (100 - soc) / 100 / (-power / 1000) * 60, t);
      note = t(`to 100 % · ${number(capacity.kwh)} kWh · at the current power`, `до 100 % · ${number(capacity.kwh)} кВт·год · за поточною потужністю`);
    } else if (onGrid) {
      if (load === null || load < idle) note = t("Load power is unavailable.", "Немає даних про потужність навантаження.");
      else {
        value = soc <= cutoff ? t("Threshold reached", "Поріг досягнуто") : durationText(capacity.kwh * (soc - cutoff) / 100 / (load / 1000) * 60, t);
        note = t(`down to ${number(cutoff)} % · ${number(capacity.kwh)} kWh · at the current load`, `до ${number(cutoff)} % · ${number(capacity.kwh)} кВт·год · за поточним навантаженням`);
      }
    } else if (power === null) note = t("Battery power is unavailable.", "Немає даних про потужність АКБ.");
    else if (power < idle) note = t("The battery is idle.", "АКБ у спокої.");
    else {
      value = soc <= cutoff ? t("Threshold reached", "Поріг досягнуто") : durationText(capacity.kwh * (soc - cutoff) / 100 / (power / 1000) * 60, t);
      note = t(`down to ${number(cutoff)} % · ${number(capacity.kwh)} kWh · at the current power`, `до ${number(cutoff)} % · ${number(capacity.kwh)} кВт·год · за поточною потужністю`);
    }
    return { label, value, note, charging:charging && value !== "—", capacity, cutoff };
  }

  // 0.8.37 · Short battery time on the main screen: shown only while the battery charges or discharges.
  function mainRuntime(config, states, soc, power) {
    const capacity = batteryCapacityOf(config, states);
    if (!capacity || soc === null || power === null || Math.abs(power) < idleThreshold(config)) return null;
    const charging = power < 0;
    const share = charging ? 100 - soc : soc - runtimeCutoffOf(config, states);
    if (share <= 0) return null;
    return { minutes:capacity.kwh * share / 100 / (Math.abs(power) / 1000) * 60, charging };
  }
  function shortDuration(minutes, english) {
    const total = Math.max(1, Math.round(minutes)), h = Math.floor(total / 60), m = total % 60;
    if (h > 99) return english ? ">99h" : ">99г";
    if (!h) return english ? `${m}m` : `${m}хв`;
    if (!m) return english ? `${h}h` : `${h}г`;
    return english ? `${h}h ${m}m` : `${h}г ${m}хв`;
  }

  const gridIcons = {
    ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#2fbf6a"/><path d="M7 12.5l3.2 3.2L17.3 8.6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    off:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#e5392b"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>',
    part:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2 23 21.3H1z" fill="#ffc20e" stroke="#ffc20e" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 9v5.6" stroke="#2a1e05" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="18" r="1.5" fill="#2a1e05"/></svg>',
    none:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 3" opacity=".6"/></svg>',
  };

  // Field-by-field progress of a window, used by the editor counters and rings.
  function gridProgress(config, states, source) {
    const layout = gridLayouts[source];
    const indices = gridInverters(config, source);
    let done = 0, total = 0, power = false;
    for (const tile of layout.tiles) for (const index of indices) {
      total++;
      const row = gridReading(config, {}, source, tile, index);
      if (row) { done++; if (tile.k === "power") power = true; }
    }
    if (layout.runtime) { total++; if (batteryCapacityOf(config, states)) done++; }
    return { done, total, state:!power ? "empty" : done === total ? "ok" : "part" };
  }

  // Order in which «Next empty» walks through a window.
  function gridOrder(config, source, page) {
    const indices = gridInverters(config, source);
    if (page === "sub") return indices.flatMap(index => gridSubMetrics.flatMap(({ k }) =>
      gridColumns(config, source, index).map(column => inverterField(index, gridSubField(source, column, k)))));
    const layout = gridLayouts[source];
    const order = layout.tiles.flatMap(tile => indices.map(index => inverterField(index, tile.field)));
    if (layout.runtime) order.splice(2 * indices.length, 0, "__runtime");
    return order;
  }
  function gridSlotNeeded(config, states, source, slot, page) {
    if (slot === "__runtime") return !batteryCapacityOf(config, states);
    if (gridBound(config, slot)) return false;
    if (page === "sub") return true;
    const index = Number(/^inverter_(\d)_/.exec(slot)?.[1] ?? 1) - 1;
    const tile = gridLayouts[source].tiles.find(item => inverterField(index, item.field) === slot);
    return !(tile && gridReading(config, {}, source, tile, index));
  }

  /*
   * Body of a gauge window. o = { config, states, source, page:"main"|"sub", edit, sel, t, english, sheet(slot) }.
   * Work and settings mode share the same layout; settings mode swaps the numbers for entity slots.
   */
  function gridBodyHtml(o) {
    const { config, states, source, edit, sel, t, english } = o;
    const layout = gridLayouts[source];
    const indices = gridInverters(config, source);
    const parallel = indices.length > 1;
    const L = (text) => escapeHtml(english ? text.en : text.uk);
    const slotHtml = (name, tile, prefix = "") => {
      const id = config[name];
      const entity = states[id];
      let inner = "+";
      if (hasEditorBinding(id)) {
        if (tile.k === "status") inner = entity?.state === "on" ? `✓ ${escapeHtml(t("on", "є"))}` : entity?.state === "off" ? `✕ ${escapeHtml(t("off", "немає"))}` : "—";
        else { const shown = gridFormat(tile, gridValue(tile.k, tile.unit, id, states), english); inner = escapeHtml(shown.text); }
      }
      return `<button type="button" class="slot${hasEditorBinding(id) ? "" : " empty"}${sel === name ? " sel" : ""}" data-gslot="${escapeHtml(name)}"
        title="${escapeHtml(hasEditorBinding(id) ? id : t("Tap to choose an entity", "Натисніть, щоб вибрати сутність"))}">${prefix ? `<i>${escapeHtml(prefix)}</i>` : ""}${inner}</button>`;
    };
    const sizeClass = (n) => layout.runtime ? (n <= 2 ? " half" : " third") : layout.tiles.length === 5 ? (n <= 3 ? " third" : " half") : "";
    const tileHtml = (tile, n) => {
      const keyMark = tile.main ? `<span class="key">${escapeHtml(t("MAIN", "ГОЛОВНА"))}</span>` : "";
      if (edit) {
        const rows = indices.map(index => ({ index, row:gridReading(config, states, source, tile, index) }));
        const done = rows.every(({ row }) => row);
        const slots = rows.map(({ index, row }) => {
          const prefix = parallel ? `#${index + 1}` : "";
          if (row && !row.bound && row.derived) {
            const shown = gridFormat(tile, row.v, english);
            return `<span class="slot derived">${prefix ? `<i>${prefix}</i>` : ""}${escapeHtml(shown.text)}<i>${escapeHtml(row.derived === "pv" ? t("PV sum", "сума PV") : row.derived === "channels" ? t("channel sum", "сума каналів") : t("from phases", "з фаз"))}</i></span>`;
          }
          return slotHtml(inverterField(index, tile.field), tile, prefix);
        }).join("");
        return `<div class="g-tile e${sizeClass(n)}" style="order:${n * 2}"><span class="g-num${done ? " ok" : ""}">${n}</span>${keyMark}<dt>${L(tile.label)}</dt><div class="slots">${slots}</div></div>`;
      }
      if (tile.k === "status") {
        const status = gridStatus(config, states, indices);
        let icon = "none", text = "—";
        if (status) {
          if (status.on === indices.length) { icon = "ok"; text = t("Yes", "Є"); }
          else if (status.on === 0 && status.known) { icon = "off"; text = t("No", "Немає"); }
          else if (status.on) { icon = "part"; text = t(`${status.on} of ${indices.length}`, `${status.on} з ${indices.length}`); }
        }
        const split = parallel && status ? `<div class="g-split">${status.values.map((value, k) => `<span><i>#${indices[k] + 1}</i><b class="${value === "on" ? "dotok" : value === "off" ? "dotbad" : ""}">${value === "on" ? "●" : value === "off" ? "○" : "—"}</b></span>`).join("")}</div>` : "";
        return `<div class="g-tile${sizeClass(n)}" style="order:${n * 2}"><dt>${L(tile.label)}</dt><span class="g-stat">${gridIcons[icon]}</span><span class="g-stat-t">${escapeHtml(text)}</span>${split}</div>`;
      }
      const total = gridFormat(tile, gridTotal(config, states, source, tile, indices), english);
      const split = parallel ? `<div class="g-split">${indices.map(index => {
        const row = gridReading(config, states, source, tile, index);
        return `<span><i>#${index + 1}</i><b>${escapeHtml(gridFormat(tile, row?.v ?? null, english).text)}</b></span>`;
      }).join("")}</div>` : "";
      return `<div class="g-tile${sizeClass(n)}" style="order:${n * 2}"><dt>${L(tile.label)}</dt><dd>${escapeHtml(total.text)}<small>${escapeHtml(total.unit)}</small></dd>${parallel ? `<span class="g-agg">${L(gridAggText[tile.agg] ?? gridAggText.avg)}</span>` : ""}${split}</div>`;
    };
    if (o.page === "sub") {
      return indices.map(index => {
        const columns = gridColumns(config, source, index);
        const pv = source === "pv";
        const wide = columns.length > 4;
        const add = edit && pv && columns.length < 6 ? `<th class="pvadd"><button type="button" class="g-btn" data-gact="pvadd" data-gi="${index}" aria-label="${escapeHtml(t(`Add PV${columns.length + 1}`, `Додати PV${columns.length + 1}`))}">+<small>PV${columns.length + 1}</small></button></th>` : "";
        const head = (column) => `<th scope="col">${gridColumnTitle(source, column)}${edit && pv && columns.length > 1 && column === columns.at(-1)
          ? ` <button type="button" class="pvdel" data-gact="pvdel" data-gi="${index}" aria-label="${escapeHtml(t(`Remove PV${column}`, `Прибрати PV${column}`))}">×</button>` : ""}</th>`;
        const caption = parallel ? t(`Inverter #${index + 1} · ${pv ? "by input" : "by phase"}`, `Інвертор #${index + 1} · ${pv ? "по входах" : "по фазах"}`)
          : t(pv ? "By input" : "By phase", pv ? "Окремо по входах" : "Окремо по фазах");
        const rows = gridSubMetrics.map(metric => `<tr><th scope="row">${L(metric.label)}${wide ? `, ${L(gridUnits[metric.unit])}` : ""}</th>${columns.map(column => {
          const name = inverterField(index, gridSubField(source, column, metric.k));
          if (edit) return `<td class="e">${slotHtml(name, metric)}</td>`;
          const shown = gridFormat(metric, gridValue(metric.k, metric.unit, config[name], states), english);
          return `<td>${escapeHtml(shown.text)}${shown.text === "—" || wide ? "" : `<small>${escapeHtml(shown.unit)}</small>`}</td>`;
        }).join("")}${add ? "<td></td>" : ""}</tr>`).join("");
        const sheet = edit && sel && sel !== "__runtime" && columns.some(column => gridSubMetrics.some(({ k }) => inverterField(index, gridSubField(source, column, k)) === sel)) ? o.sheet(sel) : "";
        return `<div class="g-tbl" data-cols="${columns.length + (add ? 1 : 0)}"><table><caption>${escapeHtml(caption)}</caption>
          <thead><tr><th scope="col">${escapeHtml(t("Reading", "Показ"))}</th>${columns.map(head).join("")}${add}</tr></thead><tbody>${rows}</tbody></table></div>${sheet}`;
      }).join("") + (edit ? `<p class="g-note">${escapeHtml(source === "pv"
        ? t("Each inverter's own readings, no averages. Without a total solar power the Power tile adds the inputs up.", "Окремі значення кожного інвертора, без середніх. Якщо загальної потужності немає — кубик «Потужність» складе входи.")
        : t("Each inverter's own readings, no averages. If voltage or current is not linked in the tiles, the tile averages these phases.", "Окремі значення кожного інвертора, без середніх. Якщо напругу чи струм у кубиках не прив'язано, кубик рахує середнє з цих фаз."))}</p>` : "");
    }
    // Battery runtime block
    let runtime = "";
    if (layout.runtime) {
      if (edit) {
        const capacity = batteryCapacityOf(config, states);
        const cutoff = runtimeCutoffOf(config, states);
        const fmt = english ? englishMeasurementFormat : measurementFormat;
        const origin = { manual:t("typed in", "вказано вручну"), banks:t("from the banks", "з ємностей АКБ"), sensor:t("from the sensor", "із сенсора"), ah:t("Ah × voltage", "А·год × напруга") };
        runtime = `<button type="button" class="g-rt e ${capacity ? "ok" : "empty"}${sel === "__runtime" ? " sel" : ""}" style="order:0" data-gslot="__runtime">
          <span>⏱ ${escapeHtml(t("Estimated time", "Розрахунковий час"))}</span><b>${capacity ? escapeHtml(t(`${fmt.format(Math.round(capacity.kwh * 10) / 10)} kWh · to ${fmt.format(cutoff)} %`, `${fmt.format(Math.round(capacity.kwh * 10) / 10)} кВт·год · до ${fmt.format(cutoff)} %`)) : escapeHtml(t("+ Set battery capacity", "+ Вказати ємність АКБ"))}</b>
          <small>${escapeHtml(capacity ? t(`capacity ${origin[capacity.source]}`, `ємність ${origin[capacity.source]}`) + (config.battery_runtime_cutoff === undefined || config.battery_runtime_cutoff === "" ? t(" · default threshold", " · поріг типовий") : "") : t("without capacity the time is not calculated", "без ємності час не рахується"))}</small></button>`;
      } else {
        const info = runtimeInfo(config, states, o.soc ?? combinedSoc(config, states), t);
        runtime = `<div class="g-rt${info.charging ? " chg" : ""}" style="order:0"><span>${escapeHtml(info.label)}</span><b>${escapeHtml(info.value)}</b><small>${escapeHtml(info.note)}</small></div>`;
      }
    }
    let sheet = "";
    if (edit && sel === "__runtime") sheet = o.runtimeSheet();
    else if (edit && sel) {
      const position = layout.tiles.findIndex(tile => indices.some(index => inverterField(index, tile.field) === sel));
      if (position >= 0) {
        const rowEnd = layout.runtime ? (position < 2 ? 2 : 5) : layout.tiles.length === 5 ? (position < 3 ? 3 : 5) : layout.tiles.length;
        sheet = o.sheet(sel, rowEnd * 2 + 1);
      }
    }
    const tiles = `<dl class="g-tiles" data-n="${layout.runtime ? "bat" : layout.tiles.length}">${runtime}${layout.tiles.map((tile, k) => tileHtml(tile, k + 1)).join("")}${sheet}</dl>`;
    const subButton = layout.sub && gridHasSub(config, source)
      ? `<div class="g-row"><button type="button" class="g-btn" data-gact="sub">${escapeHtml(source === "pv" ? t("By PV input", "По входах PV") : t("By phase L1 · L2 · L3", "По фазах L1 · L2 · L3"))} ›</button></div>` : "";
    const chartButton = layout.chartPage ? `<div class="g-row"><button type="button" class="g-btn" data-gact="chart">${escapeHtml(t("Power graph · 24 h", "Графік потужності · 24 год"))} ›</button></div>` : "";
    const banks = !edit && o.dual ? `<div class="g-tbl"><table><caption>${escapeHtml(t("Individual batteries", "Окремі АКБ"))}</caption>
      <thead><tr><th scope="col">${escapeHtml(t("Reading", "Показ"))}</th>${batteryColumns.map((_, k) => `<th scope="col">${escapeHtml(t(`Battery ${k + 1}`, `АКБ ${k + 1}`))}</th>`).join("")}</tr></thead>
      <tbody>${layout.tiles.filter(tile => tile.k !== "soc").map(tile => `<tr><th scope="row">${L(tile.label)}</th>${batteryColumns.map(({ prefix }) => {
        const shown = gridFormat(tile, gridValue(tile.k, tile.unit, config[`${prefix}_${tile.k}`], states), english);
        return `<td>${escapeHtml(shown.text)}${shown.text === "—" ? "" : `<small>${escapeHtml(shown.unit)}</small>`}</td>`;
      }).join("")}</tr>`).join("")}</tbody></table></div>` : "";
    return tiles + subButton + chartButton + banks;
  }

  const gridStyles = `
    .g-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:9px 9px 7px}
    .g-tiles[data-n="3"]{grid-template-columns:repeat(3,minmax(0,1fr))}
    .g-tiles[data-n="bat"],.g-tiles[data-n="5"]{grid-template-columns:repeat(6,minmax(0,1fr))}
    .g-tile.half{grid-column:span 3}.g-tile.third{grid-column:span 2}
    .g-tile{min-width:0;margin:0;padding:5px 3px 6px;text-align:center;border:1px solid var(--details-metric-edge);border-radius:4px;background:var(--details-metric-face);display:flex;flex-direction:column;align-items:center;gap:1px;position:relative}
    .g-tile dt{color:var(--details-muted);font-size:clamp(10px,2.9cqi,14px);overflow-wrap:anywhere}
    .g-tile dd{margin:1px 0 0;font-size:clamp(13px,4.4cqi,22px);font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
    .g-tile dd small{margin-inline-start:.22em;font-size:.58em;font-weight:600;color:var(--details-muted)}
    .g-agg{font-size:clamp(8.5px,2.3cqi,11px);color:var(--details-muted);opacity:.85;margin-top:-1px}
    .g-split{align-self:stretch;margin-top:3px;padding-top:3px;border-top:1px solid var(--details-rule);display:grid;gap:1px;font-size:clamp(9.5px,2.65cqi,12.5px);font-variant-numeric:tabular-nums}
    .g-split span{display:flex;justify-content:space-between;gap:3px;padding:0 3px}
    .g-split i{font-style:normal;color:var(--details-muted)}
    .g-split b{font-weight:700}
    .g-stat{display:grid;place-items:center;width:clamp(22px,6.4cqi,30px);height:clamp(22px,6.4cqi,30px);margin:2px 0 0;color:var(--details-muted)}
    .g-stat svg{width:100%;height:100%}
    .g-stat-t{font-size:clamp(10px,2.9cqi,13.5px);font-weight:700}
    .dotok{color:#2fbf6a}.dotbad{color:#e5392b}
    .g-rt{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:2px 10px;padding:7px 10px 8px;border:1px solid var(--details-metric-edge);border-radius:4px;background:var(--details-metric-face);color:inherit;font:inherit;text-align:left;min-height:0}
    .g-rt span{color:var(--details-muted);font-size:clamp(11px,3.1cqi,15px)}
    .g-rt b{font-size:clamp(16px,5cqi,24px);font-weight:700;text-align:end;font-variant-numeric:tabular-nums}
    .g-rt small{grid-column:1/-1;color:var(--details-muted);font-size:clamp(10px,2.8cqi,13px)}
    .g-rt.chg b{color:#2fbf6a}
    .g-row{display:flex;gap:6px;margin:0 9px 7px}
    .g-btn{display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;min-width:38px;min-height:34px;padding:0 9px;border:1px solid var(--details-metric-edge);border-radius:4px;background:var(--details-metric-face);color:inherit;cursor:pointer;font:600 13px var(--lcd-font,Roboto,Arial,sans-serif);touch-action:manipulation}
    .g-row .g-btn{flex:1}
    .g-btn:focus-visible{outline:2px solid var(--details-focus);outline-offset:2px}
    .g-tbl{margin:0 9px 7px;border:1px solid var(--details-metric-edge);border-radius:4px;background:var(--details-metric-face)}
    .g-tiles+.g-tbl,.g-tbl:first-child{margin-top:9px}
    .g-tbl table{width:100%;table-layout:fixed;border-collapse:collapse;font-variant-numeric:tabular-nums}
    .g-tbl caption{padding:6px 7px;text-align:start;font-size:clamp(12px,3.3cqi,16px);font-weight:700}
    .g-tbl th,.g-tbl td{border-top:1px solid var(--details-rule);padding:4px 3px;text-align:center;font-size:clamp(10px,3.1cqi,14px)}
    .g-tbl th{color:var(--details-muted);font-weight:600}
    .g-tbl th:first-child{width:29%;padding-inline-start:7px;text-align:start}
    .g-tbl td{font-weight:700}
    .g-tbl small{margin-inline-start:.25em;font-size:.72em;font-weight:600;color:var(--details-muted)}
    .g-tbl[data-cols="5"] th,.g-tbl[data-cols="5"] td,.g-tbl[data-cols="6"] th,.g-tbl[data-cols="6"] td,.g-tbl[data-cols="7"] th,.g-tbl[data-cols="7"] td{font-size:clamp(9px,2.6cqi,12px);padding:3px 2px}
    .g-tbl[data-cols="5"] th:first-child,.g-tbl[data-cols="6"] th:first-child,.g-tbl[data-cols="7"] th:first-child{width:22%}
    .g-tbl .pvdel{margin-left:2px;border:0;background:#e5392b;color:#fff;border-radius:50%;width:16px;height:16px;min-height:0;line-height:16px;padding:0;font:700 11px Roboto,Arial;cursor:pointer}
    .g-tbl th.pvadd{width:13%}
    .g-tbl .pvadd .g-btn{min-width:0;width:100%;min-height:30px;padding:0;border:2px dashed #f2b632;color:#f2b632;background:#f2b6321a;font-size:16px;gap:2px}
    .g-tbl .pvadd small{font-size:9px;color:#f2b632;margin:0}
  `;

  const styles = `
    :host {
      display:block;
      /* КЛАСіК keeps the original Deye font stack; ТЕХНіКА uses the Home Assistant font, which is always loaded. */
      --lcd-font:Roboto,Arial,sans-serif;
    }
    ha-card { display:block; overflow:hidden; border:1px solid #303840; border-radius:12px; background:#171b1d; padding:6px; }
    .screen { display:block; width:100%; height:auto; background:${screenWhite}; border-radius:5px; font-family:var(--lcd-font); }
    text { font-variant-numeric:tabular-nums; }
    .top { fill:#142b38; font-size:15px; font-weight:600; }
    .track,.fill { stroke-width:9.7; stroke-linecap:butt; }
    .track { fill:none; stroke:#101415; }
    .symbol { color:#101415; }
    .scale { fill:#24404e; font-size:13px; }
    .value,.unit,.soc,.soc-side,.parallel { text-anchor:middle; }
    .value { fill:#165f49; font-size:13.6px; font-weight:600; }
    .value[data-unavailable] { fill:#626a68; }
    .unit { fill:#17363c; font-size:9.5px; font-weight:600; }
    .soc { fill:#229d56; font-size:16px; font-weight:600; }
    .soc-side,.parallel { fill:#285e51; font-size:10px; font-weight:600; }
    .dual-battery,.screen[data-battery="dual"] .single-battery { display:none; }
    .screen[data-battery="dual"] .dual-battery { display:inline; }
    .status { stroke:#2d8852; stroke-width:2.9; }
    .status-text { fill:#235f49; font-size:15px; font-weight:600; text-anchor:middle; }
    .status-text[data-on] { font-size:18px; }
    .status-text[data-long] { font-size:11.5px; }
    .screen[data-status="missing"] .status { stroke:#7b8687; }
    .screen[data-status="missing"] .status-text { fill:#626a68; }
    .screen[data-status="fault"] .status { stroke:#bc3b2b; }
    .screen[data-status="fault"] .status-text { fill:#a22f23; }
    .wire-track { stroke:#245163; stroke-width:1.25; stroke-dasharray:1.2 1.65; fill:none; }
    .arrow { fill:#131716; }
    .dot { fill:#43bd47; }
    .wire .forward,.wire .backward { visibility:hidden; }
    .wire[data-flow="forward"] .forward,.wire[data-flow="backward"] .backward { visibility:visible; }
    .grid-outage { display:none; color:#c32536; }
    .grid-outage text { fill:currentColor; font-size:11px; font-weight:650; text-anchor:middle; }
    .wire[data-disconnected] .grid-outage { display:inline; }
    .screen [role="button"] { cursor:pointer; }
    .screen [role="button"]:focus { outline:none; }
    .screen [role="button"]:focus-visible .hit { stroke:#346e30; stroke-width:1; stroke-dasharray:3 2; }
    [data-clock-tap],[data-open-about] { touch-action:manipulation; }
    .about {
      box-sizing:border-box; width:min(480px,calc(100% - 24px)); max-height:calc(100% - 24px);
      padding:0; border:1px solid #697752; border-radius:16px; overflow:auto;
      color:#f5f7ec; background:#171c13; color-scheme:dark; box-shadow:0 20px 60px #0009;
      font:400 15px/1.5 var(--lcd-font); text-align:start;
    }
    .about::backdrop { background:#0c100ade; }
    .about-close { position:absolute; top:10px; right:10px; margin:0; }
    .about-close button {
      display:grid; place-items:center; width:44px; height:44px; padding:0; border:1px solid #b1bc98;
      border-radius:50%; color:#f5f7ec; background:#171c13; font:400 28px/1 var(--lcd-font); cursor:pointer;
    }
    .about-close button:focus { outline:none; box-shadow:0 0 0 2px #171c13,0 0 0 4px #dceca4; }
    .about-close button:focus:not(:focus-visible) { box-shadow:none; }
    .about-content {
      box-sizing:border-box; padding:20px 24px 24px; padding:clamp(16px,5vw,26px);
      border-top:2px solid #95ad55;
    }
    .about-content h2 { margin:2px 0 1px; font-size:32px; font-size:clamp(28px,8vw,40px); line-height:1.08; }
    .about-version { margin:0; color:#cfdf97; font-size:13px; font-weight:700; }
    .about-message { margin:10px 0 16px; color:#d9e0d0; }
    .about-content h2,.about-version { padding-inline-end:47px; }
    .about-links { display:flex; flex-wrap:wrap; gap:8px; }
    .about-links a {
      box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; gap:9px;
      min-height:44px; max-width:100%; padding:6px 12px; border:1px solid transparent;
      border-radius:6px; color:#fff; font-weight:700; text-decoration:none; line-height:1.25;
    }
    .about-links .about-youtube { background:#e6002b; }
    .about-links .about-youtube:hover { background:#ce0026; }
    .about-links .about-monobank { background:#101012; border-color:#888; }
    .about-links .about-monobank:hover { background:#232327; }
    .about-youtube svg { width:26px; height:auto; flex:none; }
    .about-youtube span { white-space:nowrap; }
    .about-links a:focus-visible { outline:2px solid #e6f3ba; outline-offset:3px; }
    .about-media {
      display:grid; grid-template-columns:148px minmax(0,1fr); grid-template-areas:"qr covers" "bank bank";
      align-items:start; gap:5px 16px; margin-top:16px;
    }
    .about-qr { grid-area:qr; display:block; width:min(148px,100%); height:auto; }
    .about-support { grid-area:bank; margin:0; color:#d9e0d0; }
    .about-collage { grid-area:covers; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:5px; }
    .about-collage img {
      display:block; box-sizing:border-box; width:100%; height:auto; aspect-ratio:16/9; object-fit:cover;
      border:1px solid #707862; border-radius:5px;
    }
    @media (max-width:430px) {
      .about-media { grid-template-columns:minmax(0,1fr); grid-template-areas:"qr" "bank" "covers"; row-gap:8px; }
    }
    @media (prefers-reduced-motion:reduce) { .wire .dot { display:none; } }
    [hidden] { display:none !important; }
    .settings {
      --lcd-ink:#f4faff;
      --lcd-line:#aeedfc;
      --lcd-field:#def4ed;
      --lcd-dark:#12284e;
      --lcd-button:#08469744;
      --lcd-hover:#2169a1;
      --lcd-hint:#e4f6ff;
      --lcd-focus:#ffdf84;
      --lcd-selected:#f2bf32;
      --lcd-background:linear-gradient(180deg,#302183 13%,#2d46a2 53%,#157d98 100%);
      --lcd-adjust-surface:#172b40;
      --lcd-adjust-edge:#597d95;
      --lcd-adjust-button:#203d56;
      box-sizing:border-box; inline-size:100%; min-inline-size:0; container-type:inline-size;
      color:var(--lcd-ink); color-scheme:light; font:400 14px/1.18 var(--lcd-font);
    }
    .lcd-surface {
      display:flex; flex-direction:column; inline-size:100%; aspect-ratio:400 / 268;
      overflow:hidden; border-radius:5px; background:var(--lcd-background);
    }
    .settings-header {
      display:flex; align-items:center; justify-content:space-between; gap:1.5cqi; flex:none; box-sizing:border-box; height:8.5cqi;
      padding:0 1.2cqi 0 2.1cqi; border-bottom:1px solid var(--lcd-line); background:linear-gradient(180deg,#159ac5,#147ba8);
    }
    .settings-header h2 { margin:0; min-width:0; font-size:5.15cqi; line-height:1; }
    .settings-menu { display:flex; flex:1; flex-direction:column; padding:5cqi 3cqi 3cqi; min-height:0; }
    .settings-tiles {
      display:grid; flex:1; min-height:0; gap:2.4cqi;
      grid-template-columns:minmax(0,.9fr) repeat(2,minmax(0,1fr));
      grid-template-rows:repeat(3,minmax(0,1fr));
      grid-template-areas:"battery work smart" "battery grid gen" "basic advanced device";
    }
    .settings-tile[data-settings-menu="battery"] { grid-area:battery; }
    .settings-tile[data-settings-menu="work"] { grid-area:work; }
    .settings-tile[data-settings-menu="smart"] { grid-area:smart; }
    .settings-tile[data-settings-menu="grid"] { grid-area:grid; }
    .settings-tile[data-settings-menu="gen"] { grid-area:gen; }
    .settings-tile[data-settings-menu="basic"] { grid-area:basic; }
    .settings-tile[data-settings-menu="advanced"] { grid-area:advanced; }
    .settings-tile[data-settings-menu="device"] { grid-area:device; }
    .settings-tile,.settings-button,.settings-home {
      box-sizing:border-box; min-inline-size:0; color:var(--lcd-ink); background:var(--lcd-button);
      border:1px solid var(--lcd-line); border-radius:3px; font:inherit; cursor:pointer; touch-action:manipulation;
    }
    .settings-tile { min-height:0; overflow:hidden; padding:0 .8cqi; font-size:clamp(9px,3.55cqi,22px); line-height:1.15; overflow-wrap:anywhere; border-width:2px; }
    .settings-home { display:grid; place-items:center; flex:none; inline-size:9cqi; block-size:6.6cqi; padding:0; border-radius:5px; }
    .settings-home svg { display:block; block-size:74%; fill:currentColor; }
    .settings-tile:hover,.settings-button:enabled:hover,.settings-home:hover { background:var(--lcd-hover); }
    .settings-body {
      display:grid; flex:1; min-height:0; margin:0; grid-template-columns:minmax(0,1fr) 12.75cqi;
    }
    .settings-main,.settings-page { position:relative; min-width:0; min-height:0; }
    .settings-page { height:100%; overflow:hidden; }
    .native-caption,.native-rule,.native-readout,.native-alarms,
    .native-check,.native-number {
      position:absolute; inset-inline-start:calc(var(--x) * .25cqi); top:calc(var(--y) * .25cqi);
      inline-size:calc(var(--w) * .25cqi); block-size:calc(var(--h) * .25cqi);
      box-sizing:border-box; min-width:0; margin:0; padding:0;
      font-size:clamp(9px,3.48cqi,24px); line-height:1.08;
    }
    .native-caption {
      display:block; align-content:center; overflow:hidden; font-weight:600;
      font-size:clamp(8px,var(--caption-font),24px);
    }
    .native-rule { background:var(--lcd-line); }
    .native-readout {
      display:block; align-content:center; line-height:1.05; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;
    }
    .native-box { text-align:center !important; background:var(--lcd-field); color:var(--lcd-dark); border:1px solid var(--lcd-line); }
    .native-alarms { overflow:auto; font-variant-numeric:tabular-nums; }
    .native-alarms div {
      display:grid; grid-template-columns:minmax(0,1fr) auto; min-height:4.8cqi; gap:.75cqi; align-items:center;
    }
    .native-alarms span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .native-alarms time { white-space:nowrap; font-size:.88em; }
    .native-number { display:flex; align-items:stretch; gap:.3cqi; }
    .lcd-number-value {
      display:flex; align-items:center; box-sizing:border-box; inline-size:100%; flex:1 1 auto; min-width:0;
      border:1px solid var(--lcd-line); border-radius:2px; background:var(--lcd-field); color:var(--lcd-dark);
    }
    .lcd-number input,.lcd-number select {
      box-sizing:border-box; min-width:0; width:auto; height:100%; flex:1 1 0; padding:0 .25cqi;
      border:0; background:transparent; color:inherit; text-align:center; border-radius:2px;
      font:inherit; font-variant-numeric:tabular-nums; appearance:none;
    }
    .lcd-number input:disabled,.lcd-number select:disabled { opacity:1; -webkit-text-fill-color:currentColor; }
    .lcd-number input::placeholder { color:inherit; opacity:.7; }
    .lcd-number select { text-overflow:ellipsis; cursor:pointer; }
    .lcd-number option { color:var(--lcd-dark); background:var(--lcd-field); }
    .lcd-unit { padding-inline-end:.45cqi; flex:none; font-size:.82em; }
    .lcd-number-value[data-unit] { justify-content:center; }
    .lcd-number-value[data-unit] input { flex:0 0 auto; padding:0; text-align:end; }
    .lcd-number-value[data-unit] .lcd-unit { padding:0; font-size:1em; }
    .lcd-unit:empty { display:none; }
    .native-number button {
      flex:0 0 5.8cqi; padding:0; font:inherit; border-radius:2px; color:var(--lcd-dark);
      border:1px solid var(--lcd-line); background:var(--lcd-field);
    }
    .native-check { display:flex; align-items:center; gap:.8cqi; cursor:pointer; }
    .native-check[data-inactive] { opacity:.45; cursor:default; }
    .native-check span { min-width:0; overflow-wrap:normal; }
    .native-check[data-compact] { justify-content:center; }
    .native-check input {
      box-sizing:border-box; appearance:none; display:grid; place-items:center; flex:none;
      width:calc(var(--h) * .25cqi); height:calc(var(--h) * .25cqi);
      margin:0; border:1px solid var(--lcd-line); border-radius:1px; background:var(--lcd-field);
      cursor:inherit;
    }
    .native-check input[type="radio"] { width:4.1cqi; height:4.1cqi; border-radius:50%; }
    .native-check input:checked::before { content:""; width:70%; height:70%; border-radius:50%; background:var(--lcd-mark,var(--lcd-dark)); }
    /* Radio dot drawn as a centred gradient: a pseudo element lands half a pixel off on fractional sizes. */
    .native-check:not([data-setting="energy_pattern"]) input[type="radio"]:checked { background:radial-gradient(circle closest-side, var(--lcd-mark,var(--lcd-dark)) 70%, transparent calc(70% + .6px)), var(--lcd-field); }
    .native-check:not([data-setting="energy_pattern"]) input[type="radio"]:checked::before { content:none; }
    .native-check[data-setting="energy_pattern"] input { width:5.2cqi; height:5.2cqi; border-radius:1px; }
    .native-check input[type="checkbox"]:checked::before,
    .native-check[data-setting="energy_pattern"] input:checked::before {
      box-sizing:border-box; width:35%; height:66%; border-radius:0; background:none;
      border:solid var(--lcd-mark,var(--lcd-dark)); border-width:0 2px 2px 0; transform:translateY(-9%) rotate(42deg);
    }
    .native-check input:indeterminate::before { content:""; width:55%; height:1px; background:var(--lcd-dark); opacity:.45; }
    .native-check[data-unavailable],.native-number[data-unavailable] { opacity:.72; cursor:default; }
    .lcd-setting[data-dirty] .lcd-number-value,.lcd-setting[data-numeric-active] .lcd-number-value {
      outline:2px solid var(--lcd-selected); outline-offset:-2px;
    }
    .settings-controls { padding:.65cqi .65cqi .8cqi 0; display:flex; flex-direction:column; gap:.75cqi; }
    .settings-nav,.settings-actions {
      display:grid; grid-template-rows:repeat(3,minmax(0,1fr)); min-height:0; flex:3;
      padding:.5cqi; gap:.4cqi; border:1px solid var(--lcd-line); border-radius:4px;
    }
    .settings-actions { flex:2; grid-template-rows:repeat(2,minmax(0,1fr)); }
    .settings-page-name { align-content:center; text-align:center; font-size:clamp(8px,2.72cqi,16px); overflow-wrap:anywhere; }
    .settings-button { display:grid; place-items:center; width:100%; height:100%; padding:0; }
    .settings-button svg { display:block; width:82%; max-height:95%; fill:currentColor; }
    .settings-button:disabled { opacity:.5; cursor:default; }
    .settings :focus-visible { outline:2px solid var(--lcd-focus); outline-offset:-2px; }
    .lcd-number input:focus-visible { outline:0; }
    .lcd-number-value:focus-within { outline:2px solid var(--lcd-selected); outline-offset:-2px; }
    .settings h2:focus { outline:0; }
    .lcd-placeholder { position:absolute; inset:42% 0 auto; margin:0; text-align:center; font-size:4cqi; }
    .settings-feedback { color:var(--primary-text-color,#eef4f7); }
    .settings-hint { margin:4px 1px 0; font-size:clamp(11px,2.85cqi,16px); overflow-wrap:anywhere; }
    .settings-hint[data-error] { padding:3px 5px; border-radius:2px; color:#441428; background:#ffe3e9; }
    .native-check[data-locked],.native-number[data-locked] { opacity:.45; cursor:not-allowed; }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
    .apply-confirm {
      box-sizing:border-box; width:min(440px,calc(100% - 24px)); max-height:calc(100% - 24px); overflow:auto;
      padding:18px; border:1px solid var(--lcd-adjust-edge); border-radius:14px; color:var(--lcd-ink);
      background:var(--lcd-adjust-surface); font:400 15px/1.4 var(--lcd-font); box-shadow:0 18px 50px #0007;
    }
    .apply-confirm::backdrop { background:#0a0d12b0; }
    .apply-confirm h3 { margin:0 0 10px; font-size:18px; }
    .apply-list { margin:0; padding:0; list-style:none; display:grid; gap:8px; }
    .apply-list li { display:grid; gap:3px; padding:9px 11px; border:1px solid var(--lcd-adjust-edge); border-radius:9px; background:var(--lcd-adjust-button); }
    .apply-list li[data-risk] { border-color:#d9822b; border-width:2px; }
    .apply-name { font-size:13px; opacity:.85; }
    .apply-change { display:flex; flex-wrap:wrap; gap:8px; align-items:baseline; font-variant-numeric:tabular-nums; }
    .apply-risk { margin:4px 0 0; padding:7px 9px; border-radius:6px; color:#3d1d05; background:#ffe1c2; font-size:13px; }
    .apply-actions { display:flex; justify-content:flex-end; flex-wrap:wrap; gap:8px; margin-top:14px; }
    .apply-actions button {
      min-height:44px; padding:8px 16px; border:1px solid var(--lcd-adjust-edge); border-radius:9px;
      color:var(--lcd-ink); background:var(--lcd-adjust-button); font:inherit; cursor:pointer;
    }
    .apply-actions .apply-go { color:#fff; background:#2f6b4a; border-color:#2f6b4a; font-weight:650; }
    :host([data-appearance="dark"]) .apply-actions .apply-go { color:#132017; background:var(--dark-mark); border-color:var(--dark-mark); }
    .apply-confirm :focus-visible { outline:2px solid var(--lcd-focus); outline-offset:2px; }
    .numeric-panel {
      display:grid; grid-template-columns:minmax(0,1fr) minmax(208px,43%); align-items:center; gap:9px;
      box-sizing:border-box; margin-block-start:8px; padding:clamp(7px,2.2cqi,13px);
      color:var(--lcd-ink); background:var(--lcd-adjust-surface); border:1px solid var(--lcd-adjust-edge); border-radius:7px;
    }
    .numeric-header { display:flex; flex-direction:column; align-items:start; gap:3px; min-width:0; }
    .numeric-header h3 { margin:0; font-size:clamp(13px,3.25cqi,20px); }
    .numeric-header span { font-size:clamp(11px,2.7cqi,16px); flex:none; }
    @container (max-width:400px) {
      .numeric-panel { grid-template-columns:1fr; gap:6px; }
      .numeric-header { flex-direction:row; justify-content:space-between; align-items:center; }
    }
    .numeric-actions { display:grid; grid-template-columns:minmax(35px,.6fr) minmax(57px,1.3fr) minmax(35px,.6fr) minmax(68px,1fr); gap:4px; }
    .numeric-actions button,.numeric-entry {
      min-width:0; min-height:38px; padding:1px 4px; border:1px solid var(--lcd-line); border-radius:3px;
      color:var(--lcd-ink); background:var(--lcd-adjust-button); font:inherit;
    }
    .numeric-actions button { cursor:pointer; font-size:clamp(16px,4.9cqi,23px); touch-action:manipulation; }
    .numeric-actions button:disabled { opacity:.5; cursor:default; }
    .numeric-actions .numeric-close { font-size:clamp(11px,3.1cqi,16px); }
    .numeric-entry { display:flex; align-items:center; background:var(--lcd-field); color:var(--lcd-dark); }
    .numeric-entry input {
      width:auto; flex:1 1 0; min-width:0; min-height:32px; border:0; padding:0; background:transparent; color:inherit;
      text-align:center; font:600 clamp(16px,4.9cqi,25px)/1.15 var(--lcd-font);
    }
    .numeric-entry span { flex:none; font-size:.82em; }
    .numeric-entry:focus-within { outline:2px solid var(--lcd-selected); outline-offset:-2px; }
    .numeric-entry input:focus-visible { outline:0; }
    .details-history-head { display:flex; justify-content:space-between; align-items:center; gap:6px; }
    .details-history-tools { display:flex; flex-wrap:wrap; justify-content:flex-end; align-items:center; }
    .history-chart { touch-action:pan-y; user-select:none; -webkit-user-select:none; }
    .history-chart[data-zoomed] { cursor:grab; }
    .month-bar { stroke:none; }
    .month-pv { fill:#f2b632; } .month-load { fill:#5aa6e8; } .month-grid { fill:#c06cde; }
    .details-history-toggle { margin:4px; min-height:32px; padding:3px 8px; font:inherit; font-size:.88em; width:auto; cursor:pointer; }
    .history-part { padding-block-start:4px; border-top:1px solid var(--details-rule); }
    .history-part h4 { margin:3px 8px; font-size:clamp(11px,3.2cqi,16px); }
    .history-part p { margin:8px; color:var(--details-muted); }
    .generator { color:#101618; font-family:inherit; }
    .generator text { text-anchor:middle; }
    .generator-status { fill:currentColor; font-size:11px; font-weight:600; }
    .generator-amount { fill:#355c4e; font-size:13px; font-weight:700; }
    .generator-connector { fill:none; stroke:currentColor; opacity:.65; stroke-width:1; stroke-dasharray:1 1.65; }
    :host([data-appearance="dark"]) .generator { color:var(--dark-display-ink); }
    :host([data-appearance="dark"]) .generator-amount { fill:var(--dark-value); }
    :host([data-theme="technika"]) .generator { color:#4e6038; }
    :host([data-theme="technika"][data-appearance="dark"]) .generator { color:#c7d7a7; }
    .screen .soc[data-unweighted] { font-size:10px; }
    :host([data-theme="technika"]) .settings {
      --lcd-ink:#213b2e;
      --lcd-line:#62806b;
      --lcd-field:#f5f8ed;
      --lcd-dark:#2b5743;
      --lcd-button:#f6fae670;
      --lcd-hover:#c4dac7;
      --lcd-hint:#394f40;
      --lcd-focus:#674618;
      --lcd-background:radial-gradient(ellipse at 45% 5%,#f3f7e8,#e3eddd 60%,#cddfcc);
      --lcd-adjust-surface:#e5eddf;
      --lcd-adjust-edge:#77917c;
      --lcd-adjust-button:#edf4e9;
    }
    :host([data-theme="technika"]) .settings-header {
      background:linear-gradient(180deg,#adc5b0,#dce8d6);
    }
    :host([data-theme="technika"]) .settings-tile {
      border-radius:6px; box-shadow:inset 0 0 0 1px #ffffff84;
    }
    :host([data-theme="technika"]) .settings-button[data-settings-button="apply"]:enabled {
      color:#fff; background:#335945;
    }

    .technika-only,.technika-gear-dark { display:none; }
    :host([data-theme="technika"]) {
      --technika-background:url("${technikaBackground}");
      --technika-frame:#2a2d30;
      --technika-frame-edge:#4c5054;
      --flow:#5b7138;
      --flow-edge:#586b3d;
      --flow-body:#b1c687;
    }
    :host([data-theme="technika"]) .technika-only { display:inline; }
    :host([data-theme="technika"]) .classic-only { display:none; }
    :host([data-theme="technika"]) ha-card {
      border-color:var(--technika-frame-edge); border-radius:13px; background:var(--technika-frame);
    }
    :host([data-theme="technika"]) .screen {
      background:#e3e6e2 url("${smokedLightBackground}") center / 100% 100% no-repeat;
      border-radius:6px; box-shadow:inset 0 0 0 1px #fffc; font-family:var(--lcd-font);
    }
    :host([data-theme="technika"]) .top { fill:#23291a; }
    :host([data-theme="technika"]) .track { stroke:#abb193; stroke-width:9; stroke-linecap:round; }
    :host([data-theme="technika"]) .value { fill:#23291a; font-size:15px; font-weight:750; }
    :host([data-theme="technika"]) .value[data-unavailable] { fill:#4f5b4e; }
    :host([data-theme="technika"]) .scale { fill:#4b5238; font-size:11.5px; font-weight:550; }
    :host([data-theme="technika"]) .unit { fill:#4b5238; font-size:8.5px; font-weight:650; letter-spacing:.8px; }
    :host([data-theme="technika"]) .soc,
    :host([data-theme="technika"]) .soc-side { fill:#405921; font-weight:750; }
    :host([data-theme="technika"]) .status { stroke:#4b6031; stroke-width:1.65; }
    :host([data-theme="technika"]) .status-text,
    :host([data-theme="technika"]) .parallel { fill:#fcffe8; font-weight:750; }
    :host([data-theme="technika"]) .status-ring { stroke:#d9e7a4; stroke-opacity:.96; }
    :host([data-theme="technika"]) .screen:not([data-status="normal"]) .status-ring { display:none; }
    :host([data-theme="technika"]) .screen[data-status="missing"] .status { fill:#e5eee5; stroke:#708078; }
    :host([data-theme="technika"]) .screen[data-status="missing"] .status-text,
    :host([data-theme="technika"]) .screen[data-status="missing"] .parallel { fill:#475c52; }
    :host([data-theme="technika"]) .screen[data-status="fault"] .status { fill:#743e37; stroke:#9d3230; }
    :host([data-theme="technika"]) .screen[data-status="fault"] .status-text { fill:#ffe7d7; }
    :host([data-theme="technika"]) .screen .wire-track {
      stroke:var(--flow); stroke-width:1.4; stroke-dasharray:4.4 2.65 .25 2.65; stroke-linecap:round;
    }
    :host([data-theme="technika"]) .grid-outage [fill="#ffffff"] { fill:#edece9; }
    .technika-arrow,.particle-halo { fill:var(--flow); }
    .particle-edge { fill:var(--flow-edge); }
    .particle-body { fill:var(--flow-body); }
    .flow-glow-halo { fill:var(--flow); }
    .flow-core { fill:#fbfff2; }
    .flow-tail { fill:none; stroke:var(--flow); stroke-linecap:round; }
    .flow-spark { fill:var(--flow); }
    @media (prefers-reduced-motion:reduce) {
      :host([data-theme="technika"]) .flow-layer { display:none; }
    }

    .details-screen {
      --details-ink:#f0faff;
      --details-muted:#d7edff;
      --details-rule:#b4dcec56;
      --details-zero:#b4dceca7;
      --details-edge:#9ee2f5;
      --details-metric-edge:#a4dbf085;
      --details-metric-face:#1332704f;
      --details-plot-face:#0d275e50;
      --details-line:#b3f4ff;
      --details-focus:#ffe38a;
      min-height:256px; box-sizing:border-box; border-radius:5px; overflow:hidden; container-type:inline-size;
      background:linear-gradient(180deg,#362382 12%,#254698 52%,#08768d 100%);
      color:var(--details-ink); color-scheme:light; font:400 14px/1.3 var(--lcd-font);
    }
    .details-header {
      display:flex; align-items:center; gap:8px; min-height:44px; padding:0 10px;
      border-bottom:2px solid var(--details-edge); background:linear-gradient(180deg,#0d75ae,#126499);
    }
    .details-header h2 { margin:0; font-size:19px; font-size:clamp(16px,4.7cqi,24px); font-weight:700; }
    .details-back {
      display:grid; place-items:center; box-sizing:border-box; width:38px; min-width:38px; height:36px;
      padding:0; border:1px solid var(--details-metric-edge); border-radius:4px;
      background:var(--details-metric-face); color:inherit; cursor:pointer; touch-action:manipulation;
    }
    .details-back svg { width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
    .details-back:focus-visible { outline:2px solid var(--details-focus); outline-offset:2px; }
    .details-header h2:focus { outline:0; }
    .details-runtime {
      display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:baseline; gap:2px 10px;
      margin:9px 9px 0; padding:7px 10px 8px; border:1px solid var(--details-metric-edge); border-radius:4px;
      background:var(--details-metric-face);
    }
    .details-runtime-label { color:var(--details-muted); font-size:clamp(11px,3.1cqi,15px); }
    .details-runtime-value { font-size:clamp(16px,5cqi,24px); font-weight:700; font-variant-numeric:tabular-nums; text-align:end; }
    .details-runtime-note { grid-column:1 / -1; color:var(--details-muted); font-size:clamp(10px,2.8cqi,13px); }
    .details-readings { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:5px; margin:9px 9px 7px; }
    .details-screen[data-source="battery"] .details-readings { grid-template-columns:repeat(4,minmax(0,1fr)); }
    .details-metric {
      min-width:0; padding:5px 5px 6px; text-align:center; border:1px solid var(--details-metric-edge);
      border-radius:4px; background:var(--details-metric-face);
    }
    .details-metric dt { color:var(--details-muted); font-size:11px; font-size:clamp(10px,2.9cqi,14px); overflow-wrap:anywhere; }
    .details-metric dd {
      margin:2px 0 0; font-size:16px; font-size:clamp(13px,4.4cqi,22px); font-weight:700;
      font-variant-numeric:tabular-nums; overflow-wrap:anywhere;
    }
    .details-metric small,.details-breakdown small {
      margin-inline-start:.28em; font-size:.72em; font-weight:600; color:var(--details-muted);
    }
    .details-metric small { font-size:.58em; }
    .details-metric small:empty,.details-breakdown small:empty { display:none; }
    .details-breakdown {
      margin:0 9px 7px; border:1px solid var(--details-metric-edge); border-radius:4px;
      background:var(--details-metric-face);
    }
    .details-breakdown table {
      width:100%; table-layout:fixed; border-collapse:collapse; font-variant-numeric:tabular-nums;
    }
    .details-breakdown caption {
      padding:6px 7px; text-align:start; font-size:clamp(12px,3.3cqi,16px); font-weight:700;
    }
    .details-breakdown th,.details-breakdown td {
      border-top:1px solid var(--details-rule); padding:4px 3px; text-align:center;
      font-size:clamp(10px,3.1cqi,14px); overflow-wrap:anywhere;
    }
    .details-breakdown th { color:var(--details-muted); font-weight:600; }
    .details-breakdown th:first-child { width:29%; padding-inline-start:7px; text-align:start; }
    .details-breakdown[data-breakdown="batteries"] th:first-child { width:40%; }
    .details-breakdown td { font-weight:700; }
    .details-history { margin:0 9px 9px; border:1px solid var(--details-metric-edge); border-radius:4px; background:var(--details-plot-face); }
    .details-history h3 { margin:6px 7px 2px; font-size:13px; font-size:clamp(12px,3.3cqi,16px); font-weight:700; }
    .history-message {
      display:grid; min-height:108px; padding:4px 9px; margin:0; place-items:center;
      text-align:center; color:var(--details-muted); font-size:12px;
    }
    .history-chart svg { display:block; width:100%; height:auto; }
    .history-chart text { fill:var(--details-muted); font-size:10px; font-weight:600; }
    .history-rule { fill:none; stroke:var(--details-rule); stroke-width:1; }
    .history-zero { stroke:var(--details-zero); }
    .history-trace { fill:none; stroke:var(--details-line); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
    :host([data-theme="technika"]) .details-screen {
      --details-ink:#172e26;
      --details-muted:#324e41;
      --details-rule:#63867441;
      --details-zero:#638674b0;
      --details-edge:#59826b;
      --details-metric-edge:#698f7580;
      --details-metric-face:#f6faf3a0;
      --details-plot-face:#f5f9f0a6;
      --details-line:#286549;
      --details-focus:#255d47;
      background:#ddebe0 var(--technika-background) center / 100% 100% no-repeat;
      border-radius:6px; font-family:var(--lcd-font);
    }
    :host([data-theme="technika"]) .details-header { background:linear-gradient(180deg,#e9f2e8,#c9dece); }

    :host([data-appearance="dark"]) {
      color-scheme:dark;
      --dark-surface:#191d20;
      --dark-screen:var(--dark-surface) url("${graphiteBackground}") center / 100% 100% no-repeat;
      --dark-frame:#15181b;
      --dark-frame-edge:#717b83;
      --dark-track:#566269;
      --dark-display-ink:#858585;
      --dark-value:#bfbfbf;
      --dark-unit:#b1bfc5;
      --dark-soc:#a6e4b7;
      --dark-status:#a6e4b7;
      --dark-status-edge:#77c592;
      --dark-header:linear-gradient(180deg,#2b3033,#23282b);
      --dark-divider:#69747a;
      --dark-tile:#252b2e;
      --dark-edge:#626e74;
      --dark-ink:#dbe0e2;
      --dark-control-ink:#dfe3e5;
      --dark-muted:#abb6bd;
      --dark-field:#181d20;
      --dark-field-edge:#788489;
      --dark-hover:#333d42;
      --dark-mark:#a6e4b7;
      --dark-apply:#314b3b;
      --dark-plot:#1d2427;
      --dark-rule:#38454a;
      --dark-zero:#63737a;
      --dark-trace:#c6ced1;
    }
    :host([data-theme="technika"][data-appearance="dark"]) {
      --dark-frame:var(--technika-frame);
      --dark-frame-edge:var(--technika-frame-edge);
      --dark-track:#303530;
      --dark-display-ink:#f4f7e7;
      --dark-value:#f4f7e7;
      --dark-unit:#c9cdb6;
      --dark-soc:#d6ef97;
      --dark-status:#faffea;
      --dark-status-edge:#819955;
      --flow:#b5c98a;
      --flow-edge:#4b633e;
      --flow-body:#d9eea1;
      --dark-header:linear-gradient(180deg,#44574b,#35463d);
      --dark-divider:#84968a;
      --dark-tile:linear-gradient(180deg,#34423a,#28342e);
      --dark-edge:#788b7e;
      --dark-ink:#e6eee5;
      --dark-control-ink:#e8f0e5;
      --dark-muted:#bdccbc;
      --dark-field:#243029;
      --dark-field-edge:#95a699;
      --dark-hover:#405449;
      --dark-mark:#c9e7ba;
      --dark-apply:#3f5f4c;
      --dark-plot:#232f29;
      --dark-rule:#405649;
      --dark-zero:#819287;
      --dark-trace:#b7d5a9;
    }
    :host([data-appearance="dark"]) ha-card {
      background:var(--dark-frame); border-color:var(--dark-frame-edge);
    }
    /* КЛАСіК · dark: black screen, white icons and digits, gauges coloured by power (green → red); night-blue menu header. */
    :host([data-theme="classic"][data-appearance="dark"]) {
      --dark-surface:#050608;
      --dark-screen:#050608;
      --dark-frame:#050608;
      --dark-frame-edge:#1d2227;
      --dark-track:#262c32;
      --dark-display-ink:#ffffff;
      --dark-value:#ffffff;
      --dark-unit:#8b949c;
      --dark-soc:#ffffff;
      --dark-status:#f2f4f6;
      --dark-status-edge:#f2f4f6;
      --dark-header:linear-gradient(180deg,#0f2234,#0b1928);
      --dark-divider:#2a6f99;
      --dark-tile:#0b1116;
      --dark-edge:#22465c;
      --dark-ink:#f4faff;
      --dark-control-ink:#ffffff;
      --dark-muted:#9fb4c0;
      --dark-field:#0b1116;
      --dark-field-edge:#2e5c75;
      --dark-hover:#0c1c29;
      --dark-mark:#6fd86c;
      --dark-apply:#1d3a24;
      --dark-plot:#0a0e12;
      --dark-rule:#1f2a31;
      --dark-zero:#3c4a53;
      --dark-trace:#f2f4f6;
    }
    :host([data-theme="classic"][data-appearance="dark"]) .screen { background:radial-gradient(ellipse at 50% 40%,#0a0c0f 0%,#050608 75%); }
    :host([data-theme="classic"][data-appearance="dark"]) .gauge .fill { stroke:url(#deye-classic-power); }
    :host([data-theme="classic"][data-appearance="dark"]) .symbol { color:#f2f4f6; }
    :host([data-theme="classic"][data-appearance="dark"]) .wire-track { stroke:#4a535b; }
    :host([data-theme="classic"][data-appearance="dark"]) .arrow { fill:#8b949c; }
    :host([data-theme="classic"][data-appearance="dark"]) .dot { fill:#f2f4f6; }
    :host([data-theme="classic"][data-appearance="dark"]) .status { stroke-width:2; }
    :host([data-theme="classic"][data-appearance="dark"]) .t-ring-line,
    :host([data-theme="classic"][data-appearance="dark"]) .t-ring-letter { stroke:#f2f4f6; }
    :host([data-theme="classic"][data-appearance="dark"][data-update]) .t-ring-inner { stroke:#e8a317; }
    :host([data-theme="classic"][data-appearance="dark"]) .details-screen { background:#050608; }
    :host([data-theme="classic"][data-appearance="dark"]) .details-metric dd { color:#ffffff; }

    :host([data-appearance="dark"]) .screen { background:var(--dark-screen); }
    :host([data-theme="technika"][data-appearance="dark"]) .screen {
      background:#1a1c1e url("${smokedDarkBackground}") center / 100% 100% no-repeat;
      box-shadow:inset 0 0 0 1px var(--technika-frame-edge);
    }
    :host([data-appearance="dark"]) .top { fill:var(--dark-display-ink); }
    :host([data-appearance="dark"]) .track { stroke:var(--dark-track); }
    :host([data-appearance="dark"]) .symbol { color:var(--dark-display-ink); }
    :host([data-appearance="dark"]) .screen [data-gear] { fill:var(--dark-display-ink); }
    :host([data-appearance="dark"]) .scale,
    :host([data-appearance="dark"]) .unit { fill:var(--dark-unit); }
    :host([data-appearance="dark"]) .value { fill:var(--dark-value); }
    :host([data-appearance="dark"]) .value[data-unavailable] { fill:var(--dark-muted); }
    :host([data-appearance="dark"]) .soc,
    :host([data-appearance="dark"]) .soc-side { fill:var(--dark-soc); }
    :host([data-appearance="dark"]) .status { fill:var(--dark-surface); stroke:var(--dark-status-edge); }
    :host([data-theme="technika"][data-appearance="dark"]) .status { fill:url(#deye-technika-status); }
    :host([data-appearance="dark"]) .status-text,
    :host([data-appearance="dark"]) .parallel { fill:var(--dark-status); }
    :host([data-appearance="dark"]) .screen[data-status="missing"] .status { fill:#283034; stroke:#7c8d91; }
    :host([data-appearance="dark"]) .screen[data-status="missing"] .status-text,
    :host([data-appearance="dark"]) .screen[data-status="missing"] .parallel { fill:#d0d9db; }
    :host([data-appearance="dark"]) .screen[data-status="fault"] .status { fill:#48292e; stroke:#de8789; }
    :host([data-appearance="dark"]) .screen[data-status="fault"] .status-text,
    :host([data-appearance="dark"]) .screen[data-status="fault"] .parallel { fill:#ffe5df; }
    :host([data-appearance="dark"]) .screen .classic-only [fill="#ffffff"],
    :host([data-appearance="dark"]) .screen .grid-outage [fill="#ffffff"] { fill:var(--dark-surface); }
    :host([data-appearance="dark"]) .screen .classic-only [stroke="#ffffff"] { stroke:var(--dark-surface); }
    :host([data-appearance="dark"]) .wire-track { stroke:#88a5ae; }
    :host([data-appearance="dark"]) .arrow { fill:var(--dark-display-ink); }
    :host([data-appearance="dark"]) .dot { fill:#85e381; }
    :host([data-appearance="dark"]) .grid-outage { color:#f0a5a3; }
    :host([data-appearance="dark"]) .screen [role="button"]:focus-visible .hit { stroke:var(--dark-mark); }

    :host([data-theme="technika"][data-appearance="dark"]) .gauge > circle.technika-only { stroke:#899875; }
    :host([data-theme="technika"][data-appearance="dark"]) .gauge > path.technika-only:not(.fill-gloss) { stroke:#121416; }
    :host([data-theme="technika"][data-appearance="dark"]) .status-ring { stroke:#dcf597; }
    :host([data-theme="technika"][data-appearance="dark"]) .grid-outage [fill="#ffffff"] { fill:#222426; }
    :host([data-theme="technika"][data-appearance="dark"]) .technika-gear-light { display:none; }
    :host([data-theme="technika"][data-appearance="dark"]) .technika-gear-dark { display:inline; }

    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-status stop:nth-child(1) { stop-color:#596c3c; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-status stop:nth-child(2) { stop-color:#42522d; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-status stop:nth-child(3) { stop-color:#2a3620; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-face stop:nth-child(1) { stop-color:#3e4c30; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-face stop:nth-child(2) { stop-color:#303b25; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-face stop:nth-child(3) { stop-color:#242c1c; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-icon-dark stop:nth-child(1) { stop-color:#bdc68e; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-icon-dark stop:nth-child(2) { stop-color:#929e68; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-icon-dark stop:nth-child(3) { stop-color:#657346; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-icon-light stop:nth-child(1) { stop-color:#eef3ce; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-icon-light stop:nth-child(2) { stop-color:#c3cd9a; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-icon-light stop:nth-child(3) { stop-color:#8e9e64; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-gear stop:nth-child(1) { stop-color:#c1cc96; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-gear stop:nth-child(2) { stop-color:#a6b47c; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-gear stop:nth-child(3) { stop-color:#84915d; }
    :host([data-theme="technika"][data-appearance="dark"]) #deye-technika-gear stop:nth-child(4) { stop-color:#647349; }
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [stroke="#3e4929" i] { stroke:#bdc894; }
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [stroke="#e6ebc9" i],
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [stroke="#f5f8df" i],
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [stroke="#f3f5dc" i] { stroke:#eaf2d1; }
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [stroke="#c3d9cc" i],
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [stroke="#d3e2cd" i] { stroke:#d5dfb4; }
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [stroke="#394927" i] { stroke:#2c4538; }
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [fill="#486f59" i] { fill:#738777; }
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [fill="#f1f3d4" i] { fill:#e9efcf; }
    :host([data-theme="technika"][data-appearance="dark"]) .symbol [fill="#394927" i],
    :host([data-theme="technika"][data-appearance="dark"]) .battery-bolt { fill:#2c4538; }

    :host([data-appearance="dark"]) .settings {
      --lcd-ink:var(--dark-ink);
      --lcd-line:var(--dark-edge);
      --lcd-field:var(--dark-field);
      --lcd-dark:var(--dark-control-ink);
      --lcd-button:var(--dark-tile);
      --lcd-hover:var(--dark-hover);
      --lcd-hint:var(--dark-muted);
      --lcd-focus:var(--dark-mark);
      --lcd-mark:var(--dark-mark);
      --lcd-background:var(--dark-screen); color-scheme:dark;
      --lcd-adjust-surface:var(--dark-tile);
      --lcd-adjust-edge:var(--dark-divider);
      --lcd-adjust-button:var(--dark-hover);
    }
    :host([data-appearance="dark"]) .settings-header,
    :host([data-appearance="dark"]) .details-header {
      background:var(--dark-header); border-bottom-color:var(--dark-divider);
    }
    :host([data-theme="technika"][data-appearance="dark"]) .settings-tile {
      box-shadow:inset 0 0 0 1px #ffffff0c;
    }
    :host([data-appearance="dark"]) .lcd-number-value,
    :host([data-appearance="dark"]) .lcd-check input { border-color:var(--dark-field-edge); }
    :host([data-appearance="dark"]) .lcd-number input::placeholder { color:var(--dark-muted); }
    :host([data-appearance="dark"]) .settings-button[data-settings-button="apply"]:enabled {
      color:var(--dark-mark); background:var(--dark-apply);
    }
    :host([data-appearance="dark"]) .settings-button[data-settings-button="apply"]:enabled:hover {
      background:var(--dark-hover);
    }
    :host([data-appearance="dark"]) .settings-hint[data-error] { color:#ffddd9; background:#4d3034; }

    :host([data-appearance="dark"]) .details-screen {
      --details-ink:var(--dark-ink);
      --details-muted:var(--dark-muted);
      --details-rule:var(--dark-rule);
      --details-zero:var(--dark-zero);
      --details-edge:var(--dark-divider);
      --details-metric-edge:var(--dark-edge);
      --details-metric-face:var(--dark-tile);
      --details-plot-face:var(--dark-plot);
      --details-line:var(--dark-trace);
      --details-focus:var(--dark-mark);
      --lcd-background:var(--dark-screen); color-scheme:dark;
    }
    :host([data-appearance="dark"]) .details-metric dd { color:var(--dark-control-ink); }

    @container (max-width:290px) {
      .details-screen[data-source="battery"] .details-readings { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }

    :host([data-theme="technika"]) .gauge .fill { filter:none; stroke-width:8.4; stroke-linecap:round; }
    /* «Т» button: a thin ring in КЛАСіК, a filled glowing ring in ТЕХНіКА. */
    .t-ring-line,.t-ring-letter { stroke:#101415; }
    :host([data-appearance="dark"]) .t-ring-line,:host([data-appearance="dark"]) .t-ring-letter { stroke:var(--dark-display-ink); }
    .t-fill { stroke:#7d8f4f; }
    .t-glow { stroke:#8ca935; opacity:.6; }
    .t-inner,.t-letter-light { stroke:#f5f9e6; }
    #deye-t-fill stop:nth-child(1) { stop-color:#77844f; }
    #deye-t-fill stop:nth-child(2) { stop-color:#485b32; }
    :host([data-palette="olive"][data-appearance="dark"]) .t-fill { stroke:#d6e4a8; }
    :host([data-palette="olive"][data-appearance="dark"]) .t-glow { stroke:#b5c98a; opacity:.9; }
    :host([data-palette="olive"][data-appearance="dark"]) #deye-t-fill stop:nth-child(1) { stop-color:#647443; }
    :host([data-palette="olive"][data-appearance="dark"]) #deye-t-fill stop:nth-child(2) { stop-color:#35462c; }
    :host([data-palette="graphite"]) .t-fill { stroke:#8c979b; }
    :host([data-palette="graphite"]) .t-glow { stroke:#7f9a8a; }
    :host([data-palette="graphite"]) .t-inner,:host([data-palette="graphite"]) .t-letter-light { stroke:#ffffff; }
    :host([data-palette="graphite"]) #deye-t-fill stop:nth-child(1) { stop-color:#747d80; }
    :host([data-palette="graphite"]) #deye-t-fill stop:nth-child(2) { stop-color:#434d50; }
    :host([data-palette="graphite"][data-appearance="dark"]) .t-fill { stroke:#d3dbdd; }
    :host([data-palette="graphite"][data-appearance="dark"]) .t-glow { stroke:#aebbbf; opacity:.9; }
    :host([data-palette="graphite"][data-appearance="dark"]) #deye-t-fill stop:nth-child(1) { stop-color:#5a6467; }
    :host([data-palette="graphite"][data-appearance="dark"]) #deye-t-fill stop:nth-child(2) { stop-color:#272f33; }
    /* A newer release: ТЕХНіКА gets a slowly breathing amber ring, КЛАСіК only a yellow inner ring with no motion. */
    /* ТЕХНіКА: power gauges in «sunny» colours with a soft volume; SOC colours 50 / 30 %. */
    .fill-gloss { pointer-events:none; }
    :host([data-theme="technika"]) .gauge .fill { stroke:url(#deye-technika-power-light); }
    :host([data-theme="technika"][data-appearance="dark"]) .gauge .fill { stroke:url(#deye-technika-power-dark); }
    :host([data-theme="technika"]) { --soc-ok:#3a9a22; --soc-mid:#b58900; --soc-low:#d0352a; }
    :host([data-theme="technika"][data-appearance="dark"]) { --soc-ok:#7fe05a; --soc-mid:#ffd84a; --soc-low:#ff6a55; }
    :host([data-theme="technika"]) .screen .gauge .soc[data-level="ok"],:host([data-theme="technika"]) .screen .gauge .soc-side[data-level="ok"] { fill:var(--soc-ok); }
    :host([data-theme="technika"]) .screen .gauge .soc[data-level="mid"],:host([data-theme="technika"]) .screen .gauge .soc-side[data-level="mid"] { fill:var(--soc-mid); }
    :host([data-theme="technika"]) .screen .gauge .soc[data-level="low"],:host([data-theme="technika"]) .screen .gauge .soc-side[data-level="low"] { fill:var(--soc-low); }
    /* ТЕХНіКА frame can be switched off (shared with the outage card): the card then has the screen colour and a thin edge. */
    :host([data-theme="technika"]) { --tk-surface:#e3e6e2; }
    :host([data-theme="technika"][data-appearance="dark"]) { --tk-surface:#1a1c1e; }
    :host([data-theme="technika"][data-palette="graphite"]) { --tk-surface:#e4e7e9; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) { --tk-surface:#1d2124; }
    :host([data-theme="technika"][data-frame="off"]) ha-card { background:var(--tk-surface) !important; border-color:var(--technika-frame-edge) !important; box-shadow:none !important; }
    /* Menu items with no entity: pale, dashed, a «?» badge; a tap explains where to link it. */
    .lcd-setting[data-unbound] { cursor:help; opacity:.62; }
    .lcd-setting[data-unbound] .lcd-number-value,.lcd-setting[data-unbound] input { border-style:dashed; }
    .lcd-setting[data-unbound] input,.lcd-setting[data-unbound] select,.lcd-setting[data-unbound] button { pointer-events:none; }
    .lcd-setting[data-unbound] select { color:transparent; }
    .lcd-setting[data-unbound]::after {
      content:"?"; position:absolute; top:-1.6cqi; right:-1.4cqi; width:3.6cqi; height:3.6cqi; border-radius:50%;
      display:grid; place-items:center; font:700 2.4cqi/1 var(--lcd-font); background:#8a949c; color:#fff; pointer-events:none;
    }
    .native-check[data-unbound]::after { top:50%; right:auto; left:calc(var(--h) * .25cqi - 1.6cqi); transform:translateY(-110%); }
    .settings .lcd-surface { position:relative; }
    .unbound-pop {
      position:absolute; left:5%; right:18%; top:16%; z-index:20; padding:10px 12px; border-radius:10px; max-height:70%; overflow:auto;
      font:400 clamp(11px,3cqi,13px)/1.35 var(--lcd-font); background:#ffffff; color:#1c2a33; border:1px solid #9fb2be; box-shadow:0 10px 30px #0008;
    }
    :host([data-appearance="dark"]) .unbound-pop { background:#13202c; color:#eef4f8; border-color:#5b7d94; }
    .unbound-pop b { display:block; font-size:1.05em; margin-bottom:4px; }
    .unbound-pop .unbound-actions { text-align:right; margin-top:8px; }
    .unbound-pop button { font:inherit; font-weight:600; padding:5px 14px; border-radius:8px; border:1px solid currentColor; background:transparent; color:inherit; cursor:pointer; }
    .t-update-ring { display:none; stroke:#f2a33a; transform-box:fill-box; transform-origin:center; }
    :host([data-update]) .t-update-ring { display:inline; animation:t-update-pulse 2.4s ease-in-out infinite; }
    :host([data-update]) .t-ring-inner { stroke:#e8a317; stroke-width:1.9; opacity:1; }
    @keyframes t-update-pulse { 0%,100% { opacity:.25; transform:scale(.94); } 50% { opacity:1; transform:scale(1.04); } }
    @media (prefers-reduced-motion:reduce) { :host([data-update]) .t-update-ring { animation:none; opacity:.85; } }
    .ap-update { display:flex; gap:10px; align-items:flex-start; margin:0 0 11px; padding:9px 10px; border-radius:10px;
      border:1px solid #f2a33a99; background:#f2a33a1a; }
    .ap-update b { display:block; font-weight:650; }
    .ap-update p { margin:2px 0 4px; font-size:12px; color:var(--ap-muted); line-height:1.35; }
    .ap-update a { color:inherit; font-size:12px; }
    .appearance-dialog .ap-update button { margin-left:auto; flex:none; min-height:0; padding:0 4px; border:0; background:transparent;
      color:var(--ap-muted); font-size:18px; line-height:1; cursor:pointer; text-decoration:none; }
    .ap-version { font-size:11px; color:var(--ap-muted); }
    .appearance-trigger[aria-expanded="true"] .hit { stroke:currentColor; stroke-width:.8; stroke-dasharray:2 2; opacity:.5; }
    ha-card { position:relative; }
    ha-card[data-pop-open] { overflow:visible; z-index:2; }
    .appearance-dialog {
      --ap-bg:#f3f5f1; --ap-ink:#25302c; --ap-muted:#4f5e56; --ap-field:#e4e9e1;
      --ap-edge:#a6b2a8; --ap-active:#435f4c; --ap-on:#fff;
      position:absolute; z-index:5; box-sizing:border-box; width:min(310px,calc(100% - 16px));
      padding:12px; border:1px solid var(--ap-edge); border-radius:14px; background:var(--ap-bg); color:var(--ap-ink);
      color-scheme:light; font:400 14px/1.35 var(--lcd-font); box-shadow:0 12px 32px #0000004d; text-align:start;
    }
    .appearance-dialog * { box-sizing:border-box; }
    .ap-grid { display:grid; grid-template-columns:auto minmax(0,1fr); align-items:center; gap:8px 10px; }
    .ap-label { font-size:13px; font-weight:600; color:var(--ap-muted); white-space:nowrap; }
    .ap-seg { display:flex; gap:3px; padding:3px; border-radius:10px; background:var(--ap-field); }
    .ap-seg button {
      flex:1; display:flex; align-items:center; justify-content:center; gap:5px; min-width:0; min-height:38px; padding:4px 6px;
      border:0; border-radius:8px; background:transparent; color:var(--ap-ink); font:inherit; font-size:13px; cursor:pointer;
    }
    .ap-seg button[aria-pressed="true"] { background:var(--ap-active); color:var(--ap-on); font-weight:650; }
    .ap-seg svg { width:18px; height:18px; flex:none; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
    .ap-swatches { display:flex; align-items:center; gap:10px; }
    .ap-swatches button {
      width:38px; height:38px; padding:0; border-radius:50%; border:3px solid var(--ap-bg); cursor:pointer;
      box-shadow:0 0 0 1px var(--ap-edge);
    }
    .ap-swatches button[aria-pressed="true"] { box-shadow:0 0 0 2px var(--ap-active); }
    .ap-swatches [data-visual-value="olive"] { background:#566b39; }
    .ap-swatches [data-visual-value="graphite"] { background:#42494d; }
    .look3d-only { display:none; }
    :host([data-look="3d"]) .look3d-only { display:inline; }
    :host([data-look="3d"]) .gauge > .technika-only, :host([data-look="3d"]) .gauge > .track, :host([data-look="3d"]) .gauge > .fill,
    :host([data-look="3d"]) .gauge .symbol, :host([data-look="3d"]) .gen-icon,
    :host([data-look="3d"]) .screen .status, :host([data-look="3d"]) .screen .status-ring { display:none; }
    /* 0.8.36 · two 3D views: «Сцена» (one picture of the homestead) and «Окремо» (a picture in every gauge). */
    :host([data-look="3d"][data-scene="scene"]) .sep3d, :host([data-look="3d"]:not([data-scene="scene"])) .scene3d { display:none; }
    .hud-track { fill:none; stroke:rgba(10,20,15,.4); stroke-width:4.6; stroke-linecap:round; }
    .hud-glow { fill:none; stroke-width:9.6; stroke-linecap:round; opacity:.9; }
    .hud-edge { fill:none; stroke:rgba(27,33,32,.5); stroke-width:6.4; stroke-linecap:round; }
    .hud-fill { fill:none; stroke-width:4.6; stroke-linecap:round; }
    :host([data-look="3d"][data-appearance="light"]:not([data-scene="scene"])) .hud-track { stroke:rgba(40,50,45,.22); }
    .hud-ring-bg { fill:rgba(10,20,15,.45); }
    .hud-ring, .hud-ring-glow { fill:none; stroke:#7dff9c; }
    .hud-ring { stroke-width:1.6; } .hud-ring-glow { stroke-width:3.5; opacity:.75; }
    .screen[data-status="fault"] :is(.hud-ring, .hud-ring-glow) { stroke:#ff5a4c; }
    .screen[data-status="missing"] :is(.hud-ring, .hud-ring-glow) { stroke:#9aa7a0; }
    /* 0.8.37 · .screen raises the weight above the olive palette rules, so both palettes get the same 3D sizes. */
    :host([data-look="3d"]) .screen .gauge .value { font-size:19px; }
    :host([data-look="3d"]) .screen .gauge .unit { font-size:8.5px; transform:translateY(1.5px); }
    :host([data-look="3d"]) .screen .gauge .scale { font-size:12px; }
    .under3d { pointer-events:none; }
    :host(:not([data-scene="scene"])) .under3d { display:none; }
    /* 0.8.37 · Battery time «⏱ 2г 45хв»: inside the dial above the charge, in 3D above the power figures. */
    .bat-time { transform:translate(var(--bt-shift, -17px), -29.5px); pointer-events:none; }
    :host([data-theme="technika"]) .bat-time { transform:translate(var(--bt-shift, -17px), 26.5px); }
    .bat-time[hidden] { display:none; }
    .bat-time text { font-size:9px; font-weight:700; fill:currentColor; }
    .bat-clock { fill:none; stroke:currentColor; stroke-width:1.1; stroke-linecap:round; transform:translateY(0); }
    .bat-time[data-dir="charge"] { color:#229d56; }
    .bat-time[data-dir="discharge"] { color:#d9822b; }
    :host([data-appearance="dark"]) .bat-time[data-dir="discharge"], :host([data-theme="technika"]) .bat-time[data-dir="discharge"] { color:#ffb056; }
    :host([data-appearance="dark"]) .bat-time[data-dir="charge"], :host([data-theme="technika"]) .bat-time[data-dir="charge"] { color:#57e389; }
    :host([data-look="3d"]) .bat-time { transform:translate(var(--bt-shift, -17px), 24px); }
    :host([data-look="3d"]) .bat-time[data-dir="discharge"] { color:#ffc078; }
    :host([data-look="3d"]) .bat-time[data-dir="charge"] { color:#8dffad; }
    :host([data-look="3d"][data-scene="scene"]) .bat-time text { paint-order:stroke; stroke:rgba(0,0,0,.38); stroke-width:2px; stroke-linejoin:round; }
    /* 0.8.37 · No grid in 3D: a glowing red cross on the dotted grid line instead of the «Off grid» label. */
    :host([data-look="3d"]) .grid-outage .outage-legacy { display:none; }
    .outage-x path { fill:none; stroke-linecap:round; }
    .outage-x .ox-core { stroke:#ff3b30; stroke-width:2.6; }
    .outage-x .ox-glow { stroke:#ff2a1f; stroke-width:4.5; opacity:.8; }
    .outage-x .ox-pulse path { stroke:#ff4b3e; stroke-width:2.6; }
    .outage-x .ox-pulse { transform-box:fill-box; transform-origin:center; animation:ox-pulse 1.4s ease-out infinite; }
    .outage-x .ox-core { animation:ox-glow 1.4s ease-in-out infinite; }
    @keyframes ox-pulse { 0% { transform:scale(1); opacity:.75; } 100% { transform:scale(2.3); opacity:0; } }
    @keyframes ox-glow { 0%, 100% { stroke:#ff3b30; } 50% { stroke:#ffb0a8; } }
    :host([data-motion="off"]) .outage-x .ox-pulse { display:none; }
    :host([data-motion="off"]) .outage-x .ox-core { animation:none; }
    /* 0.8.37 · Beacon on the repair truck: only while there is no grid. */
    .beacon3d { display:none; pointer-events:none; }
    :host([data-grid-off]) .beacon3d { display:inline; }
    .bc-halo { fill:#ffae2b; opacity:.45; filter:url(#deye-3d-soft); }
    .bc-core { fill:#ffd36b; }
    .beacon3d { animation:bc-blink 1s steps(1) infinite; }
    @keyframes bc-blink { 0%, 55% { opacity:1; } 56%, 100% { opacity:.15; } }
    :host([data-motion="off"]) .beacon3d { animation:none; }
    /* The charge sits outside the arc, top-left of the battery gauge, so it never meets the power number. */
    :host([data-look="3d"]) .gauge .soc { transform:translate(-46px, -26px); font-size:11px; }
    :host([data-look="3d"]) .parallel { fill:#eafff0; }
    /* On the scene the texts are light with a soft shadow, whatever the light / dark look of the card. */
    :host([data-look="3d"][data-scene="scene"]) .screen :is(.gauge .value, .gauge .unit, .gauge .scale, .gauge .soc, .gauge .soc-side, .generator-status, .generator-amount, .generator .unit) {
      fill:#fff !important; paint-order:stroke; stroke:rgba(0,0,0,.38); stroke-width:2px; stroke-linejoin:round; }
    :host([data-look="3d"][data-scene="scene"]) .screen .gauge .soc { fill:#9dffb8 !important; }
    :host([data-look="3d"][data-scene="scene"]) .screen[data-battery-flow="discharge"] [data-gauge="battery_power"] .value { fill:#ffc078 !important; }
    :host([data-look="3d"][data-scene="scene"]) .screen[data-battery-flow="charge"] [data-gauge="battery_power"] .value { fill:#8dffad !important; }
    :host([data-look="3d"][data-scene="scene"]) .screen[data-grid-flow="export"] [data-gauge="grid_power"] .value { fill:#8fd4ff !important; }
    :host([data-look="3d"][data-scene="scene"][data-night]) .top { fill:#e6eef8; }
    .pole-wire .wire-track { stroke:none !important; fill:none; }
    :host([data-look="3d"]) .status-text { fill:#7dff9c; }
    :host([data-look="3d"]) .screen[data-status="fault"] .status-text { fill:#ff6a5c; }
    .anim3d { pointer-events:none; }
    .gauge:not([data-active]) .anim3d, :host([data-motion="off"]) :is(.anim3d, .scene3d-anim) { display:none; }
    .a3-sun { fill:#fff3b0; opacity:.5; animation:a3-pulse 3s ease-in-out infinite; }
    :host([data-night]) .a3-day { display:none; }
    .a3-glint { fill:#fff; opacity:.4; animation:a3-glint 4.5s ease-in-out infinite; }
    .a3-flow { fill:none; stroke:#ffe66b; stroke-width:1.3; stroke-linecap:round; stroke-dasharray:2.5 7; filter:drop-shadow(0 0 1.2px #ffd23a); animation:a3-flow 1s linear infinite; }
    .screen[data-grid-flow="export"] .a3-flow { animation-direction:reverse; }
    .a3-led { fill:#8dffad; animation:a3-led 1.6s ease-in-out infinite; }
    .a3-smoke { fill:#d9dde0; opacity:0; transform-box:fill-box; transform-origin:center; animation:a3-smoke 3s ease-out infinite; }
    .a3-smoke.a3-dark { fill:#7d8389; }
    :host([data-motion="on"]) .gen3d { animation:a3-vib .14s steps(2) infinite; }
    @media (prefers-reduced-motion: reduce) { .anim3d, .scene3d-anim { display:none; } .gen3d { animation:none !important; } }
    @keyframes a3-pulse { 50% { opacity:.85; } }
    @keyframes a3-glint { 0% { transform:translateX(0); } 60%, 100% { transform:translateX(110px); } }
    @keyframes a3-flow { to { stroke-dashoffset:-9.5; } }
    @keyframes a3-led { 0%, 100% { opacity:.25; } 50% { opacity:1; } }
    @keyframes a3-smoke { 0% { transform:translate(0,0) scale(.45); opacity:0; } 15% { opacity:.7; } 100% { transform:translate(2.5px,-13px) scale(2.2); opacity:0; } }
    @keyframes a3-vib { 50% { transform:translate(.35px,-.3px); } }
    .ap-note { grid-column:1 / -1; margin:0; padding:7px 9px; border-radius:8px; background:var(--ap-field); color:var(--ap-muted); font-size:12px; line-height:1.4; }
    .ap-workshop { display:flex; align-items:center; gap:8px; width:100%; min-height:38px; margin:10px 0 2px; padding:5px 10px; border-radius:10px; cursor:pointer;
      font:inherit; font-size:13px; font-weight:650; letter-spacing:.6px; color:var(--ap-ink); background:var(--ap-field);
      border:1.5px solid #9be36b; box-shadow:0 0 5px rgba(155,227,107,.35); }
    .ap-workshop > span:last-child { flex:1; text-align:center; margin-right:22px; }
    .ap-workshop-t { display:inline-grid; place-items:center; width:22px; height:22px; border-radius:50%; font-size:12px; letter-spacing:0; font-weight:800;
      color:#2b2a10; background:radial-gradient(circle at 40% 35%,#f4e27a,#c9a92a); box-shadow:0 0 0 1.5px #e9d76a; }
    .ws-head { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .ws-head h3 { margin:0; font-size:16px; }
    .ws-back { width:34px; height:34px; border-radius:9px; border:0; background:var(--ap-field); color:var(--ap-ink); font-size:22px; line-height:1; cursor:pointer; }
    .ws-intro, .ws-empty { margin:4px 2px 10px; font-size:12.5px; color:var(--ap-muted); line-height:1.4; }
    .ws-list { display:grid; gap:6px; }
    .ws-sponsor, .ws-option { display:flex; align-items:center; gap:10px; width:100%; padding:10px 12px; border:0; border-radius:10px; background:var(--ap-field); color:var(--ap-ink); font:inherit; text-align:left; cursor:pointer; }
    .ws-sponsor b, .ws-option b { display:block; font-size:14px; }
    .ws-sponsor small, .ws-option small { display:block; font-size:11.5px; color:var(--ap-muted); }
    .ws-sponsor b { flex:1; } .ws-sponsor > span { font-size:20px; color:var(--ap-muted); }
    .ws-option > span { flex:1; }
    .ws-option i { flex:none; width:38px; height:22px; border-radius:11px; background:var(--ap-edge); position:relative; transition:background .2s; }
    .ws-option i::after { content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .2s; }
    .ws-option[aria-checked="true"] i { background:var(--ap-active); }
    .ws-option[aria-checked="true"] i::after { transform:translateX(16px); }
    .ap-footer { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:10px; padding-top:8px; border-top:1px solid var(--ap-edge); }
    .ap-footer p { margin:0; font-size:12px; color:var(--ap-muted); }
    .ap-footer button {
      min-height:36px; padding:6px 8px; border:0; background:transparent; color:var(--ap-ink); font:inherit; font-size:13px;
      text-decoration:underline; text-underline-offset:3px; cursor:pointer;
    }
    .ap-look { display:grid; grid-template-columns:2fr 1fr 1fr; position:relative; }
    .ap-look button[data-visual-value="auto"] { flex-direction:column; gap:3px; }
    .ap-auto { display:flex; align-items:center; gap:5px; line-height:1; }
    .ap-dots { display:flex; gap:4px; }
    .ap-dots i { width:5px; height:5px; border-radius:50%; background:currentColor; opacity:.3; }
    .ap-dots i[data-current] { opacity:1; }
    .ap-look button[data-visual-value="auto"][aria-pressed="false"] .ap-dots { display:none; }
    .ap-hint {
      position:absolute; left:3px; top:calc(100% + 5px); width:calc(50% - 4px); z-index:2; padding:4px 6px; border-radius:8px;
      border:1px solid var(--ap-active); background:var(--ap-bg); color:var(--ap-ink); font-size:12px; text-align:center; white-space:nowrap;
      opacity:0; transform:translateY(-3px); transition:opacity .35s, transform .35s; pointer-events:none;
    }
    .ap-hint[data-show] { opacity:1; transform:none; }
    .ap-flags { display:flex; gap:4px; }
    .ap-footer .ap-flag {
      display:grid; place-items:center; width:30px; height:24px; min-height:0; padding:0; border:1.5px solid transparent; border-radius:6px;
      background:transparent; opacity:.55; text-decoration:none;
    }
    .ap-footer .ap-flag[aria-pressed="true"] { border-color:var(--ap-active); opacity:1; }
    .ap-flag svg { display:block; width:20px; height:14px; border-radius:2px; }
    .appearance-dialog button:focus-visible { outline:2px solid var(--ap-active); outline-offset:2px; }
    :host([data-theme="technika"]) .appearance-dialog { --ap-bg:#e7ebdf; --ap-field:#dce3d0; --ap-active:#566b39; }
    :host([data-appearance="dark"]) .appearance-dialog { color-scheme:dark; --ap-bg:#24292b; --ap-ink:#e4e9e7; --ap-muted:#b4c0ba; --ap-field:#333c38; --ap-edge:#64746b; --ap-active:#a8c18f; --ap-on:#182114; }
    :host([data-theme="technika"][data-palette="olive"][data-appearance="dark"]) .appearance-dialog { --ap-bg:#282d25; --ap-field:#383f2e; --ap-edge:#707d5b; --ap-active:#b6c98a; }
    :host([data-theme="technika"][data-palette="graphite"]) .screen { background:#e5e7e6; box-shadow:inset 0 0 0 1px var(--technika-frame-edge); }
    :host([data-theme="technika"][data-palette="graphite"]) #deye-technika-face stop:nth-child(1) { stop-color:#f3f5f3; }
    :host([data-theme="technika"][data-palette="graphite"]) #deye-technika-face stop:nth-child(2) { stop-color:#e1e6e2; }
    :host([data-theme="technika"][data-palette="graphite"]) #deye-technika-face stop:nth-child(3) { stop-color:#b7c2b9; }
    :host([data-theme="technika"][data-palette="graphite"]) .track { stroke:#a6b0a8; }
    :host([data-theme="technika"][data-palette="graphite"]) .settings,
    :host([data-theme="technika"][data-palette="graphite"]) .details-screen { background:#e1e6e3; }
    :host([data-theme="technika"][data-palette="graphite"]) .appearance-dialog { --ap-bg:#e9edeb; --ap-field:#dce3de; --ap-active:#486554; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen { background:#232729; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) { --dark-header:linear-gradient(180deg,#3c4643,#303a37); --dark-tile:#303a35; --dark-field:#252d29; --dark-plot:#242d28; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-face stop:nth-child(1) { stop-color:#434e46; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-face stop:nth-child(2) { stop-color:#343e38; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-face stop:nth-child(3) { stop-color:#29312d; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .track { stroke:#303732; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .settings,
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .details-screen { background:#252d29; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .appearance-dialog { --ap-bg:#252b29; --ap-field:#343d37; --ap-active:#afc598; }
    /* ── Meaning colours (0.8.13): charge / discharge, export, battery level ───────────────── */
    :host([data-theme="technika"]) {
      --lcd-font:var(--ha-font-family-body, Roboto, "Noto Sans", "Segoe UI", Arial, sans-serif);
      --sem-charge:#2f6e1f; --sem-discharge:#9a4f15; --sem-export:#22617f; --sem-low:#b3261e; --sem-mid:#9a4f15;
      --flow-charge:#4f8a35; --flow-charge-edge:#3e6e29; --flow-charge-body:#c9e8a8;
      --flow-discharge:#b46d2c; --flow-discharge-edge:#8a521f; --flow-discharge-body:#f4cf9f;
      --flow-export:#2f7394; --flow-export-edge:#245a75; --flow-export-body:#c3e4f3;
    }
    :host([data-theme="technika"][data-appearance="dark"]) {
      --sem-charge:#bfe895; --sem-discharge:#f5bb72; --sem-export:#95d3ea; --sem-low:#ff9d8f; --sem-mid:#f5bb72;
      --flow-charge:#b9e58f; --flow-charge-edge:#4b7a33; --flow-charge-body:#e2f6cd;
      --flow-discharge:#f2b46a; --flow-discharge-edge:#8a521f; --flow-discharge-body:#fbe2bf;
      --flow-export:#8fd0e8; --flow-export-edge:#2d6a80; --flow-export-body:#dbf2fb;
    }

    /* ── ТЕХНіКА · Графіт: a full steel palette, not olive on grey ─────────────────────────── */
    :host([data-theme="technika"][data-palette="graphite"]) {
      --technika-frame:#26292c; --technika-frame-edge:#4d5359;
      --flow:#56697a; --flow-edge:#46586a; --flow-body:#b8c8d5;
    }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen { background:#e4e7e9; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .top,
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .value { fill:#20262b; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .scale,
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .unit { fill:#4a535a; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .soc,
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .soc-side { fill:#2c4a5e; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .track { stroke:#a7afb5; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .status { stroke:#46525c; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .status-ring { stroke:#dbe3e8; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .generator { color:#4a5560; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-face stop:nth-child(1) { stop-color:#f5f6f7; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-face stop:nth-child(2) { stop-color:#e3e7ea; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-face stop:nth-child(3) { stop-color:#b8c0c6; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-icon-dark stop:nth-child(1) { stop-color:#7e8890; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-icon-dark stop:nth-child(2) { stop-color:#555f67; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-icon-dark stop:nth-child(3) { stop-color:#333b42; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-icon-light stop:nth-child(1) { stop-color:#f7f8f9; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-icon-light stop:nth-child(2) { stop-color:#d9dee2; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-icon-light stop:nth-child(3) { stop-color:#aab3ba; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-gear stop:nth-child(1) { stop-color:#9aa3aa; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-gear stop:nth-child(2) { stop-color:#737d85; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-gear stop:nth-child(3) { stop-color:#535c64; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-gear stop:nth-child(4) { stop-color:#3b434a; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-status stop:nth-child(1) { stop-color:#6e7a84; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-status stop:nth-child(2) { stop-color:#4b555e; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-status stop:nth-child(3) { stop-color:#323a41; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-power stop:nth-child(1) { stop-color:#5d7486; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-power stop:nth-child(2) { stop-color:#7f97a8; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-power stop:nth-child(3) { stop-color:#c49a45; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) #deye-technika-power stop:nth-child(4) { stop-color:#c8703a; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#3e4929" i] { stroke:#343c43; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#394927" i] { stroke:#2f363c; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [fill="#394927" i],
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [fill="#1c3a2f" i] { fill:#2f363c; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#1c3a2f" i] { stroke:#2f363c; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [fill="#486f59" i] { fill:#5b6770; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [fill="#f1f3d4" i] { fill:#f4f6f8; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#e6ebc9" i],
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#f5f8df" i],
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#f3f5dc" i] { stroke:#f2f4f6; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#c3d9cc" i],
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#d3e2cd" i],
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#d2e6d3" i] { stroke:#cfd8de; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#223d33" i] { stroke:#2a3238; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .screen [stroke="#d5dfb4" i] { stroke:#dfe5e9; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .settings {
      --lcd-ink:#222a30; --lcd-line:#6e7c86; --lcd-field:#f4f6f7; --lcd-dark:#2e3b45; --lcd-button:#ffffff70;
      --lcd-hover:#cfd8de; --lcd-hint:#3d4850; --lcd-focus:#5b4a1a;
      --lcd-adjust-surface:#e3e8eb; --lcd-adjust-edge:#7b8992; --lcd-adjust-button:#eef2f4;
    }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .settings-header { background:linear-gradient(180deg,#c3cdd4,#e2e7ea); }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .settings-button[data-settings-button="apply"]:enabled { background:#3b4f5e; }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .details-screen {
      --details-ink:#1d252b; --details-muted:#3a4650; --details-rule:#6b7c8841; --details-zero:#6b7c88b0;
      --details-edge:#6b7c88; --details-metric-edge:#76869280; --details-metric-face:#f6f8f9a0;
      --details-plot-face:#f4f6f8a6; --details-line:#2f5a78; --details-focus:#2f5a78;
    }
    :host([data-theme="technika"][data-palette="graphite"]:not([data-appearance="dark"])) .details-header { background:linear-gradient(180deg,#eef1f3,#cfd7dd); }

    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) {
      --dark-track:#353c41; --dark-display-ink:#eef2f4; --dark-value:#f2f5f7; --dark-unit:#c4ccd1; --dark-soc:#bcd9ee;
      --dark-status:#f4f8fa; --dark-status-edge:#8797a3;
      --flow:#a9bccb; --flow-edge:#4b5b68; --flow-body:#d6e3ec;
      --dark-header:linear-gradient(180deg,#3c4449,#30373c); --dark-divider:#7d8a93; --dark-tile:#2f363b; --dark-edge:#75828b;
      --dark-ink:#e6eaed; --dark-control-ink:#eef1f3; --dark-muted:#b9c2c8; --dark-field:#23292d; --dark-field-edge:#8f9aa2;
      --dark-hover:#3d464c; --dark-mark:#cfe0ec; --dark-apply:#3d4f5c; --dark-plot:#262c30; --dark-rule:#3f484e;
      --dark-zero:#7f8a91; --dark-trace:#c7d6e0;
    }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen { background:#1d2124; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .settings,
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .details-screen { background:#23292d; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .generator { color:#cfd8de; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .gauge > circle.technika-only { stroke:#88949c; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .status-ring { stroke:#dfe8ee; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-face stop:nth-child(1) { stop-color:#424a50; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-face stop:nth-child(2) { stop-color:#343b40; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-face stop:nth-child(3) { stop-color:#282e32; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-icon-dark stop:nth-child(1) { stop-color:#c3cbd1; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-icon-dark stop:nth-child(2) { stop-color:#98a2aa; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-icon-dark stop:nth-child(3) { stop-color:#6c767e; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-icon-light stop:nth-child(1) { stop-color:#e8ecef; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-icon-light stop:nth-child(2) { stop-color:#bcc4ca; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-icon-light stop:nth-child(3) { stop-color:#8d969d; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-gear stop:nth-child(1) { stop-color:#c4ccd2; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-gear stop:nth-child(2) { stop-color:#a7b1b8; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-gear stop:nth-child(3) { stop-color:#858f97; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-gear stop:nth-child(4) { stop-color:#66707a; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-status stop:nth-child(1) { stop-color:#56626c; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-status stop:nth-child(2) { stop-color:#3b454d; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-status stop:nth-child(3) { stop-color:#262d33; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-power stop:nth-child(1) { stop-color:#7f9bb0; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-power stop:nth-child(2) { stop-color:#a3b6c4; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-power stop:nth-child(3) { stop-color:#d6ae5a; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) #deye-technika-power stop:nth-child(4) { stop-color:#d98450; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#3e4929" i] { stroke:#c3ccd2; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#e6ebc9" i],
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#f5f8df" i],
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#f3f5dc" i],
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#eaf2d1" i] { stroke:#eef2f4; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#c3d9cc" i],
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#d3e2cd" i] { stroke:#d4dbe0; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#394927" i] { stroke:#2a3238; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [fill="#486f59" i] { fill:#7b8791; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [fill="#f1f3d4" i] { fill:#e9edf0; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [fill="#394927" i],
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [fill="#2c4538" i],
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .battery-bolt { fill:#2a3238; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#748451" i] { stroke:#8d9aa3; }
    :host([data-theme="technika"][data-palette="graphite"][data-appearance="dark"]) .screen [stroke="#bdc894" i] { stroke:#c3ccd2; }

    /* ── Олива · «Контрастна» (0.8.13): deeper olive icons, darker and bolder numbers, clearer scale ── */
    :host([data-theme="technika"][data-palette="olive"]:not([data-appearance="dark"])) .value,
    :host([data-theme="technika"][data-palette="olive"]:not([data-appearance="dark"])) .top { fill:#141a0e; }
    :host([data-theme="technika"][data-palette="olive"]) .value { font-weight:800; font-size:15.7px; }
    :host([data-theme="technika"][data-palette="olive"]:not([data-appearance="dark"])) .scale,
    :host([data-theme="technika"][data-palette="olive"]:not([data-appearance="dark"])) .unit { fill:#333a23; }
    :host([data-theme="technika"][data-palette="olive"]:not([data-appearance="dark"])) .track { stroke:#9aa27f; }
    :host([data-theme="technika"][data-palette="olive"]:not([data-appearance="dark"])) .status { stroke:#2f3d1f; stroke-width:2.2; }
    :host([data-theme="technika"][data-palette="olive"]:not([data-appearance="dark"])) #deye-technika-icon-dark stop:nth-child(1) { stop-color:#5d6b3a; }
    :host([data-theme="technika"][data-palette="olive"]:not([data-appearance="dark"])) #deye-technika-icon-dark stop:nth-child(2) { stop-color:#3f4c26; }
    :host([data-theme="technika"][data-palette="olive"]:not([data-appearance="dark"])) #deye-technika-icon-dark stop:nth-child(3) { stop-color:#26301a; }
    :host([data-theme="technika"][data-palette="olive"][data-appearance="dark"]) .value,
    :host([data-theme="technika"][data-palette="olive"][data-appearance="dark"]) .top { fill:#ffffff; }
    :host([data-theme="technika"][data-palette="olive"][data-appearance="dark"]) .scale,
    :host([data-theme="technika"][data-palette="olive"][data-appearance="dark"]) .unit { fill:#e1e6cf; }
    :host([data-theme="technika"][data-palette="olive"][data-appearance="dark"]) .track { stroke:#262a24; }
    :host([data-theme="technika"][data-palette="olive"][data-appearance="dark"]) #deye-technika-icon-dark stop:nth-child(1) { stop-color:#d3dca5; }
    :host([data-theme="technika"][data-palette="olive"][data-appearance="dark"]) #deye-technika-icon-dark stop:nth-child(2) { stop-color:#aab679; }
    :host([data-theme="technika"][data-palette="olive"][data-appearance="dark"]) #deye-technika-icon-dark stop:nth-child(3) { stop-color:#7c8a51; }

    /* Meaning colours: ТЕХНіКА only (КЛАСіК repeats the original Deye screen). They come last so every palette shows them. */
    :host([data-theme="technika"]) .screen[data-battery-flow="charge"] [data-gauge="battery_power"] .value { fill:var(--sem-charge); }
    :host([data-theme="technika"]) .screen[data-battery-flow="discharge"] [data-gauge="battery_power"] .value { fill:var(--sem-discharge); }
    :host([data-theme="technika"]) .screen[data-grid-flow="export"] [data-gauge="grid_power"] .value { fill:var(--sem-export); }
    :host([data-theme="technika"]) .screen .gauge .soc[data-level="low"],:host([data-theme="technika"]) .screen .gauge .soc-side[data-level="low"] { fill:var(--soc-low); }
    :host([data-theme="technika"]) .screen .gauge .soc[data-level="mid"],:host([data-theme="technika"]) .screen .gauge .soc-side[data-level="mid"] { fill:var(--soc-mid); }
    :host([data-theme="technika"]) .screen[data-battery-flow="charge"] .wire[data-wire="battery"] { --flow:var(--flow-charge); --flow-edge:var(--flow-charge-edge); --flow-body:var(--flow-charge-body); }
    :host([data-theme="technika"]) .screen[data-battery-flow="discharge"] .wire[data-wire="battery"] { --flow:var(--flow-discharge); --flow-edge:var(--flow-discharge-edge); --flow-body:var(--flow-discharge-body); }
    :host([data-theme="technika"]) .screen[data-grid-flow="export"] .wire[data-wire="grid"] { --flow:var(--flow-export); --flow-edge:var(--flow-export-edge); --flow-body:var(--flow-export-body); }
    /* 0.8.31 · particle colour follows how many particles run on the line: 1 — no glow, 2 green, 3 yellow, 4 red (same rule on all four lines). */
    :host([data-theme="technika"]) .flow-layer .flow-core { stroke:var(--flow-edge); stroke-width:.6; }
    :host([data-theme="technika"]) .flow-layer[data-level="1"] :is(.particle-halo, .flow-glow-halo, .flow-tail-glow, .flow-spark) { display:none; }
    :host([data-theme="technika"]) .flow-layer[data-level="2"] { --flow:#2fbf6a; --flow-edge:#2fbf6a; }
    :host([data-theme="technika"]) .flow-layer[data-level="3"] { --flow:#f2b632; --flow-edge:#f2b632; }
    :host([data-theme="technika"]) .flow-layer[data-level="4"] { --flow:#e5392b; --flow-edge:#e5392b; }

    /* ── Smooth change between themes and looks ─────────────────────────────────────────────── */
    @media (prefers-reduced-motion:no-preference) {
      :host([data-theme="technika"]) ha-card,:host([data-theme="technika"]) .screen,:host([data-theme="technika"]) .settings,
      :host([data-theme="technika"]) .lcd-surface,:host([data-theme="technika"]) .details-screen,:host([data-theme="technika"]) .appearance-dialog {
        transition:background-color .35s ease,border-color .35s ease,color .35s ease;
      }
      :host([data-theme="technika"]) .screen text,:host([data-theme="technika"]) .screen path,:host([data-theme="technika"]) .screen circle,
      :host([data-theme="technika"]) .screen rect,:host([data-theme="technika"]) .screen stop {
        transition:fill .35s ease,stroke .35s ease,stop-color .35s ease;
      }
    }

    /* ── 0.8.29 · gauge windows (same layout as the editor) ── */
    ${gridStyles}
    .details-screen[data-page="chart"] .history-chart svg { min-height:220px; }
    :host([data-editor-preview]) [data-generator] .hit { pointer-events:none; }
    .details-screen .details-history-toggle { display:inline-flex; align-items:center; justify-content:center; width:auto; min-width:0; height:auto; padding:3px 11px; flex:none; }
    .details-screen .details-history-toggle[aria-pressed="true"] { background:var(--details-ink); color:#0d2340; }
    :host([data-appearance="dark"]) .details-screen .details-history-toggle[aria-pressed="true"],
    :host([data-theme="classic"][data-appearance="dark"]) .details-screen .details-history-toggle[aria-pressed="true"] { color:#050608; }
    :host([data-theme="technika"]:not([data-appearance="dark"])) .details-screen .details-history-toggle[aria-pressed="true"] { color:#f6faf3; }
    /* Editor preview: the main screen without T, clock, weekday and gear; the editor draws its own rings on top. */
    :host([data-editor-preview]) :is([data-open-appearance],[data-clock-tap],[data-weekday],[data-gear]) { visibility:hidden; }
    :host([data-editor-preview]) .screen { pointer-events:none; }
  `;

  const inverterCount = (config) => {
    const count = Number(config?.inverter_count);
    return count === 2 || count === 3 ? count : 1;
  };
  const inverterField = (index, name) => index === 0 ? name : `inverter_${index + 1}_${name === "inverter_model" ? "model" : name}`;
  const installedInverters = (config) => Array.from({ length: inverterCount(config) }, (_, index) => index);
  const batterySeparate = (config) => config?.battery_topology === "separate";
  const readModel = (value, parallel) =>
    models.includes(Number(value)) && (!parallel || Number(value) !== 160) ? Number(value) : defaultModel;
  const preferEnglish = (config) => config?.language === "en";
  const local = (text, config) => preferEnglish(config) ? text.en : text.uk;
  const modelText = (model, config) => preferEnglish(config) ? modelLabel(model).replaceAll("кВт", "kW") : modelLabel(model);
  const selectable = (name, options, defaultValue) => ({
    name, default: defaultValue, selector: { select: { mode: "dropdown", options } },
  });
  const dropdownOptions = (choices, config) => choices.map(([value, uk, en]) => ({
    value, label: local(pair(en, uk), config),
  }));

  function configForm(config = {}) {
    const t = (en, uk) => local(pair(en, uk), config);
    const labels = {};
    const helpers = {};
    const field = (schema, description, helper) => {
      labels[schema.name] = description;
      if (helper) helpers[schema.name] = helper;
      return schema;
    };
    const entity = (name, description, domain = "sensor", helper) =>
      field({ name, selector: { entity: { domain } } }, description, helper);
    const text = (name, description, helper) => field({ name, selector: { text: {} } }, description, helper);
    const bool = (name, description) => field({ name, selector: { boolean: {} } }, description);
    const group = (name, title, schema) => ({ name, title, type: "expandable", flatten: true, schema });
    const choose = (name, description, choices, defaultValue, helper) =>
      field(selectable(name, dropdownOptions(choices, config), defaultValue), description, helper);
    const parallel = inverterCount(config) > 1;
    const model = (index) => field(selectable(inverterField(index, "inverter_model"),
      models.filter(value => !parallel || value !== 160).map(value => ({ value: String(value), label: modelText(value, config) })),
      String(defaultModel)), parallel
      ? index === 0 ? t("Inverter 1 · Master model", "Інвертор 1 · модель Master") : t(`Inverter ${index + 1} · model`, `Інвертор ${index + 1} · модель`)
      : t("Inverter model", "Модель інвертора"),
      parallel ? t("The scale is the sum of the inverter ratings.", "Шкала дорівнює сумі номінальних потужностей.") :
        t("For the legacy 80 + 80 kW setup, use combined sensors.", "Для старої схеми 80 + 80 кВт обирай сумарні сенсори."));
    const readings = (prefix, source, fields) => fields.map(({ key, label: uk }) =>
      entity(inverterField(prefix, `${source}_${key}`), t(metricEnglish[key], uk)));
    const phases = (index, source) => !threePhaseValues.includes(config.inverter_phases) ? [] :
      phaseColumns.map(({ prefix, label }) => group(
        `screen_${index}_${source}_${prefix}`, t(`Phase ${label}`, `Фаза ${label}`),
        readings(index, `${source}_${prefix}`, acMeasurements)));
    const legacyBatteries = (index = 0) => [
      ...(!parallel ? [entity("battery_soc_2", t("Battery 2 · charge", "Батарея 2 · заряд"))] : []),
      ...batteryColumns.map(({ prefix, label }) => group(`screen_${index}_${prefix}`,
        t(`BAT${prefix.at(-1)} · individual readings`, `BAT${prefix.at(-1)} · окремі покази`), readings(index, prefix, measurementFields))),
    ];
    const inverterSources = (index) => gaugeLayout.filter(gauge =>
      gauge.source !== "battery" || index === 0 || batterySeparate(config) || ["inverters","channels"].includes(config.battery_power_mode)).map(gauge => {
      const { source, invert } = gauge;
      const settings = readings(index, source, source === "battery" ? measurementFields : acMeasurements);
      if (source === "pv") settings.push(group(`screen_${index}_pv_inputs`, t("PV1–PV6", "PV1–PV6"),
        pvInputs.map(n => entity(inverterField(index, `pv_${n}_power`), t(`PV${n} · power`, `PV${n} · потужність`), "sensor",
          n === 1 ? t("Only when there is no total solar power sensor: the card adds the inputs together.",
            "Лише якщо немає загальної потужності сонця: картка складе входи разом.") : undefined))));
      if (source === "pv") settings.push(entity(inverterField(index, "pv_energy_today"), t("Produced today", "Вироблено сьогодні")),
        entity(inverterField(index, "pv_energy_total"), t("Produced in total", "Вироблено всього")));
      if (source === "load") settings.push(entity(inverterField(index, "load_energy_today"), t("Consumed today", "Спожито сьогодні")));
      if (source === "battery") {
        settings.push(entity(inverterField(index, "battery_soc"), t("Battery charge · SOC", "Заряд АКБ · SOC")));
        if (parallel && batterySeparate(config)) {
          settings.push(field({
            name: inverterField(index, "battery_soc_capacity_kwh"),
            selector: { number: { min: 0.01, max: 100000, step: 0.01, mode: "box", unit_of_measurement: "kWh" } },
          }, t("Battery capacity, kWh", "Ємність АКБ, кВт·год"),
          t("Capacity weights the combined SOC.", "Ємність використовується для розрахунку спільного SOC.")));
        }
        // BAT1/BAT2 editor fields are temporarily hidden; existing bindings remain intact.
      }
      if (source === "grid") settings.push(entity(inverterField(index, "grid_energy_today"), t("Imported from the grid today", "Спожито з мережі за добу")),
        entity(inverterField(index, "grid_connected"), t("Grid connection", "Стан мережі"), "binary_sensor"));
      if (invert) settings.push(bool(inverterField(index, invert), source === "grid"
        ? t("Negative grid reading means import", "Від’ємний показ мережі означає імпорт")
        : t("Positive battery reading means charging", "Додатний показ АКБ означає заряд")));
      if (acSources.includes(source)) settings.push(...phases(index, source));
      return group(`screen_${index}_${source}`, local(pair(gauge.english, gauge.label), config), settings);
    });
    const binding = (key) => {
      const [, domain, uk, en] = settingFields.find(([name]) => name === key);
      const hint = {
        basic_datetime: t("Use the inverter Date & Time entity. It supplies unbound Year, Month, Day, Hour and Minute fields. Changes are sent together.", "Обери Date & Time інвертора. Сутність заповнює неприв’язані поля року, місяця, дня, годин і хвилин. Зміни надсилаються разом."),
        device_info: t("A Solarman Device sensor with serial and firmware attributes. Individual bindings take priority.", "Сенсор Device від Solarman з атрибутами серійного номера й прошивки. Окремі прив’язки мають пріоритет."),
        time_of_use: t("A shared day selector can also serve the weekday page.", "Селектор із днями також працює на сторінці днів тижня."),
        basic_factory_reset: t("Locked for safety: the card never sends a factory reset, even with an entity bound here.", "Заблоковано з міркувань безпеки: картка ніколи не надсилає скидання, навіть якщо тут вказано сутність."),
        battery_shutdown: t("Entity in % (SOC). For the voltage mode, also fill the «voltage, V» field below.", "Сутність у % (SOC). Для режиму «За напругою» заповни також поле «напруга, В» нижче."),
        battery_low: t("Entity in % (SOC). For the voltage mode, also fill the «voltage, V» field below.", "Сутність у % (SOC). Для режиму «За напругою» заповни також поле «напруга, В» нижче."),
        battery_restart: t("Entity in % (SOC). For the voltage mode, also fill the «voltage, V» field below.", "Сутність у % (SOC). Для режиму «За напругою» заповни також поле «напруга, В» нижче."),
        generator_force: t("Some integrations do not execute Gen Force on the inverter.", "Деякі інтеграції не виконують Gen Force на інверторі."),
        battery_mode: t("For separate controls, use Battery chemistry and Battery operation mode instead.", "Якщо є окремі селектори, заповни тип і режим АКБ."),
        charging_signal: t("Use this for a shared Normal / Grid / Generator / Both selector.", "Для спільного селектора Normal / Grid / Generator / Both."),
      }[key];
      return entity(key, t(en, uk), domain, hint);
    };
    const menuGroups = settingsMenus.flatMap(({ id, title, pages }) => {
      const groups = pages.flatMap(({ caption, controls, extra }, index) => {
        const names = new Set([...controls.filter(control => control.name && !control.alias).map(control => control.name), ...extra]);
        const available = [...names].filter(name => !lockedSettings.has(name) && (bindingDomains[name] || readingBindings.has(name)));
        if (!available.length) return [];
        return [group(`menu_${id}_${index}`, local(caption, config), available.map(name => {
          if (bindingDomains[name]) return binding(name);
          const metadata = controls.find(control => control.name === name);
          const description = metadata.label ?? pair("Alarm log", "Журнал тривог");
          return entity(name, local(description, config), "sensor", name === "device_alarms"
            ? t("Use a sensor with an alarms attribute containing code, message and occurred.", "Сенсор з атрибутом alarms, де записи мають code, message та occurred.")
            : undefined);
        }))];
      });
      const caption = local(title, config) + (readOnlyMenus.has(id) ? t(" · view only", " · лише перегляд") : "");
      return groups.length ? [group(`menu_${id}`, caption, groups)] : [];
    });
    const schema = [
      choose("language", t("Language", "Мова"), [["uk", "Українська", "Ukrainian"], ["en", "Англійська", "English"]], "uk"),
      choose("battery_power_mode", t("Battery power source", "Джерело потужності АКБ"), [
        ["legacy", "Як раніше (за схемою АКБ)", "As before (battery topology)"],
        ["total", "Один сумарний датчик", "One total sensor"],
        ["inverters", "Сума датчиків усіх інверторів", "Sum of inverter sensors"],
      ], "legacy", t("Choose only measured, distinct sensors. Do not add a total to its component channels.",
        "Обирайте окремі виміряні датчики. Не додавайте сумарний показ до його складових каналів.")),
      bool("battery_power_x2", t("Multiply battery power ×2", "Множити потужність АКБ ×2")),
      field({ name:"battery_runtime_capacity_kwh", selector:{ number:{ min:0.1, max:5000, step:0.1, mode:"box", unit_of_measurement:"kWh" } } },
        t("Battery runtime · usable capacity, kWh", "Час роботи від АКБ · ємність, кВт·год"),
        t("Used to estimate runtime in the battery details. Leave empty to take it from a capacity sensor or from Ah × battery voltage.",
          "Для розрахунку часу роботи у вікні АКБ. Якщо порожньо — береться з сенсора ємності або як А·год × напруга АКБ.")),
      field({ name:"battery_runtime_cutoff", selector:{ number:{ min:0, max:90, step:1, mode:"box", unit_of_measurement:"%" } } },
        t("Battery runtime · count down to, %", "Час роботи від АКБ · рахувати до, %"),
        t("Charge level at which the battery is treated as empty. Leave empty to use the inverter Shutdown setting, or 20 %.",
          "Заряд, на якому АКБ вважається розрядженою. Якщо порожньо — береться «Поріг вимкнення» інвертора, інакше 20 %.")),
      entity("battery_capacity_sensor", t("Battery runtime · capacity sensor (kWh)", "Час роботи від АКБ · сенсор ємності (кВт·год)"), "sensor",
        t("For example the Solarman «Battery Capacity» sensor in kWh. Check that it shows the full capacity, not the remaining energy.",
          "Наприклад, сенсор Solarman «Battery Capacity» у кВт·год. Перевірте, що він показує повну ємність, а не залишок.")),
      choose("generator_power_mode", t("Generator power source", "Джерело потужності генератора"), [
        ["total", "Один сумарний датчик", "One total sensor"],
        ["inverters", "Сума датчиків усіх інверторів", "Sum of inverter sensors"],
      ], "total"),
      choose("inverter_phases", t("Phases", "Кількість фаз"), [["1", "1 фаза", "1 phase"], ["3", "3 фази", "3 phases"]], "1"),
      choose("inverter_count", t("Inverters in parallel", "Інвертори в паралелі"),
        [["1", "1 інвертор", "1 inverter"], ["2", "2 інвертори", "2 inverters"], ["3", "3 інвертори", "3 inverters"]], "1"),
      ...installedInverters(config).map(model),
      ...(parallel ? [choose("battery_topology", t("Battery topology", "Схема АКБ"), [
        ["shared", "Одна спільна АКБ", "Shared battery bank"], ["separate", "Окремі АКБ", "Separate batteries"],
      ], "shared")] : []),
      entity("generator_signal_state", t("GEN Signal · live state", "GEN Signal · стан для значка"),
        ["binary_sensor", "switch", "sensor"],
        t("Select the live generator request or dry-contact state. On shows the icon.", "Обери фактичний сигнал пуску або стан сухого контакту. On показує значок.")),
      ...(config.generator_signal_state ? [text("generator_signal_active_value", t("GEN Signal · active value", "GEN Signal · активне значення"),
        t("Default: on. For a sensor that uses another state, enter the state here.", "Типове значення on. Для сенсора з іншим станом введи його значення."))] : []),
      group("main_screen", t("Main screen", "Головний екран"), [
        ...installedInverters(config).map(index => {
          const fields = [
            ...inverterSources(index),
            group(`screen_${index}_generator`, t("Generator", "Генератор"), [...readings(index, "generator", acMeasurements),
              entity(inverterField(index, "generator_energy_today"), t("Generator today", "Генератор сьогодні")), ...phases(index, "generator")]),
            ...(index === 0 ? [
              entity("inverter_status", t("Inverter status", "Статус інвертора")),
              text("parallel_id", t("Parallel label", "Позначка паралельної роботи")),
            ] : []),
          ];
          return group(`source_inverter_${index + 1}`, parallel && index === 0
            ? t("Inverter 1 · Master", "Інвертор 1 · Master")
            : t(`Inverter ${index + 1}`, `Інвертор ${index + 1}`), fields);
        }),

      ]),
      group("inverter_menus", parallel ? t("Inverter menus · Master", "Меню інвертора · Master") : t("Inverter menus", "Меню інвертора"), menuGroups),
    ];
    return { schema, computeLabel: ({ name }) => labels[name], computeHelper: ({ name }) => helpers[name] };
  }

  const editorTag = "deye-lcd-tehnika-editor";
  const editorWarningKey = "deye-lcd-8k:skip-inverter-menu-warning";
  const autoMatchWarningKey = "deye-lcd-8k:skip-auto-match-warning";
  const editorSelectorKey = (config) => [
    config.language, config.lcd_appearance, config.inverter_phases, config.inverter_count,
    config.battery_topology, config.battery_power_mode, config.generator_power_mode, Boolean(config.generator_signal_state),
  ].join("|");

  const editorLeaves = (field) => field.schema ? field.schema.flatMap(editorLeaves) : [field];
  const hasEditorBinding = (value) => typeof value === "string" && Boolean(value.trim());
  const editorDevices = (hass) => hass?.devices ?? {};
  const editorEntities = (hass) => hass?.entities ?? {};
  const editorDeviceName = (device) => device?.name_by_user || device?.name || device?.model || device?.id || "";

  function editorReadings(inverter) {
    return inverter?.schema.filter(field => field.schema) ?? [];
  }

  function editorSections(schema, tab, index, t) {
    if (tab === "general") return [{ name:"general", schema:schema.filter(field => !field.schema) }];
    const root = schema.find(field => field.name === (tab === "screen" ? "main_screen" : "inverter_menus"));
    if (tab === "menus") return root.schema;
    const inverter = root.schema[index];
    const status = inverter.schema.filter(field => !field.schema);
    return [
      ...editorReadings(inverter),
      ...(status.length ? [{ name:"screen_status", title:t("Inverter status", "Статус інвертора"), schema:status }] : []),

    ];
  }

  const matchSourceNames = {
    grid: ["grid", "мережа"],
    load: ["load", "ups load", "backup load", "навантаження"],
    pv: ["pv", "solar", "сонячна генерація"],
    generator: ["generator", "gen", "генератор"],
    battery: ["battery", "bat", "batt", "акб", "батарея"],
  };
  const matchMetrics = {
    power: { names:["power","active power","потужність"], classes:["power"], units:["w","kw","вт","квт"] },
    voltage: { names:["voltage","напруга"], classes:["voltage"], units:["v","в"] },
    current: { names:["current","струм"], classes:["current"], units:["a","а"] },
    temperature: { names:["temperature","temp","температура"], classes:["temperature"], units:["°c","°f","°с"] },
    soc: { names:["soc","state of charge","charge","заряд"], classes:["battery"], units:["%"] },
  };
  const matchName = (name) => String(name ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

  function matchSpec(field, config = {}) {
    const key = field.name.replace(/^inverter_[23]_/, "");
    if (key === "inverter_status") {
      return { domain:"sensor", kind:"status", names:new Set(["device state","inverter status","inverter state","running status","work state","стан інвертора","статус інвертора"]) };
    }
    if (key === "grid_connected") {
      return { domain:"binary_sensor", names:new Set(["grid","grid connected","grid connection","grid status","стан мережі","мережа"]) };
    }
    const parts = /^(grid|load|pv|battery|generator)(?:_(l[123]|[1-6]))?_(power|current|voltage|temperature|soc)(?:_([12]))?$/.exec(key);
    if (!parts) return null;
    const [, source, qualifier, metric, trailingBank] = parts;
    const qualifierKey = qualifier || trailingBank;
    const metricInfo = matchMetrics[metric];
    const names = new Set();
    for (const sourceName of matchSourceNames[source]) {
      for (const measurement of metricInfo.names) {
        if (!qualifierKey) {
          for (const name of [
            `${sourceName} ${measurement}`, `${sourceName} total ${measurement}`,
            `total ${sourceName} ${measurement}`, `${sourceName} ${measurement} total`,
            `${measurement} ${sourceName}`,
          ]) names.add(name);
        } else {
          const phase = qualifierKey.startsWith("l");
          const qualifiers = phase ? [qualifierKey, `phase ${qualifierKey}`, `ф${qualifierKey.at(-1)}`, `фаза ${qualifierKey.at(-1)}`] : [qualifierKey];
          for (const unit of qualifiers) {
            names.add(`${sourceName} ${unit} ${measurement}`);
            names.add(`${sourceName} ${measurement} ${unit}`);
            names.add(`${unit} ${sourceName} ${measurement}`);
            if (!phase) names.add(`${sourceName}${unit} ${measurement}`);
          }
        }
      }
    }
    if (source === "battery" && metric === "soc" && !qualifierKey) {
      for (const name of matchSourceNames.battery) names.add(name);
    }
    const fallback = !qualifierKey && acSources.includes(source) && !threePhaseValues.includes(config.inverter_phases)
      ? matchSpec({ name:`${source}_l1_${metric}` }, { ...config, inverter_phases:"3" }).names : new Set();
    // Never filled automatically: offered in the list only, for the user to pick.
    const suggest = new Set();
    if (source === "grid" && metric === "current" && qualifierKey?.startsWith("l")) {
      const phase = qualifierKey.at(-1);
      for (const name of [`internal ct${phase} current`, `internal ct ${phase} current`, `ct${phase} current`]) suggest.add(name);
    }
    if (source === "grid" && metric === "current" && !qualifierKey && !threePhaseValues.includes(config.inverter_phases)) {
      for (const name of ["internal ct1 current", "internal ct current"]) suggest.add(name);
    }
    return { domain:"sensor", names, fallback, suggest, metric:metricInfo };
  }

  function editorMatchPlan(inverter, config, hass, deviceId, statusTitle = "Inverter status") {
    const device = editorDevices(hass)[deviceId];
    if (!device) return [];
    const prefixes = new Set([device.name_by_user, device.name].map(matchName).filter(Boolean));
    const states = hass.states ?? {};
    const registry = Object.entries(editorEntities(hass)).filter(([,entry]) => entry.device_id === deviceId);
    const prefixHits = new Map();
    for (const [registryId, entry] of registry) {
      const id = entry.entity_id ?? registryId;
      for (const value of [entry.name, entry.original_name, states[id]?.attributes?.friendly_name, id.split(".")[1]]) {
        const name = matchName(value), match = /^(.*?) (battery power|grid power|load power|pv power|generator power)$/.exec(name);
        if (!match) continue;
        if (!prefixHits.has(match[1])) prefixHits.set(match[1], new Set());
        prefixHits.get(match[1]).add(match[2]);
      }
    }
    for (const [prefix, metrics] of prefixHits) if (metrics.size >= 2) prefixes.add(prefix);
    const candidates = registry.flatMap(([registryId, entry]) => {
      if (entry.device_id !== deviceId || entry.disabled_by || entry.hidden_by || entry.hidden) return [];
      const id = entry.entity_id ?? registryId;
      if (!id?.includes(".")) return [];
      const state = states[id];
      if (!state || ["unknown","unavailable"].includes(state.state)) return [];
      const names = [matchName(entry.original_name), ...[entry.name, state.attributes?.friendly_name, id.split(".")[1]]
        .map(matchName).flatMap(name => {
          const matching = [...prefixes].filter(prefix => name.startsWith(prefix+" "));
          return matching.length ? matching.map(prefix => name.slice(prefix.length+1)) : [name];
        })].filter(Boolean);
      return [{ id, names, state, name:state.attributes?.friendly_name || entry.name || entry.original_name || id }];
    });
    const bound = new Set(Object.values(config).filter(hasEditorBinding));
    const useCount = new Map();
    const statusFields = inverter?.schema.filter(field => !field.schema && field.name === "inverter_status") ?? [];
    const groups = [...editorReadings(inverter), ...(statusFields.length ? [{ title:statusTitle, schema:statusFields }] : [])];
    const plan = groups.flatMap(group => group.schema.flatMap(field =>
      editorLeaves(field).flatMap(leaf => {
        const spec = matchSpec(leaf, config);
        if (!spec || hasEditorBinding(config[leaf.name])) return [];
        const compatible = candidate => {
          if (!candidate.id.startsWith(spec.domain+".")) return false;
          const attributes = candidate.state.attributes ?? {};
          if (spec.kind === "status") return numericState(candidate.state.state) === null;
          if (!spec.metric) return ["on","off"].includes(candidate.state.state)
            && (!attributes.device_class || ["connectivity","power"].includes(attributes.device_class));
          return numericState(candidate.state.state) !== null
            && spec.metric.units.includes(String(attributes.unit_of_measurement ?? "").trim().toLowerCase())
            && (!attributes.device_class || spec.metric.classes.includes(attributes.device_class));
        };
        const named = set => candidates.filter(candidate => compatible(candidate) && candidate.names.some(name => set?.has(name)));
        const exact = named(spec.names);
        const matches = exact.length ? exact : named(spec.fallback);
        const suggestions = matches.length ? [] : named(spec.suggest);
        for (const candidate of matches) useCount.set(candidate.id, (useCount.get(candidate.id) ?? 0) + 1);
        return [{ leaf, group, subgroup:field.schema ? field : null, matches, suggestions }];
      }),
    ));
    // PV1…PV6 are offered only when there is no total solar power for this inverter.
    const pvKey = groups.flatMap(group => group.schema.flatMap(editorLeaves)).map(leaf => leaf.name).find(name => /^(inverter_\d_)?pv_power$/.test(name));
    const pvTotalFound = hasEditorBinding(config[pvKey]) || plan.some(row => row.leaf.name === pvKey && row.matches.length);
    if (pvTotalFound) plan.splice(0, plan.length, ...plan.filter(row => !/^(inverter_\d_)?pv_[1-6]_power$/.test(row.leaf.name)));
    // Three tiers: one sure match is proposed; several, or a suggestion, are offered for the user to choose; none stays manual.
    return plan.map(row => {
      const [candidate] = row.matches;
      const reason = !candidate ? (row.suggestions.length ? "suggest" : "missing")
        : row.matches.length > 1 || useCount.get(candidate.id) > 1 ? "ambiguous"
        : bound.has(candidate.id) ? "used" : null;
      const options = reason === "suggest" ? row.suggestions : reason ? row.matches : [];
      return { ...row, candidate:reason ? null : candidate, reason, options };
    });
  }

  function applyEditorMatches(config, plan, confirmed) {
    const next = { ...config };
    const assigned = new Set();
    let count = 0;
    for (const row of plan) {
      const id = confirmed.get(row.leaf.name);
      if (!id || hasEditorBinding(next[row.leaf.name]) || assigned.has(id)) continue;
      const allowed = row.candidate ? [row.candidate.id] : row.options.map(option => option.id);
      if (!allowed.includes(id)) continue;
      next[row.leaf.name] = id;
      assigned.add(id);
      count++;
    }
    return { next, count };
  }

  const editorStyles = `
    :host{display:block;color:var(--primary-text-color,#ecf4f7);container-type:inline-size;min-width:0}
    *,*::before,*::after{box-sizing:border-box}
    button,select{font:inherit;color:inherit}
    button{background:var(--secondary-background-color,#222e37);border:1px solid var(--divider-color,#43535e);
      border-radius:8px;padding:7px 11px;min-height:40px;cursor:pointer;text-align:center;white-space:normal}
    button:hover:enabled{border-color:var(--primary-color,#74bfc8)}
    button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--primary-color,#74bfc8);outline-offset:2px}
    button[aria-pressed="true"]{background:color-mix(in srgb,var(--primary-color,#74bfc8) 16%,var(--card-background-color,#18212a));
      border-color:var(--primary-color,#74bfc8);font-weight:600}
    button:disabled{opacity:.55;cursor:default}
    button[data-match],button.amber{background:#f0c77c;color:#2c2112;border-color:#f0c77c;font-weight:650}
    button.amber:hover:enabled,button[data-match]:hover:enabled{background:#ffdb98;border-color:#ffdb98}
    h2,h3,p{margin:0}
    h2{font-size:1.2em;line-height:1.35;font-weight:650;overflow-wrap:anywhere}
    h3{font-size:1em;margin:0 0 6px}
    .tabs,.devices,.pages,.actions{display:flex;flex-wrap:wrap;gap:7px}
    .tabs{padding-bottom:12px;border-bottom:1px solid var(--divider-color,#43535e);margin-bottom:12px}
    .toolbar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px}
    .workspace{display:grid;grid-template-columns:minmax(130px,26%) minmax(0,1fr);gap:10px;align-items:start}
    .side,.pane{border:1px solid var(--divider-color,#43535e);border-radius:10px;background:var(--card-background-color,#18212a);min-width:0}
    .side{display:grid;gap:4px;padding:6px}
    .side button{display:flex;justify-content:space-between;align-items:center;text-align:left;gap:5px;padding:6px 8px;font-size:.92em;overflow-wrap:anywhere}
    .count{color:var(--secondary-text-color,#a7bac9);font-size:.8em;flex:none;font-variant-numeric:tabular-nums}
    .pane{padding:12px;display:grid;gap:12px}
    .pages{align-items:center}
    .pages button{font-size:.9em}
    .pages .count,.devices small{display:block;margin-top:2px;color:var(--secondary-text-color,#a7bac9)}
    ha-form{display:block;width:100%;min-width:0}
    .notice,p.note{color:var(--secondary-text-color,#a7bac9);line-height:1.5;font-size:.92em}
    .notice{margin-top:8px}
    .notice:empty{display:none}
    dialog{max-height:calc(100% - 24px);width:min(570px,calc(100% - 22px));padding:18px;
      border:1px solid var(--divider-color,#43535e);border-radius:13px;background:var(--card-background-color,#18212a);
      color:var(--primary-text-color,#ecf4f7);overflow:auto;overscroll-behavior:contain;font:inherit}
    dialog::backdrop{background:#0a0d12bd}
    dialog p{margin-top:8px;line-height:1.48}
    dialog[data-tone="rose"]{background:#302327;color:#f1dce0;border-color:#98626b;width:min(520px,calc(100% - 22px))}
    dialog[data-tone="rose"] h2{color:#ffd8db}
    dialog[data-tone="rose"] button{background:#3d2a31;color:#f1dce0;border-color:#98626b}
    dialog[data-tone="rose"] button[data-continue]{background:#f4abaf;color:#2d171c;border-color:#f4abaf}
    dialog[data-tone="amber"]{background:#30291f;color:#f1e4cf;border-color:#a78955;width:min(440px,calc(100% - 22px))}
    dialog[data-tone="amber"] h2{color:#ffe0a4}
    dialog[data-tone="amber"] button:not(.amber){background:#382f24;color:#f1e4cf;border-color:#a78955}
    dialog .actions{justify-content:flex-end;margin-top:13px}
    .opt-out,.proposal{display:flex;align-items:start;gap:8px}
    .opt-out{margin-top:12px}
    input[type=checkbox]{flex:none;width:16px;height:16px;accent-color:#b28538}
    .device-picker{display:grid;gap:4px;margin-top:10px}
    select{min-width:0;width:100%;background:var(--secondary-background-color,#222e37);
      border:1px solid var(--divider-color,#43535e);border-radius:8px;padding:8px}
    .match-list{display:grid;gap:7px;max-height:min(46vh,370px);overflow:auto;margin-top:10px;padding:2px 3px}
    .match-list h3{margin:.5em 0 0}
    .proposal,.manual-row{border:1px solid var(--divider-color,#43535e);border-radius:8px;padding:8px;overflow-wrap:anywhere}
    .proposal span,.manual-row span{display:grid;gap:3px;min-width:0}
    .proposal small,.manual-row small{color:var(--secondary-text-color,#a7bac9)}
    .hex{font-size:.84em;font-family:monospace}
    .choice-row select{margin-top:4px}
    .match-warning{padding:8px 10px;border-radius:8px;background:#5a3d1c;color:#ffe6c4}
    .actions button{max-width:100%;overflow-wrap:anywhere}
    .view-toggle{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
    .list-all,.v-all{display:flex;align-items:center;gap:8px;margin:8px 0;font-size:13px;cursor:pointer;user-select:none}
    .list-all input,.v-all input{width:18px;height:18px;margin:0;accent-color:var(--primary-color,#03a9f4)}
    .view-toggle span{color:var(--secondary-text-color,#a7bac9);font-size:.88em;margin-right:4px}
    .view-toggle button{min-height:34px;padding:4px 12px;font-size:.9em}
    .visual-slot{display:grid;gap:10px;min-width:0}
    .v-screen{position:relative;border-radius:9px;overflow:hidden;outline:3px solid #f2b632;outline-offset:2px;margin:3px;
      background:linear-gradient(180deg,#302183 13%,#2d46a2 53%,#157d98 100%);color:#f4faff;container-type:inline-size;font-family:Roboto,Arial,sans-serif;aspect-ratio:400/268}
    .v-head{display:flex;align-items:center;gap:8px;position:absolute;left:0;right:0;top:0;z-index:2;padding:0 3cqw;height:12.69%;
      background:repeating-linear-gradient(135deg,#f2b632 0 14px,#e0a21e 14px 28px);color:#2a1e05}
    .v-head b{font-size:4.4cqw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .v-head span{font-size:3.2cqw;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .v-head em{margin-left:auto;font-style:normal;font-weight:700;font-size:2.6cqw;padding:.6cqw 1.6cqw;border-radius:4px;background:#2a1e05;color:#f2b632;white-space:nowrap}
    .v-screen[data-readonly="true"] .v-head{background:repeating-linear-gradient(135deg,#9aa6b2 0 14px,#87939f 14px 28px)}
    .v-screen[data-readonly="true"] .v-head em{color:#d7dee5}
    .v-body{position:absolute;inset:0}
    .v-label,.v-line,.v-ctl{position:absolute}
    .v-label{display:flex;align-items:center;line-height:1.05;color:#f4faff;overflow:hidden;pointer-events:none;font-weight:500}
    .v-line{background:#aeedfc66;height:1px!important}
    .v-ctl{display:flex;align-items:center;justify-content:center;gap:1cqw;min-height:0;padding:0 .9cqw;border-radius:3px;
      font-size:2.65cqw;line-height:1;overflow:hidden;white-space:nowrap;color:#12284e;background:#def4ed;border:1px solid #aeedfc}
    .v-ctl b{font-weight:600;overflow:hidden;text-overflow:ellipsis}
    .v-ctl.v-checkbox,.v-ctl.v-radio{justify-content:flex-start;background:#08469744;color:#f4faff;border-color:#aeedfc88}
    .v-ctl.v-compact{justify-content:center}
    .v-box{flex:none;display:grid;place-items:center;width:3.9cqw;height:3.9cqw;font-style:normal;font-weight:800;font-size:2.65cqw;
      border:1px solid #aeedfc;background:#def4ed;color:#12284e;border-radius:2px}
    .v-box.round{border-radius:50%}
    .v-ctl.v-bound{box-shadow:inset 3px 0 0 #2fbf6a}
    .v-ctl.v-shared{border:1.5px solid #8fd3ff;background:#cfe7ff;box-shadow:inset 3px 0 0 #4aa3ff}
    .v-ctl.v-checkbox.v-shared,.v-ctl.v-radio.v-shared{background:#4aa3ff33}
    .v-ctl.v-empty{border:2px dashed #f2b632;background:#f2b6321f;color:#f2b632;font-size:4cqw}
    .v-ctl.v-checkbox.v-empty,.v-ctl.v-radio.v-empty{font-size:3cqw;color:#ffe2a0}
    .v-ctl.v-empty .v-box{background:transparent;border:1.5px dashed #f2b632;color:#f2b632}
    .v-ctl.v-alias,.v-ctl.v-derived{border:1px solid #aeedfc66;color:#cfe7f5;background:repeating-linear-gradient(135deg,#ffffff10 0 4px,transparent 4px 8px);font-size:2.6cqw}
    .v-ctl.v-locked{border:1px solid #8b949c;background:#55606a;color:#c9d0d6;filter:grayscale(1)}
    .v-ctl:disabled{opacity:1}
    .v-ctl.selected{outline:3px solid #ffdf84;outline-offset:1px;z-index:1}
    .v-ctl:hover:enabled{filter:brightness(1.12);border-color:#ffdf84}
    .v-ctl.v-alarms{align-items:flex-start;padding-top:2cqw}
    .v-tiles{position:absolute;left:3cqw;right:3cqw;top:calc(12.69% + 4cqw);bottom:3cqw;display:grid;gap:2.4cqw;
      grid-template-columns:minmax(0,.9fr) repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));
      grid-template-areas:"battery work smart" "battery grid gen" "basic advanced device"}
    .v-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.8cqw;min-height:0;padding:0 1cqw;border-radius:4px;
      border:2px solid #aeedfc;background:#08469766;color:#f4faff;font-size:3.3cqw;line-height:1.15;overflow:hidden;overflow-wrap:anywhere}
    .v-tile b{font-weight:600}
    .v-tile small{font-size:2.5cqw;font-variant-numeric:tabular-nums;padding:.3cqw 1.2cqw;border-radius:9px;background:#00000040}
    .v-tile-empty{border:2px dashed #f2b632}
    .v-tile-empty small{color:#f2b632}
    .v-tile-part{box-shadow:inset .9cqw 0 0 #f2b632}
    .v-tile-part small,.v-tile-full small{color:#b8f5cf}
    .v-tile-full{box-shadow:inset .9cqw 0 0 #2fbf6a}
    .v-tile-none{opacity:.55;border-style:dotted}
    .v-tile:hover:enabled{border-color:#ffdf84;filter:brightness(1.12)}
    .v-nav{position:absolute;right:0;top:12.69%;bottom:0;width:12.75%;display:flex;flex-direction:column;gap:1.2cqw;padding:1cqw 1cqw 1.2cqw 0}
    .v-nav button{flex:1;min-height:0;padding:0;border-radius:4px;border:1px solid #aeedfc;background:#08469744;color:#f4faff;font-size:4.6cqw;font-weight:700;display:grid;place-items:center}
    .v-nav button:disabled{opacity:.35}
    .v-nav span{display:grid;place-items:center;text-align:center;font-size:2.4cqw;line-height:1.1;color:#f4faff}
    .v-nav small{display:block;font-size:2.2cqw;opacity:.75}
    .v-nav .v-back{flex:1.25;background:#f2b632;color:#2a1e05;border-color:#f2b632;align-content:center;gap:.4cqw}
    .v-nav .v-back small{font-size:2.3cqw;opacity:1;font-weight:700}
    .v-groups { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible; }
    .v-group-tag { position:absolute; transform:translate(-100%,-55%); z-index:2; padding:.15cqw .9cqw; border-radius:6px; color:#1d1406;
      font-size:2.1cqw; font-weight:700; white-space:nowrap; pointer-events:none; line-height:1.3; }
    .v-ctl.v-dim { opacity:.5; }
    .v-ctl.v-hover { outline:2px solid #ffdf84; outline-offset:1px; filter:brightness(1.12); z-index:1; }
    .v-groups .v-hover { stroke-width:2.4; stroke-dasharray:none; }
    .v-group-tag.v-hover { box-shadow:0 0 0 2px #ffdf84; }
    .v-progress,.v-legend{margin:0;color:var(--secondary-text-color,#a7bac9);font-size:.9em}
    .v-legend{display:flex;flex-wrap:wrap;gap:6px 14px}
    .v-legend span{display:inline-flex;align-items:center;gap:6px}
    .v-dot{display:inline-block;width:12px;height:12px;border-radius:3px}
    .v-dot.bound{background:#def4ed;box-shadow:inset 3px 0 0 #2fbf6a}
    .v-dot.empty{border:2px dashed #f2b632}
    .v-dot.shared{background:#cfe7ff;box-shadow:inset 3px 0 0 #4aa3ff}
    .v-extra{display:grid;gap:6px}
    .v-extra h3{margin:0;font-size:.95em}
    .v-extra>div{display:flex;flex-wrap:wrap;gap:6px}
    .v-chip{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:4px 10px;font-size:.88em;text-align:left}
    .v-chip i{font-style:normal;font-weight:800}
    .v-chip.v-empty{border:2px dashed #f2b632}
    .v-chip.v-empty i{color:#f2b632}
    .v-chip.v-bound{box-shadow:inset 4px 0 0 #2fbf6a}
    .v-chip.v-shared{box-shadow:inset 4px 0 0 #4aa3ff}
    .v-chip.selected{outline:3px solid #ffdf84}
    .v-sheet{display:grid;gap:9px;padding:13px;border-radius:10px;background:#172b40;color:#eaf3fb;border-top:3px solid #f2b632}
    .v-sheet button{background:#20384f;border-color:#3c5a76;color:#eaf3fb}
    .v-sheet-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
    .v-sheet-head h3{margin:0;font-size:1.05em}
    .v-sheet small{color:#9fb7cc}
    .v-sheet .v-shared-note{display:block;margin-top:5px;color:#ffe2a0;line-height:1.35}
    .v-sheet .v-help-btn{display:inline-flex;align-items:center;gap:6px;border-radius:20px;border:1.5px solid #f2b632;background:transparent;color:#f2b632;flex:none}
    .v-sheet .v-help-btn span{font-weight:800;font-size:1.15em}
    .v-sheet .v-help-btn[aria-pressed="true"]{background:#f2b632;color:#2a1e05}
    .v-help{display:grid;gap:7px;padding:11px 13px;border-radius:9px;background:#0f2236;border:1px solid #f2b63299;border-left:4px solid #f2b632}
    .v-help h4,.v-list h4{margin:0;color:#f2b632;font-size:.75em;letter-spacing:.03em}
    .v-help p{line-height:1.45;font-size:.92em}
    .v-help .v-tip{color:#b8cde0;font-size:.86em}
    .v-terms{display:flex;flex-wrap:wrap;gap:6px}
    .v-sheet .v-terms button{min-height:30px;padding:3px 10px;border-radius:14px;background:#24405c;border-color:#24405c;font-family:monospace;font-size:.85em}
    .v-current{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:#1d3a2b;border:1px solid #2fbf6a}
    .v-current span,.v-pick span{display:grid;gap:2px;min-width:0;overflow-wrap:anywhere;text-align:left}
    .v-sheet input[type=search]{width:100%;padding:9px 12px;border-radius:8px;border:1px solid #3c5a76;background:#0f1f30;color:#eaf3fb;font:inherit}
    .v-list{display:flex;flex-direction:column;gap:6px;max-height:min(52vh,400px);overflow:auto;padding:2px}
    .v-list>*{flex:none}
    .v-sheet .v-pick{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:44px;text-align:left}
    .v-sheet .v-pick em{font-style:normal;font-size:.82em;color:#b9d79a;flex:none;max-width:35%;overflow:hidden;text-overflow:ellipsis}
    .v-sheet .v-pick.current{border-color:#2fbf6a}
    .v-empty{color:#9fb7cc;font-size:.9em}
${gridStyles}
    /* ── 0.8.29 · visual «Main screen» editor ── */
    .ms-wrap{position:relative;margin:3px;border-radius:12px;outline:3px solid #f2b632;outline-offset:2px;container-type:inline-size}
    .ms-host{display:block}
    .ms-ov{position:absolute;inset:0;pointer-events:none}
    .ms-ov .ms-hot{position:absolute;pointer-events:auto;box-sizing:border-box;min-height:0;padding:0;border-radius:50%;cursor:pointer;border:2.5px dashed #f2b632;background:#f2b63214}
    .ms-ov .ms-hot.ok{border:2.5px solid #2fbf6a;background:transparent}
    .ms-ov .ms-hot.part{border:2.5px solid #f2b632;background:transparent}
    .ms-ov .ms-hot:hover{box-shadow:0 0 0 3px #ffdf8466}
    .ms-chip{position:absolute;transform:translate(-50%,-50%);pointer-events:none;padding:1px 8px;border-radius:9px;font:700 12px/1.5 Roboto,Arial,sans-serif;white-space:nowrap;background:#f2b632;color:#2a1e05;box-shadow:0 1px 3px #0006}
    .ms-chip.ok{background:#2fbf6a;color:#06210f}
    .ms-band{position:absolute;display:flex;align-items:center;gap:8px;padding:0 12px;box-sizing:border-box;border-radius:6px 6px 0 0;pointer-events:none;
      background:repeating-linear-gradient(135deg,#f2b632 0 14px,#e0a21e 14px 28px);color:#2a1e05}
    .ms-band b{font-size:14px;white-space:nowrap}.ms-band span{font-size:12px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
    .v-ring{display:inline-block;width:12px;height:12px;border-radius:50%;box-sizing:border-box}
    .v-ring.empty{border:2px dashed #f2b632}.v-ring.part{border:2px solid #f2b632}.v-ring.ok{border:2px solid #2fbf6a}
    .g-ed{--details-ink:#f0faff;--details-muted:#d7edff;--details-rule:#b4dcec56;--details-metric-edge:#a4dbf085;--details-metric-face:#1332704f;--details-plot-face:#0d275e50;--details-focus:#ffe38a;
      position:relative;margin:3px;border-radius:5px;overflow:hidden;container-type:inline-size;outline:3px solid #f2b632;outline-offset:2px;
      background:linear-gradient(180deg,#362382 12%,#254698 52%,#08768d 100%);color:var(--details-ink);font:400 14px/1.3 Roboto,Arial,sans-serif}
    .g-ed.dark{--details-ink:#f4faff;--details-muted:#9fb4c0;--details-rule:#1f2a31;--details-metric-edge:#22465c;--details-metric-face:#0b1116;--details-plot-face:#0a0e12;background:#050608}
    .g-ed .g-head{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 10px;border-bottom:2px solid #f2b632;
      background:repeating-linear-gradient(135deg,#f2b632 0 14px,#e0a21e 14px 28px);color:#2a1e05}
    .g-ed .g-head h2{margin:0;font-size:clamp(15px,4.4cqi,22px);font-weight:700;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .g-ed .g-head em{font-style:normal;font-weight:700;font-size:12px;padding:3px 8px;border-radius:4px;background:#2a1e05;color:#f2b632;white-space:nowrap}
    .g-ed .g-head em.ok{color:#7ff0a8}
    .g-ed .g-head .g-btn{min-height:36px;height:36px;border-color:#2a1e05;background:#2a1e0522;color:#2a1e05}
    .g-ed .g-btn{border-radius:4px;min-height:34px;padding:0 9px}
    .g-ed .g-btn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .g-ed .g-tile.e{padding-top:16px}
    .g-num{position:absolute;left:3px;top:3px;width:15px;height:15px;border-radius:50%;background:#f2b632;color:#2a1e05;font:800 10px/15px Roboto,Arial;text-align:center}
    .g-num.ok{background:#2fbf6a;color:#06210f}
    .g-tile .key{position:absolute;right:3px;top:2px;font-size:9px;font-weight:800;color:#f2b632;letter-spacing:.02em}
    .slots{align-self:stretch;display:grid;gap:3px;margin-top:3px}
    .g-ed .slot{display:flex;align-items:center;justify-content:center;gap:3px;min-height:26px;width:100%;padding:1px 2px;border-radius:3px;font:700 clamp(10px,2.9cqi,13px) Roboto,Arial;font-variant-numeric:tabular-nums;cursor:pointer;
      border:1px solid var(--details-metric-edge);background:#def4ed;color:#12284e;box-shadow:inset 3px 0 0 #2fbf6a;white-space:nowrap;overflow:hidden}
    .g-ed.dark .slot{background:#13202a;color:#fff}
    .g-ed .slot i{font-style:normal;font-weight:600;opacity:.7;font-size:.85em}
    .g-ed .slot.empty{border:2px dashed #f2b632;background:#f2b6321f;color:#f2b632;box-shadow:none}
    .g-ed .slot.derived{cursor:default;border:1px solid var(--details-metric-edge);background:repeating-linear-gradient(135deg,#ffffff14 0 4px,transparent 4px 8px);color:var(--details-muted);box-shadow:none;font-weight:600}
    .g-ed .slot.sel,.g-ed .g-rt.sel{outline:3px solid #ffdf84;outline-offset:1px;z-index:1}
    .g-ed .g-tbl td.e{padding:3px}
    .g-ed .g-tbl .slot{min-height:24px}
    .g-ed .g-tbl[data-cols="6"] .slot,.g-ed .g-tbl[data-cols="7"] .slot{font-size:10px;min-height:22px}
    .g-ed .g-rt.e{cursor:pointer;box-shadow:inset 3px 0 0 #2fbf6a;border-radius:4px;min-height:0}
    .g-ed .g-rt.e b{font-size:clamp(12px,3.6cqi,16px)}
    .g-ed .g-rt.e.empty{border:2px dashed #f2b632;background:#f2b6321f;box-shadow:none}.g-ed .g-rt.e.empty b{color:#f2b632}
    .g-ed .g-tbl .pvdel{min-height:0}
    .g-hist{margin:0 9px 9px;padding:5px 7px 0;border:1px solid var(--details-metric-edge);border-radius:4px;background:var(--details-plot-face);opacity:.55}
    .g-hist h3{margin:0;font-size:clamp(12px,3.3cqi,16px)}
    .g-hist-plot{height:90px;background:linear-gradient(to top,var(--details-rule) 1px,transparent 1px) 0 0/100% 33%}
    .g-hist-plot.big{height:200px}
    .g-note{margin:0 9px 9px;padding:6px 8px;border-radius:4px;border:1px dashed var(--details-metric-edge);color:var(--details-muted);font-size:12px;line-height:1.35}
    .g-ed .v-sheet{margin:2px 0 4px;color:#eaf3fb;font-size:14px}
    .v-sheet .v-step{display:block;color:#ffe2a0}
    .v-sheet .v-pick.best{border-color:#f2b632}
    .v-sheet .v-best{color:#f2b632;font-weight:700}
    .v-field{display:grid;gap:4px;font-size:13px;color:#9fb7cc}
    .v-sheet .v-field input{width:100%;padding:9px 12px;border-radius:8px;border:1px solid #3c5a76;background:#0f1f30;color:#eaf3fb;font:inherit}
    .v-nav2{display:flex;gap:6px}.v-nav2 button{flex:1}
    @container (max-width:560px){.workspace{grid-template-columns:minmax(0,1fr)}.side{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @container (max-width:340px){.tabs button,.pages button{font-size:.88em;padding:6px}.pane{padding:9px}}
  `;

  const editorViewKey = "deye-lcd-tehnika:editor-menu-view";
  const editorScreenViewKey = "deye-lcd-tehnika:editor-screen-view";
  const visualScreen = { w:400, h:268 };
  // Native fields that are stored under other keys: Gen Start / Grid Start are % (SOC) entities, with volts as an extra.
  const visualRedirects = { generator_start: "generator_charge_start_soc", grid_start: "grid_charge_start_soc" };
  const visualTitles = {
    battery_mode: pair("Battery mode", "Режим АКБ"), work_mode: pair("Work mode", "Режим роботи"),
    energy_pattern: pair("Energy pattern", "Пріоритет енергії"), grid_frequency: pair("Grid frequency", "Частота мережі"),
    grid_type: pair("Grid type", "Тип мережі"), gen_port_mode: pair("GEN port mode", "Режим порту GEN"),
    adv_parallel_role: pair("Parallel role", "Роль у паралелі"), adv_parallel_phase: pair("Parallel phase", "Фаза в паралелі"),
  };
  const visualTerms = {
    battery_mode: ["battery operation mode", "battery control mode"],
    battery_capacity: ["battery capacity"], battery_max_charging_current: ["battery max charging current"],
    battery_max_discharging_current: ["battery max discharging current"], battery_activate: ["battery wake up"],
    generator_charge_current: ["battery generator charging current"], grid_charge_current: ["battery grid charging current"],
    generator_charge: ["battery generator charging"], grid_charge: ["battery grid charging"],
    generator_signal: ["charging signal"], grid_signal: ["charging signal"], charging_signal: ["charging signal"],
    generator_charge_start_soc: ["battery generator charging start"], generator_charge_start_voltage: ["battery generator charging start voltage"],
    grid_charge_start_soc: ["battery grid charging start"], grid_charge_start_voltage: ["battery grid charging start voltage"],
    battery_lithium_mode: ["battery bms type", "lithium mode"], battery_control_mode: ["battery control mode"],
    battery_operation_mode: ["battery operation mode"],
    battery_shutdown: ["battery shutdown soc"], battery_low: ["battery low soc"], battery_restart: ["battery restart soc"],
    battery_shutdown_voltage: ["battery shutdown voltage"], battery_low_voltage: ["battery low voltage"],
    battery_restart_voltage: ["battery restart voltage"],
    work_mode: ["work mode"], max_solar_power: ["pv power", "max solar power"], solar_sell: ["export surplus", "solar sell"],
    max_sell_power: ["grid max export power", "export surplus power", "max sell power"], zero_export_power: ["zero export power"],
    energy_pattern: ["energy pattern"], grid_peak_shaving: ["grid peak shaving"], grid_peak_shaving_power: ["grid peak shaving"],
    time_of_use: ["time of use"],
    grid_frequency: ["grid frequency"], grid_output_voltage: ["grid voltage", "output voltage"],
    grid_reconnect_time: ["grid reconnection time"], grid_power_factor: ["grid power factor"],
    grid_normal_high_v: ["grid voltage protection high"], grid_normal_low_v: ["grid voltage protection low"],
    grid_normal_high_hz: ["grid frequency protection high"], grid_normal_low_hz: ["grid frequency protection low"],
    gen_port_mode: ["io mode", "gen port"], gen_on_threshold: ["smartload on"], gen_off_threshold: ["smartload off"],
    gen_ac_grid: ["generator grid side"], gen_always_on: ["generator on grid"],
    generator_peak_shaving: ["generator peak shaving"], generator_peak_shaving_power: ["generator peak shaving"],
    basic_datetime: ["date time"], basic_time_sync: ["time sync"], adv_mppt_scan: ["mppt multi point scanning"],
    adv_meter_select: ["meter"], adv_export_limit: ["grid max export power"], adv_import_limit: ["grid max import power"],
    device_info: ["device"], device_alarms: ["alarm"],
  };
  const visualFieldTerms = (name, english) => {
    const program = /^tou_(\d)_(grid_charge|gen_charge|charge|start|power|battery|battery_voltage)$/.exec(name);
    if (program) {
      const n = program[1];
      return {
        grid_charge: [`program ${n} charging`], gen_charge: [`program ${n} charging`], charge: [`program ${n} charging`],
        start: [`program ${n} time`], power: [`program ${n} power`], battery: [`program ${n} soc`, `program ${n} capacity`],
        battery_voltage: [`program ${n} voltage`],
      }[program[2]];
    }
    const day = /^tou_(mon|tue|wed|thu|fri|sat|sun)$/.exec(name);
    if (day) return ["time of use", day[1]];
    return visualTerms[name] ?? [String(english ?? name).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()].filter(Boolean);
  };
  const visualWords = (text) => String(text ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean);
  function visualScore(terms, entity) {
    const haystack = new Set([...visualWords(entity.attributes?.friendly_name), ...visualWords(entity.entity_id.split(".")[1].replace(/_/g, " "))]);
    let best = 0;
    for (const term of terms) {
      const words = visualWords(term);
      if (!words.length) continue;
      const hits = words.filter(word => haystack.has(word)).length;
      const numbers = words.filter(word => /^\d+$/.test(word));
      if (numbers.some(word => !haystack.has(word))) continue;
      best = Math.max(best, hits / words.length + (hits === words.length ? 1 : 0));
    }
    return best;
  }

  class DeyeLcdEditor extends HTMLElement {
    connectedCallback() {
      this.onEditorLanguage ??= () => { if (this.config && this.config.language !== storedLanguage()) { this.schemaKey = ""; this.layoutKey = ""; this.setConfig(this.config); } };
      window.addEventListener(languageEvent, this.onEditorLanguage);
      const host = this.layout?.querySelector(".ms-host");
      if (host && this.previewObserver) this.previewObserver.observe(host);
      if (this.form) return;
      this.tab = "screen";
      this.inverterIndex = 0;
      this.screenSections = [];
      this.menuSection = "";
      this.activePage = "";
      this.activePeriod = 1;
      this.matchDevices = new Map();
      try { this.menuView = localStorage.getItem(editorViewKey) === "list" ? "list" : "visual"; } catch { this.menuView = "visual"; }
      try { this.screenView = localStorage.getItem(editorScreenViewKey) === "list" ? "list" : "visual"; } catch { this.screenView = "visual"; }
      this.gridSource = "";
      this.gridPage = "main";
      this.gridSel = "";
      this.visualField = "";
      this.attachShadow({ mode:"open" });
      this.shadowRoot.innerHTML = `<style>${editorStyles}</style>
        <div class="editor-layout"></div>
        <p class="notice" role="status"></p>
        <dialog aria-labelledby="deye-editor-dialog-title"></dialog>`;
      this.layout = this.shadowRoot.querySelector(".editor-layout");
      this.notice = this.shadowRoot.querySelector(".notice");
      this.modal = this.shadowRoot.querySelector("dialog");
      this.modal.addEventListener("keydown", event => {
        if (event.key === "Escape") event.stopPropagation();
      });
      this.modal.addEventListener("close", () => { if (!this.modal.open) this.matchContext = null; });
      this.layout.addEventListener("click", event => this.navigate(event));
      this.layout.addEventListener("input", event => { if (!this.screenInput(event)) this.visualInput(event); });
      this.layout.addEventListener("change", event => this.screenChange(event));
      // Pointing at any item of a shared-entity group lights up the whole group, so it reads as one setting.
      const hover = (event, on) => {
        const item = event.target.closest?.(".v-body [data-vfield]");
        const name = on && item ? item.dataset.vfield : "";
        if (name === this.visualHover) return;
        this.visualHover = name;
        for (const node of this.layout.querySelectorAll(".v-hover")) node.classList.remove("v-hover");
        if (!name || this.layout.querySelectorAll(`.v-body [data-vfield="${CSS.escape(name)}"]`).length < 2) return;
        for (const node of this.layout.querySelectorAll(`.v-body [data-vfield="${CSS.escape(name)}"], .v-body [data-group="${CSS.escape(name)}"]`)) node.classList.add("v-hover");
      };
      this.layout.addEventListener("pointerover", event => hover(event, true));
      this.layout.addEventListener("pointerleave", event => hover(event, false));
      this.layout.addEventListener("focusin", event => hover(event, true));
      this.form = document.createElement("ha-form");
      this.form.addEventListener("value-changed", event => this.formChanged(event));
      this.render();
    }

    set hass(hass) {
      this.hassData = hass;
      if (this.form) this.form.hass = hass;
      if (this.previewCard?.isConnected) {
        try { this.previewCard.hass = hass; } catch { /* preview only */ }
      }
    }

    setConfig(config) {
      // The editor speaks the same language as the card's flags; Ukrainian by default.
      this.config = { ...config, language:storedLanguage() ?? (config.language === "en" ? "en" : "uk") };
      this.render();
    }

    t(en, uk) { return local(pair(en, uk), this.config); }

    formChanged(event) {
      event.stopPropagation();
      const values = event.detail?.value;
      if (event.target !== this.form || !this.config || !values || typeof values !== "object") return;
      const next = { ...this.config };
      let changed = false;
      for (const field of this.visibleFields) {
        const key = field.name;
        const value = values[key];
        if (Object.is(value, this.formData[key])) continue;
        if (value === undefined || value === null || value === "") {
          if (key in next) { delete next[key]; changed = true; }
        } else if (!Object.is(value, next[key])) {
          next[key] = value;
          changed = true;
        }
      }
      if (changed) {
        if (next.language !== this.config.language) storeLanguage(next.language);
        this.commit(next);
      }
    }

    commit(next) {
      this.setConfig(next);
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail:{ config:next }, bubbles:true, composed:true,
      }));
    }

    modeConfig() { return { ...DeyeLcd.getStubConfig(), ...this.config }; }

    selectedReadings() {
      return this.formDefinition.schema.find(field => field.name === "main_screen").schema[this.inverterIndex];
    }

    render(focus) {
      if (!this.form || !this.config) return;
      const config = this.modeConfig();
      const definitionKey = editorSelectorKey(config);
      if (this.schemaKey !== definitionKey) {
        this.formDefinition = configForm(config);
        this.schemaKey = definitionKey;
      }
      const { schema, computeLabel, computeHelper } = this.formDefinition;
      const t = this.t.bind(this);
      const inverterTotal = inverterCount(config);
      this.inverterIndex = Math.min(inverterTotal-1, this.inverterIndex);
      const sections = editorSections(schema, this.tab, this.inverterIndex, t);
      const stored = this.tab === "screen" ? this.screenSections[this.inverterIndex] : this.menuSection;
      const section = sections.find(item => item.name === stored)
        ?? (this.tab === "screen" ? sections.find(item => item.name.endsWith("_grid")) : null)
        ?? sections[0];

      const subgroups = section.schema.filter(item => item.schema);
      const active = subgroups.find(item => item.name === this.activePage) ?? subgroups[0];
      const screenVisual = this.tab === "screen" && this.screenView !== "list";
      const visual = this.tab === "menus" && this.menuView !== "list" || screenVisual;
      const periodPage = !visual && this.tab === "menus" && active?.name === "menu_work_1";
      const groupSchema = periodPage ? active.schema.filter(field =>
        !/^tou_[1-6]_/.test(field.name) || field.name.startsWith(`tou_${this.activePeriod}_`))
        : active?.schema ?? [];
      const direct = section.schema.filter(item => !item.schema);
      const mainGrid = this.tab === "screen" && direct.length > 1 && /_(pv|grid|load|battery)$/.test(section.name);
      const grid = (name, fields) => ({ name, type:"grid", flatten:true, schema:fields, column_min_width:"128px" });
      const fields = visual ? [] : [
        ...(mainGrid ? [grid("editor_main_fields", direct)] : direct),
        ...(this.tab === "screen" && groupSchema.length
          ? [grid("editor_page_fields", groupSchema)] : groupSchema),
      ];

      // 0.8.32 · List view: one «All entities, no filters» box for the open page; it switches off on another page.
      this.listPageKey = [this.tab, this.inverterIndex, section.name, active?.name ?? "", periodPage ? this.activePeriod : ""].join("|");
      const unfiltered = !visual && this.listAll === this.listPageKey;
      const hasEntities = fields.flatMap(editorLeaves).some(item => item.selector?.entity);
      const openSelectors = (list) => list.map(item => item.schema ? { ...item, schema:openSelectors(item.schema) }
        : item.selector?.entity ? { ...item, selector:{ entity:{} } } : item);
      if (unfiltered) fields.splice(0, fields.length, ...openSelectors(fields));
      const configuredModels = installedInverters(config).map(index => config[inverterField(index, "inverter_model")]);
      const layoutKey = [definitionKey, unfiltered ? "all" : "", this.tab, this.inverterIndex, ...configuredModels, section.name, active?.name,
        periodPage ? this.activePeriod : "", visual ? "visual" : "list"].join("|");
      if (this.layoutKey !== layoutKey) {
        this.layoutKey = layoutKey;
        const button = (kind, value, caption, selected, extra="") =>
          `<button type="button" data-${kind}="${escapeHtml(value)}" aria-pressed="${selected}">${escapeHtml(caption)}${extra}</button>`;
        const tabs = [
          ["general", t("General", "Загальне")], ["screen", t("Main screen", "Головний екран")],
          ["menus", t("Inverter menus", "Меню інвертора")],
        ];
        const toolbar = this.tab === "screen" ? `<div class="toolbar"><div class="devices" aria-label="${t("Inverters", "Інвертори")}">
          ${installedInverters(config).map(index => button("inverter", index,
            index===0 && inverterTotal>1 ? t("Inverter 1 · Master", "Інвертор 1 · Master")
              : t(`Inverter ${index+1}`, `Інвертор ${index+1}`), index===this.inverterIndex,
            `<small>${escapeHtml(modelText(readModel(config[inverterField(index, "inverter_model")], inverterTotal>1), config))}</small>`)).join("")}
          </div><button type="button" data-match>${t("Auto", "Авто")}</button></div>` : "";
        const sidebar = this.tab === "general" || visual ? "" : `<nav class="side" aria-label="${t("Sections", "Розділи")}">
          ${sections.map(item => button("section", item.name, item.title, item===section,
            this.tab === "screen" ? '<span class="count" aria-hidden="true"></span>' : "")).join("")}</nav>`;
        const label = this.tab === "general" ? t("General", "Загальне") : screenVisual ? t("Main screen", "Головний екран") : visual ? t("Inverter menus", "Меню інвертора") : section.title;
        const pageTitle = (item) => {
          const phase = /_l([123])$/.exec(item.name);
          if (phase) return t(`L${phase[1]}`, `Ф${phase[1]}`);
          const bank = /^screen_\d_battery_([12])$/.exec(item.name);
          return bank ? `BAT${bank[1]}` : item.title;
        };
        const pageButtons = !active || visual ? "" : `<nav class="pages" aria-label="${t("Pages and phases", "Сторінки та фази")}">
          ${subgroups.map(item => button("page", item.name, pageTitle(item), active===item,
            this.tab === "screen" ? '<span class="count" aria-hidden="true"></span>' : "")).join("")}</nav>`;
        const periodButtons = !periodPage ? "" : `<nav class="pages" aria-label="${t("Time-of-use periods", "Періоди Time of Use")}">
          ${Array.from({length:6}, (_, i) => button("period", i+1, t(`Period ${i+1}`, `Період ${i+1}`),
            this.activePeriod===i+1)).join("")}</nav>`;
        this.layout.innerHTML = `<nav class="tabs" aria-label="${t("Editor views", "Вкладки редактора")}">
          ${tabs.map(([key, title]) => button("tab", key, title, this.tab===key)).join("")}
          </nav>${toolbar}<div${sidebar ? ' class="workspace"' : ""}>${sidebar}
          <section class="pane" aria-label="${escapeHtml(label)}"><h2>${escapeHtml(label)}</h2>
          ${this.tab === "general" ? `<p class="note">${t("Use the T button on the card to choose its theme, palette and appearance.", "Тему, палітру й оформлення обирайте кнопкою «Т» на самій картці.")}</p>` : ""}
          ${this.tab === "menus" && inverterTotal>1 ? `<p class="note">${t("Master inverter entities", "Сутності інвертора Master")}</p>` : ""}
          ${this.tab === "menus" ? `<div class="view-toggle" role="group" aria-label="${t("Editor view", "Вигляд редактора")}"><span>${t("View:", "Вигляд:")}</span>
            ${button("view", "visual", t("Menu", "Меню"), visual)}${button("view", "list", t("List", "Список"), !visual)}</div>` : ""}
          ${this.tab === "screen" ? `<div class="view-toggle" role="group" aria-label="${t("Editor view", "Вигляд редактора")}"><span>${t("View:", "Вигляд:")}</span>
            ${button("view", "visual", t("Screen", "Екран"), screenVisual)}${button("view", "list", t("List", "Список"), !screenVisual)}</div>` : ""}
          ${pageButtons}${periodButtons}${!visual && hasEntities ? `<label class="list-all"><input type="checkbox" data-listall${unfiltered ? " checked" : ""}><span>${escapeHtml(t("All entities, no filters", "Усі сутності, без фільтрів"))}</span></label>` : ""}${visual ? '<div class="visual-slot"></div>' : '<div class="form-slot"></div>'}</section></div>`;
        if (!visual) this.layout.querySelector(".form-slot").append(this.form);
        Object.assign(this.form, { schema:fields, computeLabel, computeHelper });
        this.visibleFields = fields.flatMap(editorLeaves);
      }
      const data = {};
      for (const { name } of this.visibleFields) {
        if (name.includes("inverter_") && (name.endsWith("_model") || name === "inverter_model")) {
          data[name] = String(readModel(config[name], inverterTotal > 1));
        } else if (name === "inverter_count" || name === "inverter_phases") {
          data[name] = String(config[name]);
        } else if (config[name] !== undefined) data[name] = config[name];
      }
      if (!this.formData || Object.keys(data).length !== Object.keys(this.formData).length
          || Object.keys(data).some(key => !Object.is(data[key], this.formData[key]))) {
        this.formData = data;
        this.form.data = data;
      }
      this.form.hass = this.hassData;
      if (this.tab === "screen") {
        const updateCount = (item, kind) => {
          const names = editorLeaves(item).filter(field => field.selector?.entity).map(field => field.name);
          const count = this.layout.querySelector(`[data-${kind}="${item.name}"] .count`);
          if (count) count.textContent = `${names.filter(name => hasEditorBinding(this.config[name])).length}/${names.length}`;
        };
        for (const item of sections) updateCount(item, "section");
        for (const item of subgroups) updateCount(item, "page");
      }
      if (screenVisual) this.renderScreen();
      else if (visual) this.renderVisual();
      if (focus) this.layout.querySelector(focus)?.focus({ preventScroll:true });
    }

    navigate(event) {
      const button = event.target.closest("button");
      if (!button) return;
      const args = button.dataset;
      if (args.match !== undefined) { this.matchIntro(); return; }
      if (this.screenAction(args)) return;
      if (this.visualAction(args)) return;
      if (args.view) {
        const view = args.view === "list" ? "list" : "visual";
        if (this.tab === "screen") {
          this.screenView = view;
          try { localStorage.setItem(editorScreenViewKey, view); } catch { /* kept for this session */ }
          this.gridSource = ""; this.gridSel = "";
        } else {
          this.menuView = view;
          try { localStorage.setItem(editorViewKey, view); } catch { /* kept for this session */ }
          this.visualField = "";
        }
        this.notice.textContent = "";
        this.render(`[data-view="${view}"]`);
        return;
      }
      if (args.tab) {
        if (args.tab === "menus" && this.tab !== "menus" && this.showEditorWarning()) {
          this.menuWarning();
          return;
        }
        this.tab = args.tab;
      } else if (args.inverter !== undefined) {
        this.inverterIndex = Number(args.inverter);
        this.activePage = "";
      } else if (args.section) {
        if (this.tab === "screen") this.screenSections[this.inverterIndex] = args.section;
        else this.menuSection = args.section;
        this.activePage = "";
        this.activePeriod = 1;
      } else if (args.page) {
        this.activePage = args.page;
      } else if (args.period) {
        this.activePeriod = Number(args.period);
      } else return;
      const [type, value] = Object.entries(args)[0];
      this.notice.textContent = "";
      this.render(`[data-${type}="${value}"]`);
    }

    /* ── 0.8.29 · visual «Main screen» editor ── */
    screenStates() { return this.hassData?.states ?? {}; }

    renderScreen() {
      const slot = this.layout.querySelector(".visual-slot");
      if (!slot) return;
      if (this.gridSource) { this.renderGridEditor(slot); return; }
      const t = this.t.bind(this);
      if (!this.previewCard) {
        this.previewCard = document.createElement(cardTag);
        this.previewCard.editorPreview = true;
        this.previewCard.setAttribute("data-editor-preview", "");
        this.previewObserver = new ResizeObserver(() => this.placeRings());
      }
      let host = slot.querySelector(".ms-host");
      const firstMount = !host;
      if (!host) {
        slot.innerHTML = `<div class="ms-wrap"><div class="ms-host"></div><div class="ms-ov"></div></div>
          <p class="v-legend"><span><i class="v-ring empty"></i>${escapeHtml(t("no power linked", "немає потужності"))}</span>
          <span><i class="v-ring part"></i>${escapeHtml(t("partly", "частково"))}</span><span><i class="v-ring ok"></i>${escapeHtml(t("all linked", "усе прив’язано"))}</span></p>
          <p class="note">${escapeHtml(t("Inverter status, generator and the parallel label are in the «List» view. «Auto» works for the inverter selected above.", "Статус інвертора, генератор і позначка паралелі — у вигляді «Список». «Авто» працює для інвертора, вибраного вгорі."))}</p>`;
        host = slot.querySelector(".ms-host");
        host.append(this.previewCard);
        this.previewObserver.disconnect();
        this.previewObserver.observe(host);
      }
      try {
        this.previewCard.setConfig({ ...this.config });
        if (this.hassData) this.previewCard.hass = this.hassData;
      } catch { /* the preview must never break the editor */ }
      const settle = () => this.placeRings();
      requestAnimationFrame(() => requestAnimationFrame(settle));
      // On first mount the surrounding HA dialog may still be mid open-animation (a CSS transform,
      // which ResizeObserver never reports), so re-measure a few more times while it settles.
      if (firstMount) {
        for (const id of this.ringTimers ?? []) clearTimeout(id);
        this.ringTimers = [120, 260, 420, 650].map(ms => setTimeout(settle, ms));
      }
    }

    disconnectedCallback() {
      window.removeEventListener(languageEvent, this.onEditorLanguage);
      this.previewObserver?.disconnect();
      for (const id of this.ringTimers ?? []) clearTimeout(id);
      this.ringTimers = [];
    }

    placeRings() {
      const overlay = this.layout?.querySelector(".ms-ov");
      const card = this.previewCard;
      const root = card?.shadowRoot;
      if (!this.isConnected || !overlay || !root || this.gridSource) return;
      const t = this.t.bind(this);
      const box = overlay.getBoundingClientRect();
      const svg = root.querySelector("svg.screen");
      const area = svg?.getBoundingClientRect();
      if (!area || !area.width) return;
      const config = this.modeConfig();
      const states = this.screenStates();
      const scale = area.width / 400;
      let html = `<div class="ms-band" style="top:${(area.top - box.top).toFixed(1)}px;left:${(area.left - box.left).toFixed(1)}px;width:${area.width.toFixed(1)}px;height:${(34 * scale).toFixed(1)}px">
        <b>⚙ ${escapeHtml(t("Main screen", "Головний екран"))}</b><span>${escapeHtml(t("tap a gauge", "торкніться шкали"))}</span></div>`;
      for (const gauge of gaugeLayout) {
        const group = root.querySelector(`g.gauge[data-gauge="${gauge.key}"]`);
        const track = group?.querySelector(".track");
        const matrix = group?.getScreenCTM?.();
        if (!matrix) continue;
        // The ring is drawn from the dial geometry itself (centre and radius of the arc), so it matches in every theme.
        const stroke = parseFloat(getComputedStyle(track).strokeWidth) || 9.7;
        const unit = Math.hypot(matrix.a, matrix.b);
        const radius = (gaugeRadius + stroke / 2) * unit + 4.5;
        const cx = matrix.e - box.left, cy = matrix.f - box.top;
        const { done, total, state } = gridProgress(config, states, gauge.source);
        const label = local(pair(gauge.english, gauge.label), this.config);
        html += `<button type="button" class="ms-hot ${state}" data-gsource="${gauge.source}" style="left:${(cx - radius).toFixed(1)}px;top:${(cy - radius).toFixed(1)}px;width:${(2 * radius).toFixed(1)}px;height:${(2 * radius).toFixed(1)}px"
          aria-label="${escapeHtml(`${label} · ${done} / ${total}`)}"></button>
          <span class="ms-chip ${state === "ok" ? "ok" : ""}" style="left:${cx.toFixed(1)}px;top:${(cy - radius - 9).toFixed(1)}px">${done} / ${total}</span>`;
      }
      // Generator: an outline around its actual block (rounded rect, not a circle — the tile itself isn't round).
      const generator = root.querySelector("[data-generator]");
      const hitRect = generator?.querySelector(".hit");
      const screenMatrix = svg.getScreenCTM?.();
      if (generator && hitRect && !generator.hasAttribute("hidden") && screenMatrix) {
        const gx = parseFloat(hitRect.getAttribute("x")) || 0;
        const gy = parseFloat(hitRect.getAttribute("y")) || 0;
        const gw = parseFloat(hitRect.getAttribute("width")) || 0;
        const gh = parseFloat(hitRect.getAttribute("height")) || 0;
        const grx = parseFloat(hitRect.getAttribute("rx")) || 0;
        const margin = 4.5;
        const unit = Math.hypot(screenMatrix.a, screenMatrix.b);
        const x0 = screenMatrix.a * gx + screenMatrix.c * gy + screenMatrix.e - box.left;
        const y0 = screenMatrix.b * gx + screenMatrix.d * gy + screenMatrix.f - box.top;
        const left = x0 - margin, top = y0 - margin;
        const w = gw * unit + margin * 2, h = gh * unit + margin * 2;
        const radiusPx = grx * unit + margin;
        const { done, total, state } = gridProgress(config, states, "generator");
        html += `<button type="button" class="ms-hot ${state}" data-gsource="generator" style="left:${left.toFixed(1)}px;top:${top.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;border-radius:${radiusPx.toFixed(1)}px"
          aria-label="${escapeHtml(`${t("Generator", "Генератор")} · ${done} / ${total}`)}"></button>
          <span class="ms-chip ${state === "ok" ? "ok" : ""}" style="left:${(left + w / 2).toFixed(1)}px;top:${(top + h + 2).toFixed(1)}px">${done} / ${total}</span>`;
      }
      overlay.innerHTML = html;
    }

    gridPageProgress(config, source) {
      if (this.gridPage !== "sub") return gridProgress(config, this.screenStates(), source);
      const order = gridOrder(config, source, "sub");
      const done = order.filter(name => hasEditorBinding(config[name])).length;
      return { done, total:order.length };
    }

    renderGridEditor(slot) {
      const t = this.t.bind(this);
      const config = this.modeConfig();
      const source = this.gridSource;
      const layout = gridLayouts[source];
      const english = preferEnglish(this.config);
      const gauge = gaugeOfSource(source);
      if (this.gridPage === "sub" && !gridHasSub(config, source)) this.gridPage = "main";
      const page = this.gridPage;
      const { done, total } = this.gridPageProgress(config, source);
      const suffix = page === "sub" ? (source === "pv" ? t(" · by input", " · по входах") : t(" · by phase", " · по фазах")) : page === "chart" ? t(" · graph", " · графік") : "";
      const back = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6m-6-6h12"/></svg>';
      const head = `<header class="g-head"><button type="button" class="g-btn" data-gback aria-label="${escapeHtml(t("Back", "Назад"))}">${back}</button>
        <h2>${escapeHtml(t("Settings · ", "Налаштування · ") + local(gridShortNames[source], this.config) + suffix)}</h2>
        ${page === "chart" ? "" : `<em class="${done === total ? "ok" : ""}">${done} / ${total}</em>`}</header>`;
      const history = `<section class="g-hist"><h3>${escapeHtml(gridInverters(config, source).length > 1 ? t("Combined power · 24 h", "Загальна потужність · 24 год") : t("Power · 24 h", "Потужність · 24 год"))}</h3>
        <div class="g-hist-plot${page === "chart" ? " big" : ""}"></div></section>
        <p class="g-note">${escapeHtml(t("The graph needs no setup — it uses the history of «Power».", "Графік окремо не налаштовується — він бере історію з «Потужності»."))}</p>`;
      const body = page === "chart" ? history : gridBodyHtml({
        config, states:this.screenStates(), source, page, edit:true, sel:this.gridSel, t, english,
        sheet:(name, order) => this.gridSheetHtml(name, order), runtimeSheet:() => this.runtimeSheetHtml(),
      }) + (page === "main" && !layout.chartPage ? history : "");
      const dark = this.hassData?.themes?.darkMode === true;
      slot.innerHTML = `<div class="g-ed${dark ? " dark" : ""}">${head}${body}</div>`;
      if (this.gridScroll) {
        this.gridScroll = false;
        slot.querySelector(".v-sheet")?.scrollIntoView({ block:"nearest", behavior:"smooth" });
      }
    }

    gridField(name) {
      const index = Number(/^inverter_(\d)_/.exec(name)?.[1] ?? 1) - 1;
      const key = index ? name.replace(/^inverter_\d_/, "") : name;
      const source = this.gridSource;
      const tile = gridLayouts[source].tiles.find(item => item.field === key);
      if (tile) return { index, key, tile, step:gridLayouts[source].tiles.indexOf(tile) + 1 };
      const sub = new RegExp(`^${source}_(l[123]|[1-6])_(voltage|current|power)$`).exec(key);
      if (!sub) return null;
      const metric = gridSubMetrics.find(item => item.k === sub[2]);
      return { index, key, tile:{ ...metric, dom:"sensor" }, column:sub[1], step:0 };
    }

    gridTerms(field) {
      const special = {
        pv_power:["pv power", "solar power"], pv_energy_today:["today production", "daily production", "pv energy today", "today pv"],
        pv_energy_total:["total production", "total pv", "pv energy total"], grid_power:["grid power", "external ct power"],
        grid_energy_today:["today energy import", "daily energy bought", "today energy bought", "grid import today", "today grid import", "daily grid import"],
        grid_connected:["grid", "grid connected", "grid connection"], battery_soc:["battery", "battery soc", "state of charge"],
        battery_temperature:["battery temperature"], load_energy_today:["today load consumption", "daily load consumption", "load today"],
        generator_power:["generator power", "gen power"], generator_energy_today:["generator energy today", "today generator", "generator today"],
      };
      if (special[field.key]) return special[field.key];
      if (field.column) {
        const metric = field.tile.k;
        if (/^\d$/.test(field.column)) return [`pv${field.column} ${metric}`, `pv ${field.column} ${metric}`];
        const terms = [`${this.gridSource} ${field.column} ${metric}`, `${this.gridSource} ${metric} ${field.column}`];
        // 0.8.32 · on Deye the grid phases are often named after the current transformers.
        if (this.gridSource === "grid") {
          const n = field.column.at(-1);
          terms.push(`external ct${n} ${metric}`, `external ct ${n} ${metric}`, `internal ct${n} ${metric}`, `internal ct ${n} ${metric}`);
        }
        return terms;
      }
      return [field.key.replace(/_/g, " ")];
    }

    gridAnchors() {
      // The device of each inverter, taken from its already linked power entities.
      const entities = editorEntities(this.hassData);
      return installedInverters(this.config).map(index => {
        for (const key of ["battery_power", "grid_power", "load_power", "pv_power", "inverter_status", "battery_soc"]) {
          const id = this.config[inverterField(index, key)];
          const device = id && entities[id]?.device_id;
          if (device) return device;
        }
        return null;
      });
    }

    gridCandidates(name) {
      const field = this.gridField(name);
      if (!field) return { field, list:[] };
      const states = this.screenStates();
      const units = { kw:["w", "kw", "вт", "квт"], v:["v", "в", "mv", "kv"], a:["a", "а", "ma"], kwh:["kwh", "wh", "mwh", "квт·год"],
        pct:["%"], c:["°c", "°f", "°с"] }[field.tile.unit];
      const terms = this.gridTerms(field);
      const anchors = this.gridAnchors();
      const entities = editorEntities(this.hassData);
      const query = visualWords(this.gridSearch);
      // 0.8.32 · «All entities, no filters» is remembered for each field separately.
      const all = Boolean(this.gridAllFields?.has(name));
      const list = Object.values(states).filter(entity => all || entity.entity_id.split(".")[0] === field.tile.dom).filter(entity => {
        if (!query.length) return true;
        const text = `${entity.attributes?.friendly_name ?? ""} ${entity.entity_id}`.toLowerCase();
        return query.every(word => text.includes(word));
      }).map(entity => {
        const name = visualScore(terms, entity);
        // Fewer extra words wins a tie: «Grid Power» before «Grid L1 Power».
        let score = name - .04 * visualWords(entity.entity_id.split(".")[1].replace(/_/g, " ")).length;
        const unit = String(entity.attributes?.unit_of_measurement ?? "").trim().toLowerCase();
        if (units && !all) score += units.includes(unit) ? .5 : -1.2;
        if (field.column && /^l[123]$/.test(field.column)) {
          // 0.8.32 · Grid phases: CT sensors first, «Load» / «Output» lower; Load phases — the other way round.
          const words = ` ${visualWords(`${entity.attributes?.friendly_name ?? ""} ${entity.entity_id.replace(/_/g, " ")}`).join(" ")} `;
          const ct = /\s(external|internal)?\s?ct\s?\d?\s/.test(words) || /\s(external|internal)\s/.test(words);
          const output = /\s(load|output|ups|backup)\s/.test(words);
          if (this.gridSource === "grid") score += (ct ? .5 : 0) - (output ? 1.2 : 0);
          else if (this.gridSource === "load") score += (output ? .3 : 0) - (ct ? 1.2 : 0);
        }
        if (field.tile.k === "temperature" && /\b(dc|radiator|heatsink|igbt|ac)\b/.test(visualWords(`${entity.attributes?.friendly_name ?? ""} ${entity.entity_id.replace(/_/g, " ")}`).join(" "))) score -= 1.5;
        const device = entities[entity.entity_id]?.device_id;
        if (device && anchors[field.index] === device) score += .6;
        else if (device && anchors.some((anchor, k) => k !== field.index && anchor === device)) score -= .8;
        return { entity, score, name, unitOk:all || !units || units.includes(unit) };
      }).sort((a, b) => b.score - a.score || String(a.entity.attributes?.friendly_name ?? a.entity.entity_id).localeCompare(String(b.entity.attributes?.friendly_name ?? b.entity.entity_id)));
      return { field, list };
    }

    gridHelp(field) {
      const t = this.t.bind(this);
      const help = {
        grid_power:t("Grid exchange power, W or kW. With it the Grid gauge already works. Look for «Grid Power» or «External CT Power».", "Потужність обміну з мережею, W або kW. Після неї шкала Мережі вже працює. Шукайте «Grid Power» або «External CT Power»."),
        grid_voltage:t("Grid voltage, V. On 3 phases it can be skipped — the tile averages L1–L3.", "Напруга мережі, V. На 3ф можна пропустити — кубик порахує середнє з L1–L3."),
        grid_current:t("Grid current, A. On 3 phases it can be skipped — the tile averages the phases.", "Струм мережі, A. На 3ф можна пропустити — кубик візьме середнє з фаз."),
        grid_energy_today:t("Energy taken from the grid today, kWh («Today Energy Import», «Daily Energy Bought»).", "Енергія, спожита з мережі за сьогодні, kWh («Today Energy Import», «Daily Energy Bought»)."),
        grid_connected:t("Binary sensor «Grid» (on / off). In parallel every inverter has its own: grid on one only shows ⚠.", "Двійковий сенсор «Grid» (on / off). У паралелі в кожного інвертора свій: мережа лише на одному — кубик покаже ⚠."),
        pv_power:t("Total solar power, W. With it the Solar gauge already works. No total? Link the PV inputs — the card adds them up.", "Загальна потужність сонця, W. Після неї шкала Сонця вже працює. Якщо загальної немає — прив'яжіть входи PV, картка складе їх."),
        pv_energy_today:t("Produced today, kWh («Today Production»).", "Вироблено сьогодні, kWh («Today Production»)."),
        pv_energy_total:t("Produced in total, kWh («Total Production»).", "Вироблено за весь час, kWh («Total Production»)."),
        battery_power:t("Battery power, W: charge / discharge. With it the gauge works, and with «Charge» it also shows the percent.", "Потужність АКБ, W: заряд / розряд. Після неї шкала працює, а з «Заряд» — ще й відсотки на шкалі."),
        battery_soc:t("Battery charge in % (SOC). With a shared bank both inverters see the same %.", "Заряд АКБ у % (SOC). У паралелі зі спільною АКБ обидва інвертори бачать однаковий %."),
        battery_voltage:t("Battery voltage, V.", "Напруга АКБ, V."), battery_current:t("Battery current, A. In parallel — the sum.", "Струм АКБ, A. У паралелі — сума."),
        battery_temperature:t("Battery temperature, °C. Do not confuse with «DC Temperature» — that is the inverter heatsink.", "Температура АКБ, °C. Не плутайте з «DC Temperature» — це радіатор інвертора."),
        load_power:t("Load power, W. With it the Load gauge already works.", "Потужність навантаження, W. Після неї шкала Навантаження вже працює."),
        load_voltage:t("Load output voltage, V. On 3 phases it can be skipped — the phase average is used.", "Напруга на виході навантаження, V. На 3ф можна пропустити — середнє з фаз."),
        load_current:t("Load current, A. On 3 phases it can be skipped.", "Струм навантаження, A. На 3ф можна пропустити."),
        load_energy_today:t("Consumed today, kWh («Today Load Consumption»).", "Спожито сьогодні, kWh («Today Load Consumption»)."),
        generator_power:t("Generator power, W. With it the generator window works. In parallel, «Generator power source» in the List view decides whether one total sensor or the sum of all inverters is used.", "Потужність генератора, W. Після неї вікно генератора вже працює. У паралелі «Джерело потужності генератора» (вигляд «Список» → Загальне) визначає: один сумарний датчик чи сума всіх інверторів."),
        generator_voltage:t("Generator voltage, V. On 3 phases it can be skipped — the phase average is used.", "Напруга генератора, V. На 3ф можна пропустити — середнє з фаз."),
        generator_current:t("Generator current, A. On 3 phases it can be skipped — the phase average is used.", "Струм генератора, A. На 3ф можна пропустити — середнє з фаз."),
        generator_energy_today:t("Generator energy today, kWh («Generator Energy - today»).", "Енергія генератора за сьогодні, kWh («Generator Energy - today»)."),
      }[field.key];
      return help ?? t(`Choose the «${this.gridTerms(field)[0]}» sensor of inverter #${field.index + 1}.`, `Оберіть сенсор «${this.gridTerms(field)[0]}» інвертора #${field.index + 1}.`);
    }

    gridListHtml(name) {
      const t = this.t.bind(this);
      const { list } = this.gridCandidates(name);
      const current = this.config[name];
      if (!list.length) return `<p class="v-empty">${escapeHtml(t("Nothing found. Try another word or open the tip.", "Нічого не знайдено. Спробуйте інше слово або відкрийте пораду."))}</p>`;
      const best = !current && list[0].name >= 2 && list[0].unitOk && !(list[1] && list[1].score === list[0].score) ? list[0].entity.entity_id : "";
      const row = ({ entity }) => `<button type="button" class="v-pick${entity.entity_id === current ? " current" : ""}${entity.entity_id === best ? " best" : ""}" data-gpick="${escapeHtml(entity.entity_id)}">
        <span><b>${escapeHtml(entity.attributes?.friendly_name ?? entity.entity_id)}</b><small>${escapeHtml(entity.entity_id)}</small>${entity.entity_id === best ? `<small class="v-best">${escapeHtml(t("Best match", "Найкраще збігається"))}</small>` : ""}</span>
        <em>${escapeHtml(`${String(entity.state).slice(0, 14)}${entity.attributes?.unit_of_measurement ? " " + entity.attributes.unit_of_measurement : ""}`)}</em></button>`;
      const similar = list.filter(item => item.name >= 1.5 && item.unitOk).slice(0, 6);
      const rest = list.filter(item => !similar.includes(item)).slice(0, 40);
      const hidden = list.length - similar.length - rest.length;
      return `${similar.length ? `<h4>${t("SIMILAR BY NAME", "СХОЖІ ЗА НАЗВОЮ")}</h4>${similar.map(row).join("")}` : ""}
        ${rest.length ? `<h4>${similar.length ? t("OTHER ENTITIES", "ІНШІ СУТНОСТІ") : t("ENTITIES", "СУТНОСТІ")}</h4>${rest.map(row).join("")}` : ""}
        ${hidden > 0 ? `<p class="v-empty">${escapeHtml(t(`${hidden} more — refine the search.`, `Ще ${hidden} — уточніть пошук.`))}</p>` : ""}`;
    }

    gridSheetHtml(name, order) {
      const t = this.t.bind(this);
      const field = this.gridField(name);
      if (!field) return "";
      const config = this.modeConfig();
      const source = this.gridSource;
      const layout = gridLayouts[source];
      const parallel = gridInverters(config, source).length > 1;
      const title = field.column ? `${local(field.tile.label, this.config)} ${gridColumnTitle(source, field.column)}` : local(field.tile.label, this.config);
      const current = this.config[name];
      const entity = current ? this.screenStates()[current] : null;
      const step = field.step ? t(`Step ${field.step} of ${layout.tiles.length}`, `Крок ${field.step} з ${layout.tiles.length}`)
        + (field.step === 1 ? t(" — after it the gauge already works", " — після неї шкала вже працює") : "") : t("Individual reading", "Окремий показ");
      return `<section class="v-sheet" style="grid-column:1/-1;${order ? `order:${order};` : ""}" aria-label="${escapeHtml(t("Choose an entity", "Вибір сутності"))}">
        <div class="v-sheet-head"><div><h3>${escapeHtml(`${local(gridShortNames[source], this.config)} · ${title}${parallel ? ` · #${field.index + 1}` : ""}`)}</h3>
          <small class="v-step">${escapeHtml(step)}</small></div>
          <button type="button" class="v-help-btn" data-ghelp aria-pressed="${Boolean(this.gridHelpOpen)}"><span aria-hidden="true">?</span>${escapeHtml(this.gridHelpOpen ? t("Hide", "Сховати") : t("Tip", "Порада"))}</button></div>
        ${this.gridHelpOpen ? `<div class="v-help"><p>${escapeHtml(this.gridHelp(field))}</p>
          <h4>${t("NO MATCH? SEARCH FOR", "ЯКЩО НЕМАЄ ЗБІГУ — ШУКАЙТЕ")}</h4><div class="v-terms">${this.gridTerms(field).map(term => `<button type="button" data-gterm="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join("")}</div>
          <p class="v-tip">${escapeHtml(t("Not in the list? Settings → Devices & services → Entities: search for it and check that it is not disabled.", "Немає у списку? Налаштування → Пристрої та служби → Сутності: знайдіть пошуком і перевірте, чи вона не вимкнена."))}</p></div>` : ""}
        ${current ? `<div class="v-current"><span><b>${escapeHtml(entity?.attributes?.friendly_name ?? current)}</b><small>${escapeHtml(current)}${entity ? "" : ` · ${t("not found in Home Assistant", "не знайдено в Home Assistant")}`}</small></span>
          <button type="button" data-gclear>${t("Clear", "Прибрати")}</button></div>` : ""}
        <input type="search" data-gsearch value="${escapeHtml(this.gridSearch ?? "")}" placeholder="${escapeHtml(t("Search entity…", "Пошук сутності…"))}" aria-label="${escapeHtml(t("Search entity", "Пошук сутності"))}">
        <label class="v-all"><input type="checkbox" data-gall${this.gridAllFields?.has(name) ? " checked" : ""}><span>${escapeHtml(t("All entities, no filters", "Усі сутності, без фільтрів"))}</span></label>
        <div class="v-list">${this.gridListHtml(name)}</div>
        <div class="actions v-nav2"><button type="button" data-gclose>${t("Close", "Закрити")}</button><button type="button" data-gnext>${t("Next empty ›", "Наступне порожнє ›")}</button></div>
      </section>`;
    }

    runtimeSheetHtml() {
      const t = this.t.bind(this);
      const states = this.screenStates();
      const sensorId = this.config.battery_capacity_sensor;
      const sensor = sensorId ? states[sensorId] : null;
      const energy = ["kwh", "wh", "mwh", "квт·год"];
      const sensors = Object.values(states).filter(entity => entity.entity_id.startsWith("sensor.")
        && energy.includes(String(entity.attributes?.unit_of_measurement ?? "").trim().toLowerCase()))
        .map(entity => ({ entity, score:visualScore(["battery capacity"], entity) }))
        .sort((a, b) => b.score - a.score).slice(0, 8);
      const value = (key) => this.config[key] === undefined || this.config[key] === null ? "" : escapeHtml(String(this.config[key]));
      return `<section class="v-sheet" style="grid-column:1/-1;order:1" aria-label="${escapeHtml(t("Estimated time", "Розрахунковий час"))}">
        <div class="v-sheet-head"><div><h3>${escapeHtml(t("Battery · Estimated time", "Батарея · Розрахунковий час"))}</h3><small class="v-step">${escapeHtml(t("Needs Power and Charge + capacity", "Потрібні Потужність і Заряд + ємність"))}</small></div>
          <button type="button" class="v-help-btn" data-ghelp aria-pressed="${Boolean(this.gridHelpOpen)}"><span aria-hidden="true">?</span>${escapeHtml(this.gridHelpOpen ? t("Hide", "Сховати") : t("Tip", "Порада"))}</button></div>
        ${this.gridHelpOpen ? `<div class="v-help"><p>${escapeHtml(t("Capacity is taken in this order: the number you type → separate bank capacities → a capacity sensor (kWh) → Ah × battery voltage. Check that the sensor shows the full capacity, not the remaining energy. Threshold: if empty — the inverter «Shutdown» setting, otherwise 20 %.",
          "Ємність береться так: число, яке ви вписали → ємності окремих АКБ → сенсор ємності (кВт·год) → А·год × напруга АКБ. Перевірте, що сенсор показує повну ємність, а не залишок. Поріг: якщо порожньо — «Поріг вимкнення» інвертора, інакше 20 %."))}</p></div>` : ""}
        <label class="v-field"><span>${escapeHtml(t("Battery capacity, kWh", "Ємність АКБ, кВт·год"))}</span><input type="number" step="0.1" min="0" inputmode="decimal" placeholder="${escapeHtml(t("e.g. 30.7", "напр. 30,7"))}" value="${value("battery_runtime_capacity_kwh")}" data-grt="battery_runtime_capacity_kwh"></label>
        <label class="v-field"><span>${escapeHtml(t("Count discharge down to, %", "Рахувати розряд до, %"))}</span><input type="number" step="1" min="0" max="90" inputmode="numeric" placeholder="20" value="${value("battery_runtime_cutoff")}" data-grt="battery_runtime_cutoff"></label>
        <div class="v-field"><span>${escapeHtml(t("or a capacity sensor (kWh)", "або сенсор ємності (кВт·год)"))}</span></div>
        ${sensorId ? `<div class="v-current"><span><b>${escapeHtml(sensor?.attributes?.friendly_name ?? sensorId)}</b><small>${escapeHtml(sensorId)}</small></span><button type="button" data-grtclear>${t("Clear", "Прибрати")}</button></div>` : ""}
        <div class="v-list">${sensors.map(({ entity, score }, k) => `<button type="button" class="v-pick${entity.entity_id === sensorId ? " current" : ""}${!sensorId && !k && score >= 2 ? " best" : ""}" data-grtpick="${escapeHtml(entity.entity_id)}">
          <span><b>${escapeHtml(entity.attributes?.friendly_name ?? entity.entity_id)}</b><small>${escapeHtml(entity.entity_id)}</small>${!sensorId && !k && score >= 2 ? `<small class="v-best">${escapeHtml(t("Best match", "Найкраще збігається"))}</small>` : ""}</span>
          <em>${escapeHtml(`${entity.state} ${entity.attributes?.unit_of_measurement ?? ""}`)}</em></button>`).join("") || `<p class="v-empty">${escapeHtml(t("No energy sensors (kWh) in Home Assistant.", "У Home Assistant немає сенсорів енергії (кВт·год)."))}</p>`}</div>
        <div class="actions v-nav2"><button type="button" data-gclose>${t("Close", "Закрити")}</button><button type="button" data-gnext>${t("Next empty ›", "Наступне порожнє ›")}</button></div>
      </section>`;
    }

    gridNextEmpty(config, after) {
      const order = gridOrder(config, this.gridSource, this.gridPage === "sub" ? "sub" : "main");
      const start = after ? order.indexOf(after) : -1;
      return order.slice(start + 1).find(name => gridSlotNeeded(config, this.screenStates(), this.gridSource, name, this.gridPage)) ?? "";
    }

    screenAction(args) {
      if (this.tab !== "screen" || this.screenView === "list") return false;
      const keys = ["gsource", "gback", "gslot", "gact", "gpick", "ghelp", "gterm", "gclear", "gclose", "gnext", "grtpick", "grtclear"];
      if (!keys.some(key => args[key] !== undefined)) return false;
      const t = this.t.bind(this);
      const config = this.modeConfig();
      const rerender = (scroll = false) => { this.gridScroll = scroll; this.renderScreen(); };
      if (args.gsource !== undefined) {
        this.gridSource = args.gsource;
        this.gridPage = "main";
        this.gridSearch = "";
        this.gridHelpOpen = false;
        this.gridSel = this.gridNextEmpty(config);
        rerender(true);
        this.layout.querySelector(".g-ed")?.scrollIntoView({ block:"nearest" });
      } else if (args.gback !== undefined) {
        if (this.gridPage !== "main") { this.gridPage = "main"; this.gridSel = ""; rerender(); }
        else {
          const source = this.gridSource;
          this.gridSource = ""; this.gridSel = "";
          rerender();
          this.layout.querySelector(`[data-gsource="${source}"]`)?.focus({ preventScroll:true });
        }
      } else if (args.gslot !== undefined) {
        this.gridSel = this.gridSel === args.gslot ? "" : args.gslot;
        this.gridSearch = ""; this.gridHelpOpen = false;
        rerender(true);
      } else if (args.gact !== undefined) {
        const index = Number(args.gi ?? 0);
        if (args.gact === "sub" || args.gact === "chart") {
          this.gridPage = args.gact;
          this.gridSel = args.gact === "sub" ? this.gridNextEmpty(config) : "";
          rerender(true);
        } else if (args.gact === "pvadd") {
          const count = pvInputCount(config, index);
          if (count >= 6) return true;
          this.gridSel = inverterField(index, `pv_${count + 1}_voltage`);
          this.gridScroll = true;
          this.commit({ ...this.config, [inverterField(index, "pv_inputs")]:count + 1 });
        } else if (args.gact === "pvdel") {
          const count = pvInputCount(config, index);
          if (count <= 1) return true;
          const next = { ...this.config };
          for (const { k } of gridSubMetrics) delete next[inverterField(index, `pv_${count}_${k}`)];
          if (count - 1 > 1) next[inverterField(index, "pv_inputs")] = count - 1; else delete next[inverterField(index, "pv_inputs")];
          this.gridSel = "";
          this.commit(next);
        }
      } else if (args.gpick !== undefined) {
        const name = this.gridSel;
        if (!name) return true;
        const next = { ...this.config, [name]:args.gpick };
        this.gridSel = this.gridNextEmpty({ ...DeyeLcd.getStubConfig(), ...next }, name);
        this.gridSearch = ""; this.gridHelpOpen = false; this.gridScroll = Boolean(this.gridSel);
        this.notice.textContent = t(`Linked: ${args.gpick}`, `Прив’язано: ${args.gpick}`);
        this.commit(next);
      } else if (args.grtpick !== undefined) {
        const next = { ...this.config, battery_capacity_sensor:args.grtpick };
        this.gridSel = this.gridNextEmpty({ ...DeyeLcd.getStubConfig(), ...next }, "__runtime");
        this.gridScroll = Boolean(this.gridSel);
        this.commit(next);
      } else if (args.grtclear !== undefined) {
        const next = { ...this.config };
        delete next.battery_capacity_sensor;
        this.commit(next);
      } else if (args.ghelp !== undefined) {
        this.gridHelpOpen = !this.gridHelpOpen;
        rerender();
        this.layout.querySelector("[data-ghelp]")?.focus({ preventScroll:true });
      } else if (args.gterm !== undefined) {
        this.gridSearch = args.gterm;
        rerender();
      } else if (args.gclear !== undefined) {
        const next = { ...this.config };
        delete next[this.gridSel];
        this.notice.textContent = t("Link removed.", "Прив’язку прибрано.");
        this.commit(next);
      } else if (args.gclose !== undefined) {
        const name = this.gridSel;
        this.gridSel = "";
        rerender();
        this.layout.querySelector(`[data-gslot="${CSS.escape(name)}"]`)?.focus({ preventScroll:true });
      } else if (args.gnext !== undefined) {
        this.gridSel = this.gridNextEmpty(config, this.gridSel) || this.gridNextEmpty(config);
        this.gridSearch = ""; this.gridHelpOpen = false;
        rerender(true);
      }
      return true;
    }

    screenInput(event) {
      const input = event.target.closest?.("[data-gsearch]");
      if (!input) return false;
      this.gridSearch = input.value;
      const list = this.layout.querySelector(".g-ed .v-list");
      if (list && this.gridSel) list.innerHTML = this.gridListHtml(this.gridSel);
      return true;
    }

    screenChange(event) {
      const all = event.target.closest?.("[data-gall]");
      if (all && this.gridSel) {
        this.gridAllFields ??= new Set();
        if (all.checked) this.gridAllFields.add(this.gridSel); else this.gridAllFields.delete(this.gridSel);
        const list = this.layout.querySelector(".g-ed .v-list");
        if (list) list.innerHTML = this.gridListHtml(this.gridSel);
        return;
      }
      const listAll = event.target.closest?.("[data-listall]");
      if (listAll) {
        this.listAll = listAll.checked ? this.listPageKey : "";
        this.layoutKey = "";
        this.setConfig(this.config);
        return;
      }
      const input = event.target.closest?.("[data-grt]");
      if (!input) return;
      const key = input.dataset.grt;
      const next = { ...this.config };
      const value = String(input.value).trim().replace(",", ".");
      if (value === "" || !Number.isFinite(Number(value))) delete next[key];
      else next[key] = Number(value);
      this.commit(next);
    }

    visualDomains(name) {
      return [].concat(bindingDomains[name] ?? (readingBindings.has(name) || name === "device_info" ? "sensor" : []));
    }

    visualState(name) {
      const config = this.config;
      if (lockedSettings.has(name)) return "locked";
      if (!this.visualDomains(name).length) return "derived";
      if (hasEditorBinding(config[name])) return "bound";
      const via = (key) => hasEditorBinding(config[key]);
      const slot = /^tou_(\d)_(grid_charge|gen_charge|battery)$/.exec(name);
      if (slot && via(slot[2] === "battery" ? `tou_${slot[1]}_battery_voltage` : `tou_${slot[1]}_charge`)) return "shared";
      if (name === "battery_mode" && (via("battery_control_mode") || via("battery_operation_mode"))) return "shared";
      if (/^(generator|grid)_signal$/.test(name) && via("charging_signal")) return "shared";
      if (/^battery_(shutdown|low|restart)$/.test(name) && via(`${name}_voltage`)) return "shared";
      if (/^basic_(year|month|day|hour|minute)$/.test(name) && via("basic_datetime")) return "shared";
      if (/^(generator|grid)_charge_start_soc$/.test(name) && via(name.replace(/_soc$/, "_voltage"))) return "shared";
      return "empty";
    }

    visualOptionMatches(name, option, value) {
      const choices = name === "battery_mode" ? batteryChoices[option] : settingOptions[name]?.[option];
      if (!choices || !value) return false;
      return choices.some(choice => optionKey(choice) === optionKey(String(value)));
    }

    visualTitle(name, control) {
      if (visualTitles[name]) return local(visualTitles[name], this.config);
      const label = this.formDefinition?.computeLabel?.({ name });
      return label || (control?.label ? local(control.label, this.config) : name);
    }

    visualValue(name, control) {
      const entity = this.hassData?.states?.[this.config[name]];
      if (!entity) return "";
      const state = String(entity.state);
      if (["unavailable", "unknown"].includes(state)) return "—";
      if (control?.kind === "time") return state.slice(0, 5);
      if (control?.kind === "number" || control?.kind === "readout") return state;
      return state;
    }

    visualMenuStats(menu) {
      const names = new Set();
      for (const screen of menu.pages) {
        for (const control of screen.controls) {
          if (!control.name || control.alias) continue;
          if (["alias", "derived", "locked"].includes(this.visualState(control.name))) continue;
          names.add(control.name);
        }
        for (const name of screen.extra) if (this.visualDomains(name).length) names.add(name);
      }
      const bound = [...names].filter(name => ["bound", "shared"].includes(this.visualState(name))).length;
      return { bound, total:names.size };
    }

    renderVisual() {
      const slot = this.layout.querySelector(".visual-slot");
      if (!slot) return;
      const t = this.t.bind(this);
      const menu = settingsMenus.find(item => item.id === this.visualMenuId);
      const legend = `<p class="v-legend"><span><i class="v-dot bound"></i>${t("linked", "прив’язано")}</span><span><i class="v-dot empty"></i>${t("empty — tap to choose", "порожньо — натисніть")}</span>
          <span><i class="v-dot shared"></i>${t("covered by a shared entity", "через спільну сутність")}</span></p>`;
      const badge = (readOnly) => `<em>${escapeHtml(readOnly ? t("VIEW ONLY · NO AUTO", "ЛИШЕ ПЕРЕГЛЯД · БЕЗ АВТО") : t("CARD SETTINGS", "НАЛАШТУВАННЯ КАРТКИ"))}</em>`;
      if (!menu) {
        this.visualField = "";
        let all = 0, linked = 0;
        const tiles = settingsMenus.map(item => {
          const { bound, total } = this.visualMenuStats(item);
          all += total; linked += bound;
          const readOnly = readOnlyMenus.has(item.id);
          const state = !total ? "none" : bound === 0 ? "empty" : bound === total ? "full" : "part";
          const note = !total ? t("no fields", "немає полів") : `${bound}/${total}`;
          return `<button type="button" class="v-tile v-tile-${state}" style="grid-area:${item.id}" ${total ? `data-vmenu="${item.id}"` : "disabled"}
            aria-label="${escapeHtml(local(item.title, this.config))} · ${escapeHtml(note)}"><b>${escapeHtml(local(item.title, this.config))}</b>
            <small>${readOnly ? `${escapeHtml(t("view only", "лише перегляд"))} · ` : ""}${escapeHtml(note)}</small></button>`;
        }).join("");
        slot.innerHTML = `<div class="v-screen v-home">
            <div class="v-head"><b>${escapeHtml(t("System Setup", "Налаштування системи"))}</b>${badge(false)}</div>
            <div class="v-tiles">${tiles}</div>
          </div>
          <p class="v-progress">${escapeHtml(t(`Linked in all menus: ${linked} of ${all}. Open a menu to link its fields.`, `Прив’язано в усіх меню: ${linked} з ${all}. Відкрийте меню, щоб прив’язати його поля.`))}</p>${legend}`;
        return;
      }
      const pageIndex = Math.min(menu.pages.length - 1, Math.max(0, this.visualPageIndex ?? 0));
      const screen = menu.pages[pageIndex];
      const key = `${menu.id}:${pageIndex}`;
      if (this.visualPageKey !== key) { this.visualPageKey = key; this.visualField = ""; this.visualHelp = false; this.visualSearch = ""; }
      const pct = (value, base) => `${(value / base * 100).toFixed(3)}%`;
      const box = (c) => `left:${pct(c.x, visualScreen.w)};top:${pct(c.y, visualScreen.h)};width:${pct(c.w, visualScreen.w)};height:${pct(c.h, visualScreen.h)}`;
      const readOnly = readOnlyMenus.has(menu.id);
      const names = new Set();
      const controls = screen.controls.map(control => {
        if (control.kind === "line") return `<span class="v-line" style="${box(control)}"></span>`;
        if (control.kind === "label") {
          return `<span class="v-label" style="${box(control)};justify-content:${control.align === "center" ? "center" : control.align === "end" ? "flex-end" : "flex-start"};font-size:${(control.font * 0.92).toFixed(2)}cqw">${escapeHtml(local(control.label, this.config))}</span>`;
        }
        if (!control.name) return "";
        const bindName = visualRedirects[control.name] ?? control.name;
        const state = control.alias ? "alias" : this.visualState(bindName);
        if (!["alias", "derived", "locked"].includes(state)) names.add(bindName);
        const title = this.visualTitle(bindName, control);
        const text = control.label ? local(control.label, this.config) : title;
        const value = state === "bound" ? this.visualValue(bindName, control) : "";
        const mark = { bound:"✓", shared:"⇄", empty:"+", alias:"", derived:"", locked:"🔒" }[state];
        let inner, dim = false;
        if (control.kind === "checkbox" || control.kind === "radio") {
          const modeValue = control.forMode ? this.visualValue("work_mode") : "";
          dim = Boolean(modeValue && modeValue !== "—" && !this.visualOptionMatches("work_mode", control.forMode, modeValue));
          const sign = state !== "bound" || dim && state !== "bound" ? mark : dim ? "" : control.kind === "checkbox" ? (value === "off" ? "" : "✓")
            : this.visualOptionMatches(bindName, control.option, value) ? "●" : "";
          inner = `<i class="v-box${control.kind === "radio" ? " round" : ""}">${escapeHtml(sign)}</i>${control.compact ? "" : `<b>${escapeHtml(text)}</b>`}`;
        } else if (control.kind === "alarms") {
          inner = `<b>${escapeHtml(t("Alarm log", "Журнал тривог"))} ${mark}</b>`;
        } else if (state === "alias") {
          inner = `<b>${escapeHtml(t("auto", "авто"))}</b>`;
        } else if (state === "derived") {
          inner = `<b>${escapeHtml(t("from below", "з полів нижче"))}</b>`;
        } else {
          inner = `<b>${escapeHtml(state === "bound" ? `${value || "✓"}${value && control.unit && value !== "—" ? control.unit : ""}` : mark)}</b>`;
        }
        const disabled = ["alias", "derived", "locked"].includes(state);
        const selected = this.visualField === bindName ? " selected" : "";
        return `<button type="button" class="v-ctl v-${state} v-${control.kind}${control.compact ? " v-compact" : ""}${selected}${dim ? " v-dim" : ""}" style="${box(control)}"
          ${disabled ? "disabled" : `data-vfield="${escapeHtml(bindName)}"`} title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">${inner}</button>`;
      }).join("");
      const frames = this.visualGroupFrames(screen, pct);
      const extras = screen.extra.filter(name => this.visualDomains(name).length);
      for (const name of extras) names.add(name);
      const bound = [...names].filter(name => ["bound", "shared"].includes(this.visualState(name))).length;
      const chips = extras.map(name => {
        const state = this.visualState(name);
        return `<button type="button" class="v-chip v-${state}${this.visualField === name ? " selected" : ""}" data-vfield="${escapeHtml(name)}">
          <i>${{ bound:"✓", shared:"⇄", empty:"+" }[state] ?? ""}</i>${escapeHtml(this.visualTitle(name))}</button>`;
      }).join("");
      const caption = local(screen.caption, this.config);
      const heading = screen.title ? local(screen.title, this.config) : local(menu.title, this.config);
      const nav = `<div class="v-nav">
          <button type="button" data-vstep="-1" ${pageIndex === 0 ? "disabled" : ""} aria-label="${escapeHtml(t("Previous page", "Попередня сторінка"))}">↑</button>
          <span>${escapeHtml(caption)}<small>${pageIndex + 1}/${menu.pages.length}</small></span>
          <button type="button" data-vstep="1" ${pageIndex === menu.pages.length - 1 ? "disabled" : ""} aria-label="${escapeHtml(t("Next page", "Наступна сторінка"))}">↓</button>
          <button type="button" class="v-back" data-vback aria-label="${escapeHtml(t("Back to System Setup", "Назад до меню налаштувань"))}">↩<small>${escapeHtml(t("Back", "Назад"))}</small></button>
        </div>`;
      slot.innerHTML = `<div class="v-screen" data-readonly="${readOnly}">
          <div class="v-head"><b>${escapeHtml(heading)}</b>${badge(readOnly)}</div>
          <div class="v-body">${frames}${controls}</div>${nav}
        </div>
        <div class="v-sheet-slot"></div>
        <p class="v-progress">${escapeHtml(t(`Linked on this page: ${bound} of ${names.size}`, `Прив’язано на сторінці: ${bound} з ${names.size}`))}</p>
        ${extras.length ? `<div class="v-extra"><h3>${escapeHtml(t("Additional for this page", "Додатково для цієї сторінки"))}</h3><div>${chips}</div></div>` : ""}
        ${legend}`;
      this.renderSheet();
    }

    visualGroupFrames(screen, pct) {
      // Items that share one entity (radio choices, the two Solar Sell rows) get one dashed frame of their own colour.
      const t = this.t.bind(this);
      const colours = ["#ff9f6b", "#c59bff", "#5fd6c8", "#ffd166"];
      const members = {};
      for (const control of screen.controls) {
        if (!control.name || control.alias || !["radio", "checkbox"].includes(control.kind)) continue;
        (members[control.name] ??= []).push(control);
      }
      const groups = Object.entries(members).filter(([, list]) => list.length > 1);
      if (!groups.length) return "";
      const rect = (c, pad = 0) => ({ x0:c.x - pad, y0:c.y - pad, x1:c.x + c.w + pad, y1:c.y + c.h + pad });
      const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
      const others = (name) => screen.controls.filter(c => c.name && c.name !== name && c.kind !== "label").map(c => rect(c));
      const placed = [];
      let svg = "", tags = "";
      groups.forEach(([name, list], index) => {
        const colour = colours[index % colours.length];
        const foreign = others(name);
        const box = list.reduce((a, c) => { const r = rect(c); return { x0:Math.min(a.x0, r.x0), y0:Math.min(a.y0, r.y0), x1:Math.max(a.x1, r.x1), y1:Math.max(a.y1, r.y1) }; },
          { x0:Infinity, y0:Infinity, x1:-Infinity, y1:-Infinity });
        // One frame around the whole group when nothing else sits inside it; otherwise a frame around each item.
        const centre = (r) => ({ x:(r.x0 + r.x1) / 2, y:(r.y0 + r.y1) / 2 });
        const inside = (r) => { const c = centre(r); return c.x > box.x0 && c.x < box.x1 && c.y > box.y0 && c.y < box.y1; };
        const split = foreign.some(inside);
        const shapes = split ? list.map(c => rect(c)) : [box];
        const frames = shapes.map(shape => {
          let pad = 3.5;
          const grow = (p) => ({ x0:shape.x0 - p, y0:shape.y0 - p, x1:shape.x1 + p, y1:shape.y1 + p });
          while (pad > .8 && (foreign.some(r => hit(r, grow(pad))) || placed.some(r => hit(r, grow(pad))))) pad -= .4;
          return grow(Math.max(.8, pad));
        });
        placed.push(...frames);
        if (split) {
          // Separate frames of one group are tied together by a dashed line along their left side.
          const x = Math.max(1.5, Math.min(...frames.map(f => f.x0)) - 2.2);
          const ys = frames.map(f => (f.y0 + f.y1) / 2);
          svg += `<path data-group="${escapeHtml(name)}" d="M${x} ${Math.min(...ys)}V${Math.max(...ys)}" stroke="${colour}" stroke-width="1.6" stroke-dasharray="3 2" fill="none" vector-effect="non-scaling-stroke"/>`;
          for (const f of frames) svg += `<path d="M${x} ${((f.y0 + f.y1) / 2).toFixed(1)}H${f.x0.toFixed(1)}" stroke="${colour}" stroke-width="1.6" fill="none" vector-effect="non-scaling-stroke"/>`;
        }
        for (const f of frames) {
          svg += `<rect data-group="${escapeHtml(name)}" x="${f.x0.toFixed(1)}" y="${f.y0.toFixed(1)}" width="${(f.x1 - f.x0).toFixed(1)}" height="${(f.y1 - f.y0).toFixed(1)}" rx="5"
            fill="${colour}14" stroke="${colour}" stroke-width="1.3" stroke-dasharray="4 2.6" vector-effect="non-scaling-stroke"/>`;
        }
        const first = frames[0];
        tags += `<span class="v-group-tag" data-group="${escapeHtml(name)}" style="left:${pct(first.x1 - 2, visualScreen.w)};top:${pct(first.y0, visualScreen.h)};background:${colour}">${escapeHtml(t("1 entity", "1 сутність"))}</span>`;
      });
      return `<svg class="v-groups" viewBox="0 0 ${visualScreen.w} ${visualScreen.h}" preserveAspectRatio="none" aria-hidden="true">${svg}</svg>${tags}`;
    }

    renderSheet() {
      const slot = this.layout.querySelector(".v-sheet-slot");
      if (!slot) return;
      const name = this.visualField;
      if (!name) { slot.innerHTML = ""; return; }
      const t = this.t.bind(this);
      const control = this.visualPageControl(name);
      const title = this.visualTitle(name, control);
      const domains = this.visualDomains(name);
      const current = this.config[name];
      const currentEntity = current ? this.hassData?.states?.[current] : null;
      const help = this.visualHelpText(name, control, domains);
      slot.innerHTML = `<section class="v-sheet" aria-label="${escapeHtml(t("Choose an entity", "Вибір сутності"))}">
        <div class="v-sheet-head"><div><h3>${escapeHtml(title)}</h3><small>${escapeHtml(t("fits: ", "підходять: "))}${escapeHtml(domains.join(" / "))}</small>
          ${this.visualOptionCount(name) > 1 ? `<small class="v-shared-note">${escapeHtml(name === "solar_sell"
            ? t("One entity for both rows. Solar Sell applies to the selected zero-export mode; the other row is greyed out.",
              "Одна сутність на обидва рядки. Продаж надлишку діє для вибраного режиму нульового експорту, другий рядок сірий.")
            : t(`One entity for all ${this.visualOptionCount(name)} items in the frame — they are filled together; the current one is marked ●.`,
              `Одна сутність на всі ${this.visualOptionCount(name)} пункти в рамці — вони заповнюються разом; поточний позначено ●.`))}</small>` : ""}</div>
          <button type="button" class="v-help-btn" data-vhelp aria-pressed="${Boolean(this.visualHelp)}"><span aria-hidden="true">?</span>${escapeHtml(this.visualHelp ? t("Hide", "Сховати") : t("Tip", "Порада"))}</button></div>
        ${this.visualHelp ? `<div class="v-help"><h4>${t("WHAT THIS IS", "ЩО ЦЕ ЗА ПУНКТ")}</h4><p>${escapeHtml(help.what)}</p>
          <h4>${t("NO MATCH? SEARCH FOR", "ЯКЩО НЕМАЄ ЗБІГУ — ШУКАЙТЕ")}</h4><div class="v-terms">${help.terms.map(term => `<button type="button" data-vterm="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join("")}</div>
          <p class="v-tip">${escapeHtml(help.tip)}</p></div>` : ""}
        ${current ? `<div class="v-current"><span><b>${escapeHtml(currentEntity?.attributes?.friendly_name ?? current)}</b><small>${escapeHtml(current)}${currentEntity ? "" : ` · ${t("not found in Home Assistant", "не знайдено в Home Assistant")}`}</small></span>
          <button type="button" data-vclear>${t("Clear", "Очистити")}</button></div>` : ""}
        <input type="search" data-vsearch value="${escapeHtml(this.visualSearch ?? "")}" placeholder="${escapeHtml(t("Search entity…", "Пошук сутності…"))}" aria-label="${escapeHtml(t("Search entity", "Пошук сутності"))}">
        <div class="v-list">${this.visualListHtml(name, control, domains)}</div>
        <div class="actions"><button type="button" data-vclose>${t("Close", "Закрити")}</button></div>
      </section>`;
    }

    visualOptionCount(name) {
      const screen = settingsMenus.flatMap(menu => menu.pages).find(page => page.controls.some(item => item.name === name));
      return screen ? screen.controls.filter(item => item.name === name && !item.alias && ["radio", "checkbox"].includes(item.kind)).length : 0;
    }

    visualPageControl(name) {
      for (const menu of settingsMenus) for (const screen of menu.pages) {
        const control = screen.controls.find(item => item.name === name && !item.alias);
        if (control) return control;
      }
      return null;
    }

    visualListHtml(name, control, domains) {
      const t = this.t.bind(this);
      const states = Object.values(this.hassData?.states ?? {}).filter(entity => domains.includes(entity.entity_id.split(".")[0]));
      if (!states.length) {
        return `<p class="v-empty">${escapeHtml(t(`No ${domains.join(" / ")} entities in Home Assistant. Open the tip above.`,
          `У Home Assistant немає сутностей типу ${domains.join(" / ")}. Відкрийте пораду вище.`))}</p>`;
      }
      const english = control?.label?.en ?? visualTitles[name]?.en;
      const terms = visualFieldTerms(name, english);
      const query = visualWords(this.visualSearch);
      const matchesQuery = entity => {
        if (!query.length) return true;
        const text = `${entity.attributes?.friendly_name ?? ""} ${entity.entity_id}`.toLowerCase();
        return query.every(word => text.includes(word));
      };
      const scored = states.filter(matchesQuery).map(entity => ({ entity, score:visualScore(terms, entity) }))
        .sort((a, b) => b.score - a.score || String(a.entity.attributes?.friendly_name ?? a.entity.entity_id).localeCompare(String(b.entity.attributes?.friendly_name ?? b.entity.entity_id)));
      const similar = scored.filter(item => item.score >= 2).slice(0, 6);
      const rest = scored.filter(item => !similar.includes(item)).slice(0, 60);
      const row = ({ entity }) => `<button type="button" class="v-pick${entity.entity_id === this.config[name] ? " current" : ""}" data-vpick="${escapeHtml(entity.entity_id)}">
        <span><b>${escapeHtml(entity.attributes?.friendly_name ?? entity.entity_id)}</b><small>${escapeHtml(entity.entity_id)}</small></span><em>${escapeHtml(String(entity.state).slice(0, 18))}</em></button>`;
      const hidden = scored.length - similar.length - rest.length;
      return `${similar.length ? `<h4>${t("SIMILAR BY NAME", "СХОЖІ ЗА НАЗВОЮ")}</h4>${similar.map(row).join("")}` : ""}
        ${rest.length ? `<h4>${similar.length ? t("OTHER ENTITIES", "ІНШІ СУТНОСТІ") : t("ENTITIES", "СУТНОСТІ")}</h4>${rest.map(row).join("")}` : ""}
        ${!scored.length ? `<p class="v-empty">${escapeHtml(t("Nothing found. Try another word or open the tip.", "Нічого не знайдено. Спробуйте інше слово або відкрийте пораду."))}</p>` : ""}
        ${hidden > 0 ? `<p class="v-empty">${escapeHtml(t(`${hidden} more — refine the search.`, `Ще ${hidden} — уточніть пошук.`))}</p>` : ""}`;
    }

    visualHelpText(name, control, domains) {
      const t = this.t.bind(this);
      const menu = settingsMenus.find(item => item.pages.some(screen => screen.controls.includes(control) || screen.extra.includes(name)));
      const menuTitle = menu ? local(menu.title, this.config) : "";
      const title = this.visualTitle(name, control);
      const english = control?.label?.en ?? visualTitles[name]?.en;
      const slot = /^tou_(\d)_/.exec(name)?.[1];
      const specific = {
        grid_charge: slot && t(`Grid tick in period ${slot}: may the inverter charge the battery from the grid at this time. In ha-solarman it is one select «Program ${slot} Charging» (Disabled / Grid / Gen / Grid & Gen) that also drives the GEN tick — you can link it under «Additional for this page».`,
          `Галочка «Мережа» у періоді ${slot}: чи можна заряджати АКБ від мережі в цей час. У ha-solarman це один селектор «Program ${slot} Charging» (Disabled / Grid / Gen / Grid & Gen), він же керує і галочкою GEN — його можна прив’язати в рядку «Додатково для цієї сторінки».`),
        gen_charge: slot && t(`GEN tick in period ${slot}: may the battery charge from the generator at this time. Usually the same shared «Program ${slot} Charging» select.`,
          `Галочка «GEN» у періоді ${slot}: чи можна заряджати АКБ від генератора в цей час. Зазвичай це той самий спільний селектор «Program ${slot} Charging».`),
        start: slot && t(`Start time of period ${slot}. The end is taken automatically from the start of the next period.`,
          `Час початку періоду ${slot}. Кінець картка бере сама — це початок наступного періоду.`),
        power: slot && t(`Maximum battery power in period ${slot}, in watts.`, `Максимальна потужність АКБ у періоді ${slot}, у ватах.`),
        battery: slot && t(`Battery target for period ${slot}: % (SOC) or, in voltage mode, volts — the volts entity goes under «Additional for this page».`,
          `Поріг АКБ для періоду ${slot}: % (SOC), а в режимі «За напругою» — вольти; сутність у вольтах прив’язується в рядку «Додатково для цієї сторінки».`),
        charge: slot && t(`Shared charge selector of period ${slot}: one entity for both Grid and GEN ticks.`, `Спільний селектор заряду періоду ${slot}: одна сутність на обидві галочки — «Мережа» і «GEN».`),
        battery_voltage: slot && t(`Battery target of period ${slot} in volts, for the voltage battery mode.`, `Поріг АКБ періоду ${slot} у вольтах — для режиму АКБ «За напругою».`),
      }[/^tou_\d_(.+)$/.exec(name)?.[1]];
      const helper = this.formDefinition?.computeHelper?.({ name });
      const base = readingBindings.has(name) || name === "device_info"
        ? t(`«${title}» from the ${menuTitle} menu. Display only: the card just reads the value.`, `«${title}» з меню «${menuTitle}». Лише показ: картка тільки читає значення.`)
        : readOnlyMenus.has(menu?.id)
          ? t(`«${title}» from the ${menuTitle} menu. View only: the card never changes grid settings, and Auto never fills this menu.`, `«${title}» з меню «${menuTitle}». Лише перегляд: картка не змінює налаштування мережі, і «Авто» це меню не заповнює.`)
          : t(`«${title}» from the ${menuTitle} menu. The card shows its value and can change it after confirmation.`, `«${title}» з меню «${menuTitle}». Картка показує значення і може змінити його після підтвердження.`);
      const what = [specific || base, helper].filter(Boolean).join(" ");
      const type = {
        number: t("Type number: only it can be changed from the card; a sensor with the same value will not do.", "Тип number: лише його можна змінювати з картки, сенсор із тим самим числом не підійде."),
        switch: t("Type switch: on / off.", "Тип switch: увімкнено / вимкнено."),
        select: t("Type select: a list of options, as on the inverter.", "Тип select: список варіантів, як на інверторі."),
        time: t("Type time is best; number or select also work.", "Найкраще тип time; number чи select теж підійдуть."),
        sensor: t("Type sensor: display only.", "Тип sensor: лише для показу."),
        datetime: t("Type datetime: date and time in one entity.", "Тип datetime: дата й час в одній сутності."),
        button: t("Type button.", "Тип button."),
      }[domains[0]] ?? "";
      const missing = t("Not in the list? Settings → Devices & services → Entities: search for it and check that it is not disabled (show disabled entities).",
        "Немає у списку? Налаштування → Пристрої та служби → Сутності: знайдіть пошуком і перевірте, чи вона не вимкнена (увімкніть показ вимкнених).");
      return { what, terms:visualFieldTerms(name, english), tip:[type, missing].filter(Boolean).join(" ") };
    }

    visualAction(args) {
      const t = this.t.bind(this);
      if (args.vmenu !== undefined || args.vback !== undefined || args.vstep !== undefined) {
        if (args.vmenu !== undefined) { this.visualMenuId = args.vmenu; this.visualPageIndex = 0; }
        else if (args.vback !== undefined) { this.visualMenuId = ""; }
        else this.visualPageIndex = (this.visualPageIndex ?? 0) + Number(args.vstep);
        this.visualField = "";
        this.notice.textContent = "";
        this.renderVisual();
        const focus = args.vmenu !== undefined ? "[data-vback]" : args.vback !== undefined ? `[data-vmenu="${CSS.escape(this.visualPreviousMenu ?? "")}"]` : `[data-vstep="${args.vstep}"]:enabled`;
        if (args.vmenu !== undefined) this.visualPreviousMenu = args.vmenu;
        (this.layout.querySelector(focus) ?? this.layout.querySelector(".v-screen button:enabled"))?.focus({ preventScroll:true });
        this.layout.querySelector(".v-screen")?.scrollIntoView({ block:"nearest" });
        return true;
      }
      if (args.vfield !== undefined) {
        this.visualField = this.visualField === args.vfield ? "" : args.vfield;
        this.visualHelp = false;
        this.visualSearch = "";
        this.renderVisualAgain();
        if (this.visualField) this.layout.querySelector(".v-sheet")?.scrollIntoView({ block:"nearest", behavior:"smooth" });
      } else if (args.vhelp !== undefined) {
        this.visualHelp = !this.visualHelp;
        this.renderSheet();
        this.layout.querySelector("[data-vhelp]")?.focus({ preventScroll:true });
      } else if (args.vterm !== undefined) {
        this.visualSearch = args.vterm;
        this.renderSheet();
      } else if (args.vclose !== undefined) {
        const name = this.visualField;
        this.visualField = "";
        this.renderVisualAgain();
        this.layout.querySelector(`[data-vfield="${CSS.escape(name)}"]`)?.focus({ preventScroll:true });
      } else if (args.vclear !== undefined) {
        const next = { ...this.config };
        delete next[this.visualField];
        this.notice.textContent = t("Link removed.", "Прив’язку прибрано.");
        this.commit(next);
      } else if (args.vpick !== undefined) {
        const name = this.visualField;
        this.visualField = "";
        this.notice.textContent = t(`Linked: ${args.vpick}`, `Прив’язано: ${args.vpick}`);
        this.commit({ ...this.config, [name]:args.vpick });
        this.layout.querySelector(`[data-vfield="${CSS.escape(name)}"]`)?.focus({ preventScroll:true });
      } else return false;
      return true;
    }

    renderVisualAgain() { this.renderVisual(); }

    visualInput(event) {
      const input = event.target.closest?.("[data-vsearch]");
      if (!input) return;
      this.visualSearch = input.value;
      const list = this.layout.querySelector(".v-list");
      const name = this.visualField;
      if (list && name) list.innerHTML = this.visualListHtml(name, this.visualPageControl(name), this.visualDomains(name));
    }

    showEditorWarning() {
      if (this.warningDismissed) return false;
      try { return localStorage.getItem(editorWarningKey) !== "yes"; }
      catch { return true; }
    }

    showModal(tone, title, markup, handle, focus="[data-close]") {
      this.modal.dataset.tone = tone;
      this.modal.innerHTML = `<h2 id="deye-editor-dialog-title">${escapeHtml(title)}</h2>${markup}`;
      this.modal.onclick = event => {
        const button = event.target.closest("button");
        if (!button) return;
        if (button.hasAttribute("data-close")) this.modal.close();
        else handle(button);
      };
      this.modal.onchange = null;
      if (!this.modal.open) this.modal.showModal();
      this.modal.querySelector(focus)?.focus();
    }

    menuWarning() {
      const t = this.t.bind(this);
      this.showModal("rose", t("Inverter settings", "Налаштування інвертора"),
        `<p>${t("Entities linked here can change inverter settings from the card. Verify every entity before linking it.",
          "Сутності, які ви прив’язуєте тут, дають змогу змінювати параметри інвертора з картки. Перевіряйте призначення кожної сутності перед прив’язкою.")}</p>
          <label class="opt-out"><input type="checkbox" data-skip>${t("Do not show again", "Більше не показувати")}</label>
          <div class="actions"><button type="button" data-close>${t("Back", "Назад")}</button>
          <button type="button" data-continue>${t("Continue — I am an experienced user", "Продовжити — я досвідчений користувач")}</button></div>`,
        button => {
          if (!button.hasAttribute("data-continue")) return;
          if (this.modal.querySelector("[data-skip]").checked) {
            this.warningDismissed = true;
            try { localStorage.setItem(editorWarningKey,"yes"); } catch { /* The editor retains it for this session. */ }
          }
          this.modal.close();
          this.tab = "menus";
          this.notice.textContent = "";
          this.render('[data-tab="menus"]');
        });
    }

    matchIntro() {
      const t = this.t.bind(this);
      let hidden = false;
      try { hidden = localStorage.getItem(autoMatchWarningKey) === "yes"; } catch { hidden = this.autoMatchWarningDismissed === true; }
      if (hidden) { this.matchReview(); return; }
      this.showModal("amber", t("Experimental feature", "Експериментальна функція"),
        `<p>${t("Automatic entity matching is experimental and can be inaccurate. Review every proposed sensor before applying changes.",
          "Автоматичний пошук сутностей — експериментальна функція і може працювати неточно. Перевірте всі запропоновані сенсори перед застосуванням.")}</p>
          <label class="opt-out"><input type="checkbox" data-skip-auto>${t("Do not show again", "Більше не показувати")}</label>
          <div class="actions"><button type="button" data-close>${t("Cancel", "Скасувати")}</button>
          <button type="button" class="amber" data-try>${t("Continue", "Продовжити")}</button></div>`,
        button => {
          if (!button.hasAttribute("data-try")) return;
          if (this.modal.querySelector("[data-skip-auto]")?.checked) {
            this.autoMatchWarningDismissed = true;
            try { localStorage.setItem(autoMatchWarningKey,"yes"); } catch { /* session fallback */ }
          }
          this.matchReview();
        });
    }

    matchReview() {
      const t = this.t.bind(this);
      const hass = this.hassData;
      const entities = Object.entries(editorEntities(hass));
      const available = new Set(entities.flatMap(([id, entry]) =>
        (entry.device_id && !entry.disabled_by && !entry.hidden_by && !entry.hidden
          && /^(sensor|binary_sensor)\./.test(entry.entity_id ?? id)) ? [entry.device_id] : []));
      const devices = Object.entries(editorDevices(hass)).filter(([id]) => available.has(id))
        .map(([id, info]) => ({ id, label:editorDeviceName(info) || id, model:info.model }));
      devices.sort((a,b) => a.label.localeCompare(b.label));
      const deviceNames = devices.map(device => device.label);
      const defaults = this.matchDevices.get(this.inverterIndex);
      this.matchContext = { index:this.inverterIndex, structure:this.schemaKey, plan:[] };
      const options = devices.map(({id,label,model}) => {
        const duplicate = deviceNames.indexOf(label) !== deviceNames.lastIndexOf(label);
        const display = duplicate ? `${label} · ${model ? model+" · " : ""}${id.slice(-6)}` : label;
        return `<option value="${escapeHtml(id)}"${id===defaults ? " selected" : ""}>${escapeHtml(display)}</option>`;
      }).join("");
      this.showModal("", t("Auto-match entities", "Автопідбір сутностей"),
        `<p>${t(`Empty fields for inverter ${this.inverterIndex+1}`, `Порожні поля інвертора ${this.inverterIndex+1}`)}</p>
        ${devices.length ? `<label class="device-picker">${t("Home Assistant device", "Пристрій Home Assistant")}
          <select data-device><option value="">${t("Choose a device", "Оберіть пристрій")}</option>${options}</select></label>`
          : `<p>${t("No devices with readable entities are available. Use the manual entity fields.",
            "Пристрої із доступними сутностями не знайдено. Скористайтесь ручним вибором.")}</p>`}
        <div class="match-list"></div>
        <div class="actions"><button type="button" data-close>${t("Back", "Назад")}</button>
        <button type="button" data-manual>${t("Continue manually / skip", "Вручну / пропустити")}</button>
        <button type="button" class="amber" data-apply disabled>${t("Fill selected", "Заповнити вибрані")}</button></div>`,
        button => {
          if (button.hasAttribute("data-apply")) this.applyMatch();
          else if (button.hasAttribute("data-manual")) {
            this.modal.close();
            this.notice.textContent = t("Continue with manual selection. Missing optional fields can stay empty.", "Продовжуйте ручний вибір. Необов’язкові поля можна залишити порожніми.");
            this.layout.querySelector("[data-match]")?.focus();
          }
        },
        devices.length ? "[data-device]" : "[data-close]");
      this.modal.onchange = event => {
        if (event.target.matches("[data-device]")) this.renderMatchList();
        else if (event.target.matches("[data-choice]")) {
          // Picking an entity in the list ticks its box; going back to «—» clears it.
          const box = event.target.closest(".choice-row")?.querySelector("[data-proposal]");
          if (box) box.checked = Boolean(event.target.value);
          this.updateMatchButton();
        } else if (event.target.matches("[data-proposal]")) {
          const choice = event.target.closest(".choice-row")?.querySelector("[data-choice]");
          if (choice && event.target.checked && !choice.value) event.target.checked = false;
          this.updateMatchButton();
        }
      };
      this.renderMatchList();
    }

    renderMatchList() {
      const t = this.t.bind(this);
      const device = this.modal.querySelector("[data-device]")?.value;
      const list = this.modal.querySelector(".match-list");
      const context = this.matchContext;
      context.device = device;
      const inverter = this.selectedReadings();
      context.plan = device ? editorMatchPlan(inverter, this.config, this.hassData, device, t("Inverter status", "Статус інвертора")) : [];
      const rows = context.plan;
      const otherIndex = device ? [...this.matchDevices].find(([index, id]) => index !== this.inverterIndex && id === device)?.[0] : undefined;
      const duplicate = otherIndex === undefined ? "" : `<p class="match-warning">${escapeHtml(t(
        `This device is already used for inverter ${otherIndex + 1}. In a parallel system each inverter is usually its own device.`,
        `Цей пристрій уже обрано для інвертора ${otherIndex + 1}. У паралельній системі кожен інвертор зазвичай окремий пристрій.`))}</p>`;
      if (!device || !rows.length) {
        list.innerHTML = device ? `${duplicate}<p>${t("There are no empty fields for this inverter.", "Для цього інвертора немає порожніх полів.")}</p>` : "";
        this.updateMatchButton();
        return;
      }
      this.matchDevices.set(this.inverterIndex, device);
      const label = row => [row.group.title, row.subgroup?.title, this.formDefinition.computeLabel(row.leaf) ?? row.leaf.name].filter(Boolean).join(" · ");
      const sure = rows.filter(row => row.candidate);
      const choose = rows.filter(row => !row.candidate && row.options.length);
      const manual = rows.filter(row => !row.candidate && !row.options.length);
      const reasonLabel = {
        ambiguous:t("Several similar entities: choose one or skip.", "Кілька схожих сутностей: оберіть одну або пропустіть."),
        used:t("This entity is already bound to another field of the card.", "Ця сутність уже прив’язана до іншого поля картки."),
        suggest:t("Possible substitute, not an exact match. Check it before use.", "Можлива заміна, не точний збіг. Перевірте перед використанням."),
      };
      list.innerHTML = `${duplicate}
        ${sure.length ? `<h3>${t("Sure matches", "Впевнені збіги")}</h3>` : ""}
        ${sure.map(row => `<label class="proposal"><input type="checkbox" data-proposal value="${escapeHtml(row.leaf.name)}" checked>
          <span><strong>${escapeHtml(label(row))}</strong>
          <small>${escapeHtml(row.candidate.name)}</small><small class="hex">${escapeHtml(row.candidate.id)}</small></span></label>`).join("")}
        ${choose.length ? `<h3>${t("Choose yourself", "Оберіть самі")}</h3>` : ""}
        ${choose.map(row => `<div class="proposal choice-row"><input type="checkbox" data-proposal value="${escapeHtml(row.leaf.name)}" aria-label="${escapeHtml(label(row))}">
          <span><strong>${escapeHtml(label(row))}</strong><small>${reasonLabel[row.reason]}</small>
          <select data-choice aria-label="${escapeHtml(label(row))}"><option value="">${t("— do not fill —", "— не заповнювати —")}</option>
          ${row.options.map(option => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.name)} · ${escapeHtml(option.id)}</option>`).join("")}</select></span></div>`).join("")}
        ${manual.length ? `<h3>${t("Not found · fill manually or leave empty", "Не знайдено · оберіть вручну або залиште порожнім")}</h3>
          <div class="manual-row"><span>${manual.map(row => `<small>${escapeHtml(label(row))}</small>`).join("")}</span></div>` : ""}`;
      list.scrollTop = 0;
      this.updateMatchButton();
    }

    matchSelection() {
      const selected = new Map();
      for (const box of this.modal.querySelectorAll("[data-proposal]:checked")) {
        const row = this.matchContext?.plan.find(item => item.leaf.name === box.value);
        const choice = box.closest(".choice-row")?.querySelector("[data-choice]");
        const id = row?.candidate ? row.candidate.id : choice?.value;
        if (id) selected.set(box.value, id);
      }
      return selected;
    }

    updateMatchButton() {
      const count = this.matchSelection().size;
      const button = this.modal.querySelector("[data-apply]");
      button.disabled = !count;
      button.textContent = this.t(`Fill selected (${count})`, `Заповнити вибрані (${count})`);
    }

    applyMatch() {
      const context = this.matchContext;
      if (!context || context.index !== this.inverterIndex || context.structure !== this.schemaKey || this.tab !== "screen") {
        this.modal.close();
        this.notice.textContent = this.t("The editor changed. Open auto-match again.", "Конфігурація змінилася. Відкрийте автопідбір знову.");
        return;
      }
      const confirmed = this.matchSelection();
      const inverter = this.selectedReadings();
      const currentPlan = editorMatchPlan(inverter, this.config, this.hassData, context.device, this.t("Inverter status", "Статус інвертора"));
      const { next, count } = applyEditorMatches(this.config, currentPlan, confirmed);
      this.modal.close();
      if (count) this.commit(next);
      this.notice.textContent = count === confirmed.size
        ? this.t(`Fields filled: ${count}. Use the card editor’s Save button to keep the bindings.`,
          `Заповнено полів — ${count}. Щоб зберегти прив’язки, натисніть «Зберегти» в редакторі картки.`)
        : this.t(`Fields filled: ${count}. Some matches changed or repeated. Review the remaining fields manually.`,
          `Заповнено полів — ${count}. Частина збігів змінилася або повторюється. Перевірте решту полів вручну.`);
    }
  }

  // Empty a flow layer and forget its pool key, so particles are rebuilt when the flow comes back.
  function clearFlowLayer(layer) {
    if (!layer) return;
    layer.replaceChildren();
    delete layer.dataset.key;
    delete layer.dataset.level;
  }

  class DeyeLcd extends HTMLElement {
    static getStubConfig() {
      return {
        language: "uk", lcd_theme: "classic", lcd_palette: "olive", lcd_appearance: "auto", lcd_auto_source: "ha", lcd_particles: "dot",
        inverter_model: String(defaultModel), inverter_phases: "1", inverter_count: "1", battery_topology: "shared",
        battery_power_mode: "legacy", battery_power_x2: false, generator_power_mode: "total",
      };
    }

    static async getConfigElement() {
      if (!customElements.get("ha-form")) await customElements.get("hui-entities-card")?.getConfigElement?.();
      return document.createElement(editorTag);
    }

    static getConfigForm(config) { return configForm(config); }

    constructor() {
      super();
      this.deviceColorScheme = window.matchMedia?.("(prefers-color-scheme: dark)");
      this.onDeviceColorSchemeChange = () => this.updateAppearance();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${styles}</style><ha-card>
        <svg class="screen" data-status="missing" viewBox="0 0 400 268" aria-label="Головний екран Deye">
          <defs>
            <linearGradient id="deye-lcd-arc" gradientUnits="userSpaceOnUse" x1="-43" y1="12" x2="37" y2="20">
              <stop offset="0" stop-color="#3adb36"/><stop offset=".24" stop-color="#26a73b"/>
              <stop offset=".48" stop-color="#6e9133"/><stop offset=".66" stop-color="#a89131"/>
              <stop offset=".83" stop-color="#ca7825"/><stop offset="1" stop-color="#bc3e2b"/>
            </linearGradient>
            ${technikaDefinitions}
            <linearGradient id="deye-t-fill" x1="0" y1="0" x2=".3" y2="1"><stop offset="0"/><stop offset="1"/></linearGradient>
            <linearGradient id="deye-technika-power-light" gradientUnits="userSpaceOnUse" x1="-43" y1="12" x2="37" y2="20">
              <stop offset="0" stop-color="#4cbf2f"/><stop offset=".25" stop-color="#9fcf1f"/><stop offset=".5" stop-color="#ffc20e"/><stop offset=".75" stop-color="#ff8a1a"/><stop offset="1" stop-color="#e5392b"/>
            </linearGradient>
            <linearGradient id="deye-technika-power-dark" gradientUnits="userSpaceOnUse" x1="-43" y1="12" x2="37" y2="20">
              <stop offset="0" stop-color="#5ad13a"/><stop offset=".25" stop-color="#b0dc28"/><stop offset=".5" stop-color="#ffcc1f"/><stop offset=".75" stop-color="#ff9426"/><stop offset="1" stop-color="#ef4a36"/>
            </linearGradient>
            <radialGradient id="deye-technika-gloss" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="45.2">
              <stop offset=".8142" stop-color="#000" stop-opacity=".18"/><stop offset=".8978" stop-color="#fff" stop-opacity="0"/>
              <stop offset=".9628" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
            </radialGradient>
            <clipPath id="deye-bat-clip"><rect x="-18.4" y="-7.4" width="34.8" height="15.8" rx="2.2"/></clipPath>
            <linearGradient id="deye-bat-ok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd64a"/><stop offset=".45" stop-color="#4cbf2f"/><stop offset="1" stop-color="#2f8f1f"/></linearGradient>
            <linearGradient id="deye-bat-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd84a"/><stop offset=".45" stop-color="#ffc20e"/><stop offset="1" stop-color="#c99400"/></linearGradient>
            <linearGradient id="deye-bat-low" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a55"/><stop offset=".45" stop-color="#e5392b"/><stop offset="1" stop-color="#a8231a"/></linearGradient>
            <linearGradient id="deye-classic-power" gradientUnits="userSpaceOnUse" x1="-38" y1="0" x2="38" y2="0">
              <stop offset="0" stop-color="#3ccf4e"/><stop offset=".45" stop-color="#b5e03a"/><stop offset=".65" stop-color="#ffd43b"/><stop offset=".82" stop-color="#ff9a2e"/><stop offset="1" stop-color="#ff3b30"/>
            </linearGradient>
            <linearGradient id="deye-t-shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
            <filter id="deye-t-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.4"/></filter>
            <!-- 0.8.36 · 3D theme: HUD colours and glows. Filter areas are set in user units with a wide margin,
                 so a short arc is never clipped into a square. -->
            <linearGradient id="deye-3d-hud" gradientUnits="userSpaceOnUse" x1="-41" y1="0" x2="41" y2="0">
              <stop offset="0" stop-color="#1fff6a"/><stop offset=".5" stop-color="#ffe01a"/><stop offset="1" stop-color="#ff2d2d"/>
            </linearGradient>
            <filter id="deye-3d-glow" filterUnits="userSpaceOnUse" x="-70" y="-70" width="140" height="140"><feGaussianBlur stdDeviation="1.5"/></filter>
            <filter id="deye-3d-ring-glow" filterUnits="userSpaceOnUse" x="150" y="90" width="104" height="104"><feGaussianBlur stdDeviation="1.6"/></filter>
            <filter id="deye-3d-soft" filterUnits="userSpaceOnUse" x="-400" y="-400" width="1200" height="1100"><feGaussianBlur stdDeviation="1.1"/></filter>
            <radialGradient id="deye-3d-under"><stop offset="0" stop-color="#000" stop-opacity=".48"/><stop offset=".55" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
          </defs>
          <g class="look3d-only scene3d" aria-hidden="true">
            <image class="scene3d-bg" x="0" y="0" width="400" height="268" preserveAspectRatio="xMidYMid slice" data-scene3d/>
            ${poleWires("pole_scene_", sceneGridWires, scenePoint, .7)}
            <g class="scene3d-anim">${smoke3d(...scenePoint(1328, 668).map(n => n.toFixed(1)), false)}</g>
            ${beacon3d(scenePoint(1257, 390), .95)}
          </g>
          <g transform="translate(25 24)" class="appearance-trigger" role="button" tabindex="0" aria-haspopup="dialog" aria-expanded="false" aria-controls="appearance-dialog" ${textAttributes(pair("Card appearance", "Оформлення картки"), "label")} aria-label="Оформлення картки" data-open-appearance>
            <title ${textAttributes(pair("Card appearance", "Оформлення картки"))}>Оформлення картки</title>
            <rect class="hit" x="-22" y="-22" width="44" height="44" rx="6" fill="transparent"/>
            <g class="classic-only" aria-hidden="true">
              <circle class="t-ring-line" r="14.5" fill="none" stroke-width="2.4"/>
              <circle class="t-ring-line t-ring-inner" r="11" fill="none" stroke-width=".8" opacity=".5"/>
              <path class="t-ring-letter" d="M-5.3-5H5.3M0-5V6.6" fill="none" stroke-width="2.8" stroke-linecap="square"/>
            </g>
            <g class="technika-only" aria-hidden="true">
              <circle class="t-update-ring" r="18" fill="none" stroke-width="2"/>
              <circle class="t-glow" r="15" fill="none" stroke-width="2.4" filter="url(#deye-t-glow)"/>
              <circle class="t-fill" r="14.5" fill="url(#deye-t-fill)" stroke-width="1.3"/>
              <circle class="t-inner" r="11" fill="none" stroke-width=".7" opacity=".4"/>
              <path d="M-11-3.5C-9.5-10.5-4.5-12.6 0-12.6S9.5-10.5 11-3.5C5-6-5-6-11-3.5Z" fill="url(#deye-t-shine)"/>
              <path class="t-letter-light" d="M-5.3-5H5.3M0-5V6.6" fill="none" stroke-width="2.8" stroke-linecap="square"/>
            </g>
          </g>
          <g data-clock-tap="">
            <rect x="96" y="4" width="194" height="31" fill="transparent"/>
            <text class="top" x="193" y="25" text-anchor="middle" data-clock="">--/--/---- --:--:--</text>
          </g>
          <text class="top" x="340" y="25" text-anchor="end" data-weekday=""></text>
          <g transform="translate(373 24)" fill="#171b1b" role="button" tabindex="0" aria-label="Налаштування інвертора" ${textAttributes(pair("Inverter settings", "Налаштування інвертора"), "label")} data-gear="">
            <title ${textAttributes(pair("Inverter settings", "Налаштування інвертора"))}>Налаштування інвертора</title>
            <rect class="hit" x="-22" y="-22" width="44" height="44" rx="6" fill-opacity="0"/>
            <g class="classic-only">${gearIcon}</g>
            <g class="technika-only" aria-hidden="true">${technikaGear(false)}${technikaGear(true)}</g>
          </g>
          ${wireLayout.map(wire).join("")}
          <circle class="status" cx="202" cy="142" r="25" fill="${screenWhite}"/>
          <circle class="technika-only status-ring" cx="202" cy="142" r="21.75" fill="none" stroke="#719482" stroke-width=".7" aria-hidden="true"/>
          <g class="look3d-only ring3d" aria-hidden="true">
            <circle class="hud-ring-bg" cx="202" cy="142" r="24"/>
            <circle class="hud-ring-glow" cx="202" cy="142" r="24" filter="url(#deye-3d-ring-glow)"/>
            <circle class="hud-ring" cx="202" cy="142" r="24"/>
          </g>
          <text class="parallel" x="202" y="135" data-parallel=""></text>
          <text class="status-text" x="202" y="148" data-status-label="">—</text>
          <g role="button" tabindex="0" aria-label="Про картку Deye LCD" ${textAttributes(pair("About Deye LCD", "Про картку Deye LCD"), "label")} aria-haspopup="dialog" aria-controls="about-dialog" data-open-about="">
            <title ${textAttributes(pair("About Deye LCD", "Про картку Deye LCD"))}>Про картку Deye LCD</title>
            <circle class="hit" cx="202" cy="142" r="28" fill="transparent"/>
          </g>
          ${gaugeLayout.map(gauge).join("")}
          ${generatorMarkup()}
        </svg>
        ${detailsMarkup()}
        ${settingsMarkup()}
        <div data-about-slot></div>
        <div class="appearance-dialog" id="appearance-dialog" role="dialog" aria-labelledby="appearance-title" hidden></div>
        <div data-clock-slot></div>
      </ha-card>`;
      const select = (selector) => this.shadowRoot.querySelector(selector);
      this.screen = select(".screen");
      this.appearanceDialog = select("#appearance-dialog");
      this.appearanceTrigger = select("[data-open-appearance]");
      this.haCard = select("ha-card");
      onActivate(this.appearanceTrigger, () => this.appearanceDialog.hidden ? this.openAppearance() : this.closeAppearance(true));
      this.appearanceDialog.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        this.closeAppearance(true);
      });
      this.appearanceDialog.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (button?.dataset.workshopOpen !== undefined) { this.workshopView = "list"; this.renderAppearance(); this.appearanceDialog.querySelector("[data-workshop-back]")?.focus({ preventScroll:true }); return; }
        if (button?.dataset.workshopBack !== undefined) {
          this.workshopView = this.workshopView === "list" ? null : "list";
          this.renderAppearance();
          this.appearanceDialog.querySelector(this.workshopView ? "[data-workshop-back]" : "[data-workshop-open]")?.focus({ preventScroll:true });
          return;
        }
        if (button?.dataset.workshopSponsor) { this.workshopView = button.dataset.workshopSponsor; this.renderAppearance(); this.appearanceDialog.querySelector("[data-workshop-back]")?.focus({ preventScroll:true }); return; }
        if (button?.dataset.workshopOption) {
          const id = button.dataset.workshopOption, enabled = storedWorkshop();
          if (enabled[id] === true) delete enabled[id]; else enabled[id] = true;
          try { localStorage.setItem(workshopKey, JSON.stringify(enabled)); } catch { /* this page only */ }
          this.applyWorkshop();
          this.renderAppearance();
          this.appearanceDialog.querySelector(`[data-workshop-option="${CSS.escape(id)}"]`)?.focus({ preventScroll:true });
          return;
        }
        if (button?.dataset.frameToggle) {
          storeFrame(button.dataset.frameToggle);
          this.appearanceDialog.querySelector(`[data-frame-toggle="${button.dataset.frameToggle}"]`)?.focus({ preventScroll:true });
        }
        else if (button?.dataset.updateDismiss !== undefined) {
          try { localStorage.setItem(updateDismissKey, this.latestRelease?.version ?? ""); } catch { /* shown again next time */ }
          this.refreshUpdateMark();
          this.renderAppearance();
          this.appearanceDialog.querySelector('[aria-pressed="true"]')?.focus({ preventScroll:true });
        }
        else if (button?.dataset.language) { storeLanguage(button.dataset.language); this.renderAppearance(); this.appearanceDialog.querySelector(`[data-language="${button.dataset.language}"]`)?.focus({ preventScroll:true }); }
        else if (button?.dataset.visualKey === "lcd_appearance" && button.dataset.visualValue === "auto") this.cycleAutoAppearance();
        else if (button?.dataset.visualKey) this.setVisualPreference(button.dataset.visualKey, button.dataset.visualValue);
        else if (button?.dataset.visualReset !== undefined) this.resetVisualPreferences();
      });
      // Compact panel: a tap anywhere outside it (or on the «Т» button again) closes it.
      this.onOutsidePointer = event => {
        const path = event.composedPath();
        if (!path.includes(this.appearanceDialog) && !path.includes(this.appearanceTrigger)) this.closeAppearance(false);
      };
      this.clock = select("[data-clock]");
      this.weekday = select("[data-weekday]");
      this.statusSurface = select(".status");
      this.statusLabel = select("[data-status-label]");
      this.socLabel = select("[data-soc]");
      this.batTime = select("[data-bat-time]");
      this.batTimeText = select("[data-bat-time-text]");
      this.socLeft = select("[data-soc-left]");
      this.socRight = select("[data-soc-right]");
      this.parallelLabel = select("[data-parallel]");
      this.generatorGroup = select("[data-generator]");
      this.generatorPower = select("[data-generator-power]");
      onActivate(this.generatorGroup, () => this.openDetails("generator_power"));
      this.detailsScreen = select(".details-screen");
      this.detailsTitle = select("#details-title");
      this.detailsBody = select("[data-details-body]");
      this.detailsBody.addEventListener("click", event => {
        const button = event.target.closest("[data-gact]");
        if (!button || !this.detailsKey) return;
        const page = button.dataset.gact === "sub" ? "sub" : button.dataset.gact === "chart" ? "chart" : null;
        if (!page) return;
        this.detailsPage = page;
        this.updateDetails();
        if (page === "chart") {
          if (this.detailsData) this.renderDetailsHistory();
          else this.loadDetailsHistory();
        }
        this.detailsTitle.focus({ preventScroll: true });
      });
      this.historySection = select(".details-history");
      this.historyHeading = select("#details-history-title");
      this.historyToggle = select("[data-history-toggle]");
      this.historyToggle.addEventListener("click", () => this.setDetailsSplit(!this.detailsSplit));
      this.historyMonth = select("[data-history-month]");
      this.historyReset = select("[data-history-reset]");
      this.historyMonth.addEventListener("click", () => {
        this.historyMode = this.historyMode === "month" ? "day" : "month";
        this.chartView = null;
        this.updateDetails();
        this.loadDetailsHistory();
      });
      this.historyReset.addEventListener("click", () => this.setChartView(null));
      this.attachChartZoom(select(".history-chart"));
      this.historyMessage = select(".history-message");
      this.historyChart = select(".history-chart");
      this.detailsKey = null;
      this.detailsPage = "main";
      this.historyRequest = 0;
      select(".details-back").addEventListener("click", () => this.backFromDetails());
      this.detailsScreen.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        this.backFromDetails();
      });
      this.settingsScreen = select(".settings");
      this.settingsScreen.addEventListener("click", event => {
        if (event.target.closest("[data-unbound-close]")) { this.closeUnboundHelp(); return; }
        const unbound = event.target.closest(".lcd-setting[data-unbound]");
        if (unbound) { event.preventDefault(); event.stopPropagation(); this.showUnboundHelp(unbound); return; }
        if (!event.target.closest(".unbound-pop")) this.closeUnboundHelp();
      }, true);
      this.settingsTitle = select("#settings-title");
      this.settingsHome = select(".settings-home");
      this.settingsMenu = select(".settings-menu");
      this.settingsBody = select(".settings-body");
      this.settingsMain = select(".settings-main");
      this.settingsPanels = new Map();
      this.settingsMenuId = null;
      this.settingsPage = 0;
      this.settingsSession = 0;
      this.settingsDrafts = new Map();
      this.pendingSettings = new Map();
      this.settingsNotice = "";
      this.savingSettings = false;
      this.settingsPageName = select("[data-settings-page-name]");
      this.settingsPrevious = select('[data-settings-button="up"]');
      this.settingsNext = select('[data-settings-button="down"]');
      this.settingsApply = select('[data-settings-button="apply"]');
      this.gear = select("[data-gear]");
      this.viewOnlyLabel = select("[data-view-only]");
      this.readOnlyMenuLabel = select("[data-read-only-menu]");
      this.applyConfirm = select(".apply-confirm");
      this.applyList = select("[data-apply-list]");
      this.applyConfirm.addEventListener("keydown", event => { if (event.key === "Escape") event.stopPropagation(); });
      select("[data-apply-cancel]").addEventListener("click", () => this.applyConfirm.close());
      select("[data-apply-go]").addEventListener("click", () => {
        this.applyConfirm.close();
        this.applySettings(true);
      });
      this.applyConfirm.addEventListener("close", () => {
        if (!this.settingsScreen.hidden) this.settingsApply.focus({ preventScroll: true });
      });
      this.noSettingsLabel = select("[data-no-settings]");
      this.settingsMessage = select("[data-settings-message]");
      this.numericPanel = select("[data-numeric-panel]");
      this.numericTitle = select("#numeric-title");
      this.numericInput = this.numericPanel.querySelector("input");
      this.numericUnit = select("[data-numeric-unit]");
      this.numericStep = select("[data-numeric-step]");
      this.numericMinus = select("[data-numeric-minus]");
      this.numericPlus = select("[data-numeric-plus]");
      this.numericInput.addEventListener("input", () => {
        if (this.activeNumeric) this.stageSetting(this.activeNumeric.view, this.numericInput.value);
      });
      this.numericInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.numericInput.blur();
        }
      });
      this.numericMinus.addEventListener("click", () => this.nudgeSetting(this.activeNumeric?.view, -1));
      this.numericPlus.addEventListener("click", () => this.nudgeSetting(this.activeNumeric?.view, 1));
      select("[data-numeric-close]").addEventListener("click", () => {
        this.clearNumeric();
        this.settingsTitle.focus({ preventScroll: true });
      });
      onActivate(this.gear, () => this.openSettings());
      const aboutButton = select("[data-open-about]");
      if (aboutButton) onActivate(aboutButton, () => this.openAbout("about-dialog", aboutButton));
      this.clockSlot = select("[data-clock-slot]");
      this.aboutSlot = select("[data-about-slot]");
      let firstTap = -Infinity;
      let tapCount = 0;
      select("[data-clock-tap]").addEventListener("click", () => {
        const now = performance.now();
        if (now - firstTap > 2500) {
          firstTap = now;
          tapCount = 0;
        }
        if (++tapCount === 5) {
          tapCount = 0;
          firstTap = -Infinity;
          if (!this.clockSlot.querySelector("dialog")) this.clockSlot.innerHTML = clockPanelMarkup(this.config);
          this.openAbout("about-signature");
        }
      });
      for (const { id, pages } of settingsMenus) {
        select(`[data-settings-menu="${id}"]`).addEventListener("click", () => this.goToSettingsPage(id, 0));
        for (let index = 0; index < (pages?.length ?? 1); index++) {
          const key = `${id}:${index}`;
          const element = select(`[data-settings-page="${key}"]`);
          const fields = new Map();
          for (const setting of element.querySelectorAll("[data-setting]")) {
            const name = setting.dataset.setting;
            const view = {
              name, element: setting, input: setting.querySelector("input"), select: setting.querySelector("select"),
              unit: setting.querySelector(".lcd-unit"), steppers: [...setting.querySelectorAll("[data-local-step]")],
            };
            if (!fields.has(name)) fields.set(name, []);
            fields.get(name).push(view);
            view.input.addEventListener("input", () => this.stageSetting(view));
            if (view.input.type === "text") {
              view.input.addEventListener("focus", () => this.openNumeric(view));
              view.input.addEventListener("click", () => this.openNumeric(view));
              view.input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  view.input.blur();
                }
              });
            }
            view.select?.addEventListener("change", () => this.stageSetting(view, view.select.value));
            for (const button of view.steppers) {
              button.addEventListener("click", () => this.nudgeSetting(view, Number(button.dataset.localStep)));
            }
          }
          this.settingsPanels.set(key, { element, fields, readouts: element.querySelectorAll("[data-readout]") });
        }
      }
      select("[data-back-to-screen]").addEventListener("click", () => this.closeSettings());
      this.settingsPrevious.addEventListener("click", () => this.goToSettingsPage(this.settingsMenuId, this.settingsPage - 1));
      this.settingsNext.addEventListener("click", () => this.goToSettingsPage(this.settingsMenuId, this.settingsPage + 1));
      select('[data-settings-button="cancel"]').addEventListener("click", () => this.backFromSettings());
      this.settingsBody.addEventListener("submit", (event) => {
        event.preventDefault();
        this.applySettings();
      });
      this.settingsScreen.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        if (this.activeNumeric) {
          this.clearNumeric();
          this.settingsTitle.focus({ preventScroll: true });
        } else this.backFromSettings();
      });
      this.wires = Object.fromEntries([...wireLayout.map(({ name }) => name), ...poleWireNames].map(name => [name, select(`[data-wire="${name}"]`)]));
      this.gauges = Object.fromEntries(gaugeLayout.map(({ key }) => {
        const element = select(`[data-gauge="${key}"]`);
        onActivate(element, () => this.openDetails(key));
        return [key, { element, value: element.querySelector(".value"), fill: element.querySelector(".fill"), gloss: element.querySelector(".fill-gloss"), maximum: element.querySelector("[data-scale]") }];
      }));
    }

    setConfig(config, preferred = false) {
      if (!preferred) this.sourceConfig = config;
      const bindingsChanged = settingFields.some(([name]) => this.config?.[name] !== config[name]);
      const gauge = gaugeByKey[this.detailsKey];
      const historyChanged = gauge && (JSON.stringify(powerSources(this.config, gauge)) !== JSON.stringify(powerSources(config, gauge)) || (gauge.source === "battery" && this.config?.battery_power_x2 !== config.battery_power_x2));
      const languageChanged = this.config?.language !== config.language || !this.config;
      this.config = { ...config };
      this.inverterCount = inverterCount(config);
      if (languageChanged) {
        this.clockSlot.querySelector("dialog")?.close();
        this.clockSlot.innerHTML = "";
        this.localize();
      }
      this.loadVisualPreferences();
      // The language chosen with the flags or in the editor wins over the card setting, in this browser; Ukrainian by default.
      const language = storedLanguage() ?? (config.language === "en" ? "en" : "uk");
      if (language !== config.language) { this.setConfig({ ...config, language }, true); return; }
      const look = this.visualConfig().lcd_theme;
      const technika = look === "technika" || look === "3d";
      this.dataset.theme = technika ? "technika" : "classic";
      // 3D is built on ТЕХНіКА (menus, flows, palette) and swaps the main-screen gauges for pictures.
      if (look === "3d" && !this.missing3dFiles) this.dataset.look = "3d"; else delete this.dataset.look;
      this.dataset.motion = this.visualConfig().lcd_motion === "off" ? "off" : "on";
      this.dataset.scene = this.visualConfig().lcd_scene3d === "separate" ? "separate" : "scene";
      this.applyWorkshop();
      this.dataset.palette = this.visualConfig().lcd_palette === "graphite" ? "graphite" : "olive";
      this.dataset.frame = storedFrame();
      this.updateAppearance(true);
      this.update3d(true);
      this.statusSurface.setAttribute("fill", technika ? "url(#deye-technika-status)" : screenWhite);
      this.scale = installedInverters(config).reduce((total, index) =>
        total + readModel(config[inverterField(index, "inverter_model")], this.inverterCount > 1), 0);
      this.screen.setAttribute("aria-label", this.t(`Deye main screen · ${this.scale} kW`, `Головний екран Deye · ${this.scale} кВт`));
      const secondBattery = config.battery_soc_2 || measurementFields.some(({ key }) => config[`battery_2_${key}`]);
      // Two battery icons only when a second battery is really bound, whatever the inverter size.
      this.screen.dataset.battery = this.inverterCount === 1 && secondBattery ? "dual" : "single";
      const parallelId = typeof config.parallel_id === "string" ? config.parallel_id.trim().slice(0, 6) : "";
      this.parallelLabel.textContent = parallelId;
      this.statusLabel.setAttribute("y", parallelId ? "156" : "148");
      for (const { maximum, fill } of Object.values(this.gauges)) {
        maximum.textContent = this.scale.toFixed(1);
        // Both themes draw the fill as a stroke along the same arc as the track, so it starts exactly where the scale starts.
        fill.setAttribute("fill", "none");
        fill.setAttribute("stroke", technika ? "url(#deye-technika-power)" : "url(#deye-lcd-arc)");
      }
      if (bindingsChanged) {
        this.settingsSession++;
        this.lastTimeOfUse = null;
        this.clearSettingDrafts();
        this.clearPendingSettings();
      }
      this.update();
      if (historyChanged) {
        if (powerSources(config, gauge).length === 1) this.detailsSplit = false;
        this.loadDetailsHistory();
        this.updateDetails();
      } else if (languageChanged && this.detailsData) this.renderDetailsHistory();
    }

    watchedEntities() {
      if (this.watchedConfig === this.config && this.watchedIds) return this.watchedIds;
      const ids = new Set(["sun.sun"]);
      for (const value of Object.values(this.config ?? {})) {
        if (typeof value === "string" && /^[a-z_]+\.[a-z0-9_]+$/.test(value)) ids.add(value);
      }
      this.watchedConfig = this.config;
      this.watchedIds = [...ids];
      return this.watchedIds;
    }

    relevantChange(previous, next) {
      if (!previous || !next || previous.config?.time_zone !== next.config?.time_zone) return true;
      if (previous.themes?.darkMode !== next.themes?.darkMode) return true;
      if (previous.states?.["sun.sun"]?.state !== next.states?.["sun.sun"]?.state) return true;
      const before = previous.states ?? {}, after = next.states ?? {};
      // Home Assistant replaces a state object when it changes, so identity is enough.
      return this.watchedEntities().some(id => before[id] !== after[id]);
    }

    set hass(hass) {
      const historyConnected = typeof this.hassData?.callWS !== "function" && typeof hass?.callWS === "function";
      const previousUser = this.hassData?.user?.id;
      const previous = this.hassData;
      this.hassData = hass;
      if (previousUser !== hass?.user?.id && this.config) this.setConfig(this.config);
      else if (!this.relevantChange(previous, hass)) {
        // History may become reachable without any watched state changing.
        if (historyConnected && this.detailsKey) this.loadDetailsHistory();
        return;
      }
      this.updateAppearance();
      this.update();
      if (historyConnected && this.detailsKey) this.loadDetailsHistory();
    }

    connectedCallback() {
      this.deviceColorScheme?.addEventListener?.("change", this.onDeviceColorSchemeChange);
      this.updateAppearance();
      this.updateClock();
      clearInterval(this.timer);
      this.timer = setInterval(() => this.updateClock(), 1000);
      this.onLanguage ??= () => { if (this.sourceConfig) this.setConfig(this.sourceConfig); };
      window.addEventListener(languageEvent, this.onLanguage);
      this.onFrame ??= () => { this.dataset.frame = storedFrame(); if (!this.appearanceDialog.hidden) this.renderAppearance(); };
      this.onFrameStorage ??= (event) => { if (event.key === frameKey) this.onFrame(); };
      window.addEventListener(frameEvent, this.onFrame);
      window.addEventListener("storage", this.onFrameStorage);
      this.syncFlowEngine();
      this.checkForUpdate();
      clearInterval(this.releaseTimer);
      this.releaseTimer = setInterval(() => this.checkForUpdate(), releaseInterval);
    }

    disconnectedCallback() {
      this.deviceColorScheme?.removeEventListener?.("change", this.onDeviceColorSchemeChange);
      clearInterval(this.timer);
      if (this.flowFrame) cancelAnimationFrame(this.flowFrame);
      this.flowFrame = 0;
      if (this.onLanguage) window.removeEventListener(languageEvent, this.onLanguage);
      if (this.onFrame) window.removeEventListener(frameEvent, this.onFrame);
      if (this.onFrameStorage) window.removeEventListener("storage", this.onFrameStorage);
      clearInterval(this.releaseTimer);
      this.closeDetails();
      this.closeSettings();
      this.closeAppearance(false);
      for (const dialog of this.shadowRoot.querySelectorAll("dialog")) {
        if (dialog.open) dialog.close();
      }
      this.clearPendingSettings();
    }

    updateAppearance(themeChanged = false) {
      const { lcd_appearance: mode, lcd_auto_source: source } = this.visualConfig();
      const appearance = manualAppearances.includes(mode)
        ? mode : this.automaticAppearance(source);
      if (!themeChanged && appearance === this.dataset.appearance) return;
      this.dataset.appearance = appearance;
      const technika = this.dataset.theme === "technika";
      if (technika) {
        this.screen.querySelector(".status-ring").setAttribute("filter", `url(#deye-technika-ring-${appearance})`);
      }
    }

    automaticAppearance(source) {
      if (source === "sun") {
        const sun = this.hassData?.states?.["sun.sun"]?.state;
        if (sun === "above_horizon") return "light";
        if (sun === "below_horizon") return "dark";
      }
      const deviceDark = this.deviceColorScheme?.matches;
      const reportedMode = this.hassData?.themes?.darkMode;
      const haDark = typeof reportedMode === "boolean" ? reportedMode : undefined;
      const dark = source === "device" ? deviceDark ?? haDark : haDark ?? deviceDark;
      return dark === true ? "dark" : "light";
    }

    getCardSize() { return 5; }
    getGridOptions() { return { columns: 12, min_columns: 6 }; }

    visualConfig() {
      const base = { lcd_motion:"on", lcd_scene3d:"scene", ...DeyeLcd.getStubConfig(), ...this.config, ...this.visualPreferences };
      // The editor preview always shows КЛАСіК, light or black after Home Assistant.
      return this.editorPreview ? { ...base, lcd_theme:"classic", lcd_appearance:"auto", lcd_auto_source:"ha" } : base;
    }

    visualKey(identity) {
      let hash = 2166136261;
      for (const char of JSON.stringify(identity)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
      return "deye-lcd:appearance:" + (hash >>> 0).toString(16);
    }

    loadVisualPreferences() {
      // The key no longer depends on the bound entities, so editing bindings keeps the chosen look.
      const user = this.hassData?.user?.id ?? "";
      const key = this.visualKey(["v2", location.pathname, this.config?.lcd_ui_key ?? "", user]);
      if (this.visualStorageKey === key) return;
      this.visualStorageKey = key;
      this.visualPreferences = {};
      try {
        let raw = localStorage.getItem(key);
        if (raw === null) {
          // One-time migration from 0.8.11, whose key was built from the entity list.
          const entities = Object.entries(this.config ?? {}).filter(([, value]) =>
            typeof value === "string" && /^(sensor|binary_sensor)\./.test(value)).sort(([a], [b]) => a.localeCompare(b));
          raw = localStorage.getItem(this.visualKey([location.pathname, this.config?.lcd_ui_key ?? entities, user]));
          if (raw !== null) localStorage.setItem(key, raw);
        }
        const saved = JSON.parse(raw || "{}");
        for (const [name, values] of Object.entries(visualValues)) if (values.includes(saved?.[name])) this.visualPreferences[name] = saved[name];
      } catch { /* An unavailable browser store must not prevent the card from loading. */ }
    }

    setVisualPreference(key, value) {
      if (!visualValues[key]?.includes(value)) return;
      this.visualPreferences = { ...this.visualPreferences, [key]:value };
      this.saveVisualPreferences();
    }

    resetVisualPreferences() {
      this.visualPreferences = { lcd_theme:"classic", lcd_palette:"olive", lcd_appearance:"auto", lcd_auto_source:"ha", lcd_particles:"dot", lcd_motion:"on", lcd_scene3d:"scene" };
      this.saveVisualPreferences();
    }

    checkForUpdate() {
      if (this.editorPreview) return;
      let cached = null;
      try { cached = JSON.parse(localStorage.getItem(releaseKey) || "null"); } catch { cached = null; }
      if (cached && Date.now() - cached.at < releaseInterval) {
        this.latestRelease = cached.version ? cached : null;
        this.refreshUpdateMark();
        return;
      }
      if (this.releaseRequest || typeof fetch !== "function") return;
      // Quietly skipped when GitHub cannot be reached; the next attempt comes with the next interval.
      this.releaseRequest = fetch(releaseUrl, { headers:{ Accept:"application/vnd.github+json" } })
        .then(response => response.ok ? response.json() : null)
        .then(json => {
          const info = { at:Date.now(), version:json?.tag_name ? String(json.tag_name).replace(/^v/i, "") : null, url:json?.html_url ?? "" };
          try { localStorage.setItem(releaseKey, JSON.stringify(info)); } catch { /* checked again next time */ }
          this.latestRelease = info.version ? info : null;
          this.refreshUpdateMark();
        })
        .catch(() => {})
        .finally(() => { this.releaseRequest = null; });
    }

    updateAvailable() {
      if (!this.latestRelease?.version || !newerVersion(this.latestRelease.version, currentVersion)) return false;
      try { return localStorage.getItem(updateDismissKey) !== this.latestRelease.version; } catch { return true; }
    }

    refreshUpdateMark() {
      this.toggleAttribute("data-update", this.updateAvailable());
    }

    cycleAutoAppearance() {
      // First tap turns «Авто» on; each next tap moves to the next source: HA theme → sun → device.
      const sources = visualValues.lcd_auto_source;
      const config = this.visualConfig();
      const next = config.lcd_appearance !== "auto" ? config.lcd_auto_source
        : sources[(sources.indexOf(config.lcd_auto_source) + 1) % sources.length];
      this.visualPreferences = { ...this.visualPreferences, lcd_appearance:"auto", lcd_auto_source:next };
      this.saveVisualPreferences();
      const hint = this.appearanceDialog.querySelector("[data-auto-hint]");
      if (!hint) return;
      clearTimeout(this.autoHintTimer);
      requestAnimationFrame(() => hint.toggleAttribute("data-show", true));
      this.autoHintTimer = setTimeout(() => hint.removeAttribute("data-show"), 1900);
    }

    saveVisualPreferences() {
      let stored = true;
      try { localStorage.setItem(this.visualStorageKey, JSON.stringify(this.visualPreferences)); }
      catch { stored = false; }
      // Reuse setConfig so paths, icons, menus and graphs all get the same theme immediately.
      this.setConfig(this.sourceConfig ?? this.config);
      const focused = this.shadowRoot.activeElement;
      const selector = focused?.dataset.visualKey ? `[data-visual-key="${focused.dataset.visualKey}"][data-visual-value="${focused.dataset.visualValue}"]`
        : "[data-visual-reset]";
      this.renderAppearance();
      this.appearanceDialog.querySelector(selector)?.focus({ preventScroll:true });
      const status = this.appearanceDialog.querySelector("[data-visual-status]");
      if (status) status.textContent = stored ? this.t("Saved in this browser.", "Збережено в цьому браузері.")
        : this.t("Applied for this session. Browser storage is unavailable.", "Застосовано на цей сеанс. Сховище браузера недоступне.");
    }

    workshopMarkup() {
      const t = this.t.bind(this), english = preferEnglish(this.config);
      const text = (value) => escapeHtml(english ? value?.en ?? value?.uk ?? "" : value?.uk ?? value?.en ?? "");
      const enabled = storedWorkshop();
      const sponsor = workshop.find(entry => entry.id === this.workshopView);
      const head = (title) => `<div class="ws-head"><button type="button" class="ws-back" data-workshop-back aria-label="${t("Back", "Назад")}">‹</button><h3>${escapeHtml(title)}</h3></div>`;
      if (sponsor) return `${head(sponsor.name)}<div class="ws-list">${sponsor.options.map(option => `<button type="button" class="ws-option" data-workshop-option="${escapeHtml(option.id)}" role="switch" aria-checked="${enabled[option.id] === true}">
          <span><b>${text(option.label)}</b>${option.note ? `<small>${text(option.note)}</small>` : ""}</span><i aria-hidden="true"></i></button>`).join("")}</div>`;
      return `${head(t("Workshop", "Майстерня"))}<p class="ws-intro">${t("Personal options made for the card's sponsors. Everything here is off by default.", "Персональні опції, зроблені для спонсорів картки. Усе тут вимкнено за замовчуванням.")}</p>
        <div class="ws-list">${workshop.length ? workshop.map(entry => {
          const count = entry.options.filter(option => enabled[option.id] === true).length;
          return `<button type="button" class="ws-sponsor" data-workshop-sponsor="${escapeHtml(entry.id)}"><b>${escapeHtml(entry.name)}</b><small>${count ? t(`${count} on`, `увімк.: ${count}`) : t(`${entry.options.length} options`, `опцій: ${entry.options.length}`)}</small><span aria-hidden="true">›</span></button>`;
        }).join("") : `<p class="ws-empty">${t("Nothing here yet.", "Поки що порожньо.")}</p>`}</div>`;
    }

    applyWorkshop() {
      const enabled = storedWorkshop();
      const ids = [...workshopOptionIds].filter(id => enabled[id] === true);
      if (ids.length) this.dataset.workshop = ids.join(" "); else delete this.dataset.workshop;
    }

    openAppearance() {
      if (!this.isConnected || !this.config || !this.appearanceDialog.hidden) return;
      this.workshopView = null;
      this.renderAppearance();
      const card = this.haCard.getBoundingClientRect();
      const trigger = this.appearanceTrigger.getBoundingClientRect();
      this.appearanceDialog.style.left = `${Math.max(8, trigger.left - card.left)}px`;
      this.appearanceDialog.style.top = `${trigger.bottom - card.top + 6}px`;
      this.haCard.setAttribute("data-pop-open", "");
      this.appearanceDialog.hidden = false;
      this.appearanceTrigger.setAttribute("aria-expanded", "true");
      document.addEventListener("pointerdown", this.onOutsidePointer, true);
      this.appearanceDialog.querySelector('[aria-pressed="true"]')?.focus({ preventScroll:true });
    }

    closeAppearance(returnFocus) {
      if (this.appearanceDialog.hidden) return;
      this.appearanceDialog.hidden = true;
      this.haCard.removeAttribute("data-pop-open");
      this.appearanceTrigger.setAttribute("aria-expanded", "false");
      document.removeEventListener("pointerdown", this.onOutsidePointer, true);
      if (returnFocus && this.isConnected) this.appearanceTrigger.focus({ preventScroll:true });
    }

    renderAppearance() {
      const config = this.visualConfig(), t = this.t.bind(this);
      const icon = {
        light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
        dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
        auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
      };
      const button = (key, value, text, extra = "") =>
        `<button type="button" data-visual-key="${key}" data-visual-value="${value}" aria-pressed="${config[key] === value}"${extra}>${text}</button>`;
      const row = (id, label, content) => `<span class="ap-label" id="ap-${id}">${label}</span><div class="ap-seg" role="group" aria-labelledby="ap-${id}">${content}</div>`;
      const technika = config.lcd_theme === "technika" || config.lcd_theme === "3d";
      const auto = !manualAppearances.includes(config.lcd_appearance);
      const palette = config.lcd_palette === "graphite" ? t("Graphite", "Графіт") : t("Olive", "Олива");
      const sources = visualValues.lcd_auto_source;
      const sourceName = { ha:t("by HA theme", "за темою HA"), sun:t("by the sun", "за сонцем"), device:t("by device", "за пристроєм") }[config.lcd_auto_source] ?? "";
      const dots = `<span class="ap-dots" aria-hidden="true">${sources.map(source => `<i${source === config.lcd_auto_source ? " data-current" : ""}></i>`).join("")}</span>`;
      const flag = (value, label, art) => `<button type="button" class="ap-flag" data-language="${value}" aria-pressed="${(config.language === "en" ? "en" : "uk") === value}" aria-label="${label}" title="${label}">${art}</button>`;
      const ukraine = '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="3" height="1" fill="#0057b7"/><rect y="1" width="3" height="1" fill="#ffd700"/></svg>';
      const britain = '<svg viewBox="0 0 60 30" aria-hidden="true"><path d="M0 0h60v30H0z" fill="#012169"/><path d="M0 0l60 30M60 0L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30M60 0L0 30" stroke="#c8102e" stroke-width="2.4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#c8102e" stroke-width="6"/></svg>';
      // Common options first; options that only the ТЕХНіКА theme has always go below them.
      const latest = this.updateAvailable() ? this.latestRelease : null;
      if (this.workshopView) { this.appearanceDialog.innerHTML = this.workshopMarkup(); return; }
      this.appearanceDialog.innerHTML = `<h2 id="appearance-title" class="sr-only">${t("Card appearance", "Оформлення картки")}</h2>
        ${latest ? `<div class="ap-update" role="status"><div><b>${t(`Version ${escapeHtml(latest.version)} is out`, `Вийшла версія ${escapeHtml(latest.version)}`)}</b>
          <p>${t(`You have ${currentVersion}. Update in HACS → Deye · LCD ТЕХНіКА.`, `У вас ${currentVersion}. Оновіть у HACS → Deye · LCD ТЕХНіКА.`)}</p>
          ${latest.url ? `<a href="${escapeHtml(latest.url)}" target="_blank" rel="noopener noreferrer">${t("What’s new ↗", "Що нового ↗")}</a>` : ""}</div>
          <button type="button" data-update-dismiss aria-label="${t("Hide until the next version", "Сховати до наступної версії")}" title="${t("Hide until the next version", "Сховати до наступної версії")}">×</button></div>` : ""}
        <div class="ap-grid">
          ${row("theme", t("Theme", "Тема"), button("lcd_theme", "classic", "КЛАСіК") + button("lcd_theme", "technika", "ТЕХНіКА") + button("lcd_theme", "3d", "3D"))}
          ${config.lcd_theme === "3d" && this.missing3dFiles ? `<p class="ap-note" role="status">${t("3D pictures were not found next to the card, so the usual gauges are shown. Update the card in the Marketplace (HACS) and reload the page.", "Картинки 3D не знайдено поруч із карткою, тому показано звичайні шкали. Оновіть картку в Магазині (HACS) і перезавантажте сторінку.")}</p>` : ""}
          ${config.lcd_theme === "3d" && !this.missing3dFiles ? row("scene3d", t("3D view", "Режим 3D"), button("lcd_scene3d", "scene", t("Scene", "Сцена")) + button("lcd_scene3d", "separate", t("Separate", "Окремо"))) : ""}
          ${config.lcd_theme === "3d" && !this.missing3dFiles ? row("motion", t("Animation", "Анімація"), button("lcd_motion", "on", t("On", "Увімк.")) + button("lcd_motion", "off", t("Off", "Вимк."))) : ""}
          <span class="ap-label" id="ap-mode">${t("Look", "Вигляд")}</span>
          <div class="ap-seg ap-look" role="group" aria-labelledby="ap-mode">
            ${button("lcd_appearance", "auto", `<span class="ap-auto">${icon.auto}<span>${t("Auto", "Авто")}</span></span>${dots}`, ` aria-label="${t("Auto", "Авто")} · ${sourceName}" title="${sourceName}"`)}
            ${button("lcd_appearance", "light", icon.light, ` aria-label="${t("Light", "Світле")}"`)}
            ${button("lcd_appearance", "dark", icon.dark, ` aria-label="${t("Dark", "Темне")}"`)}
            <span class="ap-hint" data-auto-hint role="status">${auto ? sourceName : ""}</span>
          </div>
          ${technika ? `<span class="ap-label" id="ap-palette">${t("Palette", "Палітра")}</span>
            <div class="ap-swatches" role="group" aria-labelledby="ap-palette">
              ${button("lcd_palette", "olive", "", ` aria-label="${t("Olive", "Олива")}"`)}${button("lcd_palette", "graphite", "", ` aria-label="${t("Graphite", "Графіт")}"`)}
              <span>${palette}</span>
            </div>
            ${row("particles", t("Flow", "Потоки"),
              button("lcd_particles", "dot", t("Dot", "Крапка")) + button("lcd_particles", "glow", t("Glow", "Світло")) + button("lcd_particles", "packet", t("Packet", "Пакет")))}
            ${row("frame", t("Frame", "Рамка"),
              `<button type="button" data-frame-toggle="on" aria-pressed="${storedFrame() === "on"}">${t("On", "Увімк.")}</button>` +
              `<button type="button" data-frame-toggle="off" aria-pressed="${storedFrame() === "off"}">${t("Off", "Вимк.")}</button>`)}` : ""}
        </div>
        <button type="button" class="ap-workshop" data-workshop-open aria-haspopup="true">
          <span class="ap-workshop-t" aria-hidden="true">T</span><span>${t("Workshop", "Майстерня")}</span></button>
        <div class="ap-footer">
          <div class="ap-flags" role="group" aria-label="${t("Language", "Мова")}">${flag("uk", "Українська", ukraine)}${flag("en", "English", britain)}</div>
          <span class="ap-version">v${currentVersion}</span>
          <button type="button" data-visual-reset>${t("Reset", "Скинути")}</button>
        </div>`;
    }

    openAbout(id, opener) {
      if (id === "about-dialog" && !this.aboutSlot.querySelector("dialog")) {
        // Built on first open so the video covers are not kept in every card's page until needed.
        this.aboutSlot.innerHTML = aboutMarkup();
        this.localizeIn(this.aboutSlot);
      }
      const dialog = this.shadowRoot.getElementById(id);
      if (!this.isConnected || !dialog || dialog.open) return;
      opener?.focus();
      dialog.showModal();
    }

    updateClock() {
      const zone = this.hassData?.config?.time_zone;
      if (!this.clockFormatter || zone !== this.clockZone) {
        this.clockZone = zone;
        const options = {
          weekday: "short", month: "2-digit", day: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
        };
        this.clockFormatter = dateFormatter("en-US", options, zone);
      }
      const parts = Object.fromEntries(this.clockFormatter.formatToParts(new Date()).map(({ type, value }) => [type, value]));
      this.clock.textContent = `${parts.month}/${parts.day}/${parts.year}  ${parts.hour}:${parts.minute}:${parts.second}`;
      this.weekday.textContent = this.t(parts.weekday, weekdays[parts.weekday]);
      this.weekday.setAttribute("lang", this.t("en", "uk"));
    }

    openDetails(key) {
      if (!this.config || !this.settingsScreen.hidden) return;
      const gauge = gaugeByKey[key];
      if (!gauge) return;
      this.detailsKey = key;
      this.detailsPage = "main";
      this.detailsHtml = "";
      this.detailsSplit = false;
      this.detailsData = null;
      this.historyMode = "day";
      this.chartView = null;
      this.detailsScreen.dataset.source = gauge.source;
      this.screen.setAttribute("hidden", "");
      this.detailsScreen.hidden = false;
      this.updateDetails();
      this.detailsTitle.focus({ preventScroll: true });
      this.loadDetailsHistory();
    }

    backFromDetails() {
      if (this.detailsPage && this.detailsPage !== "main") {
        this.detailsPage = "main";
        this.updateDetails();
        this.detailsTitle.focus({ preventScroll: true });
      } else this.closeDetails();
    }

    closeDetails() {
      if (!this.detailsKey) return;
      const opener = this.gauges[this.detailsKey]?.element ?? this.generatorGroup;
      this.detailsKey = null;
      this.detailsData = null;
      this.detailsSplit = false;
      this.historyRequest++;
      this.detailsScreen.hidden = true;
      this.screen.removeAttribute("hidden");
      if (this.isConnected && !opener.hasAttribute("hidden")) opener.focus({ preventScroll: true });
    }

    setDetailsSplit(split) {
      this.detailsSplit = split;
      this.updateDetails();
      if (this.detailsData) this.renderDetailsHistory();
    }

    batteryCapacity(states) { return batteryCapacityOf(this.config, states); }

    runtimeCutoff(states) { return runtimeCutoffOf(this.config, states); }

    updateDetails() {
      const gauge = gaugeByKey[this.detailsKey];
      if (!gauge) return;
      const states = this.hassData?.states ?? {};
      const source = gauge.source;
      const layout = gridLayouts[source];
      const page = this.detailsPage ?? "main";
      const count = powerSources(this.config, gauge).length;
      const english = preferEnglish(this.config);
      const title = this.t(gauge.english, gauge.label);
      const suffix = page === "sub" ? (source === "pv" ? this.t("by input", "по входах") : this.t("by phase", "по фазах"))
        : page === "chart" ? this.t("graph", "графік") : "";
      this.detailsTitle.textContent = suffix ? `${title} · ${suffix}` : title;
      this.detailsScreen.dataset.page = page;
      this.historySection.hidden = !(page === "chart" || page === "main" && !layout.chartPage);
      const canSplit = count > 1;
      this.historyToggle.hidden = !canSplit;
      this.historyToggle.setAttribute("aria-pressed", String(Boolean(this.detailsSplit)));
      const month = this.historyMode === "month";
      this.historyMonth.setAttribute("aria-pressed", String(month));
      this.historyToggle.hidden = !canSplit || month;
      if (month) this.historyHeading.textContent = this.t("Energy per day · 30 days", "Енергія по днях · 30 днів");
      else this.historyHeading.textContent = this.detailsSplit && canSplit ? this.t("Power by inverter · 24 h", "Потужність по інверторах · 24 год")
        : canSplit ? this.t("Combined power · 24 h", "Загальна потужність · 24 год") : this.t("Power · 24 h", "Потужність · 24 год");
      const html = page === "chart" ? "" : gridBodyHtml({
        config:this.config, states, source, page, edit:false, t:this.t.bind(this), english, soc:this.runtimeSoc ?? null,
        dual:source === "battery" && this.inverterCount === 1 && this.screen.dataset.battery === "dual",
      });
      this.detailsBody.hidden = page === "chart";
      if (html !== this.detailsHtml) { this.detailsHtml = html; this.detailsBody.innerHTML = html; }
    }

    showHistory(message, plot = "") {
      this.historyMessage.textContent = message;
      this.historyMessage.hidden = !message;
      this.historyChart.innerHTML = plot;
      this.historyChart.hidden = !plot;
    }

    renderDetailsHistory() {
      if (!this.detailsData || !this.detailsKey) return;
      const { series, start, end, zone, missing, duplicate } = this.detailsData;
      const empty = this.t("No power records in the last 24 hours.", "Немає записів потужності за останні 24 години.");
      const choose = this.t("Select a power sensor in the card editor.", "Виберіть датчик потужності в редакторі картки.");
      const plot = points => points.some(point => point.value !== null)
        ? historyPlot(points, start, end, zone, preferEnglish(this.config), this.chartView) : "";
      this.refreshZoomButton();
      if (this.detailsSplit && series.length > 1) {
        const parts = series.map(({ index, id, points }) => {
          const title = this.t(`Inverter ${index + 1}`, `Інвертор ${index + 1}`);
          const displayPoints = this.detailsKey === "battery_power" && this.config.battery_power_x2 === true ? points.map(point => ({ ...point, value:point.value === null ? null : point.value * 2 })) : points;
          const content = id ? plot(displayPoints) : "";
          return `<section class="history-part"><h4>${title}</h4>${content || `<p>${id ? empty : choose}</p>`}</section>`;
        }).join("");
        this.showHistory("", parts);
        return;
      }
      if (missing || duplicate) {
        const message = duplicate
          ? this.t("Select a distinct power sensor for each inverter.", "Вибери окремий датчик потужності для кожного інвертора.")
          : series.length > 1 ? this.t("Link a power sensor for each inverter to build the combined graph.", "Для загального графіка під’єднай датчик потужності кожного інвертора.") : choose;
        this.showHistory(message);
        return;
      }
      const sets = series.filter(({ id }) => id).map(({ points }) => points);
      const rawPoints = sets.length <= 1 ? sets[0] ?? [] : sumHistory(sets);
      const graphPoints = this.detailsKey === "battery_power" && this.config.battery_power_x2 === true ? rawPoints.map(point => ({ ...point, value:point.value === null ? null : point.value * 2 })) : rawPoints;
      const chart = plot(graphPoints);
      this.showHistory(chart ? "" : empty, chart);
    }

    async loadDetailsHistory() {
      const gauge = gaugeByKey[this.detailsKey];
      if (!gauge) return;
      this.refreshZoomButton();
      if (this.historyMode === "month") { await this.loadMonthHistory(); return; }
      // The battery chart lives on its own page: fetch it only once that page is opened.
      if (gauge.source === "battery" && this.detailsPage !== "chart") { ++this.historyRequest; this.detailsData = null; return; }
      const series = powerSources(this.config, gauge);
      const request = ++this.historyRequest;
      this.detailsData = null;
      const hass = this.hassData;
      const components = powerParts(series);
      const entityIds = [...new Set(components.map(({ id }) => id).filter(Boolean))];
      const missing = !entityIds.length || gauge.source !== "pv" && components.some(({ id }) => !id);
      const duplicate = entityIds.length !== components.filter(({ id }) => id).length;
      const end = Date.now();
      const start = end - historyDuration;
      const zone = hass?.config?.time_zone;
      if (!entityIds.length) {
        this.detailsData = { series: series.map(item => ({ ...item, points: [] })), start, end, zone, missing, duplicate };
        this.renderDetailsHistory();
        return;
      }
      if (typeof hass?.callWS !== "function") {
        this.showHistory(this.t("Home Assistant history is temporarily unavailable.", "Історія Home Assistant тимчасово недоступна."));
        return;
      }
      this.showHistory(this.t("Loading history…", "Завантажую історію…"));
      try {
        const history = await hass.callWS({
          type: "history/history_during_period",
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          entity_ids: entityIds,
          include_start_time_state: true,
          significant_changes_only: false,
          minimal_response: true,
          no_attributes: true,
        });
        if (request !== this.historyRequest) return;
        this.detailsData = {
          series: series.map(item => ({
            ...item, id:item.parts ? item.parts.every(part => part.id) && !duplicate ? "channels" : null : item.id,
            points:item.parts ? sumHistory(item.parts.map(part => historyPoints(history?.[part.id], start, end,
              hass.states?.[part.id]?.attributes?.unit_of_measurement, part.invert)))
              : historyPoints(history?.[item.id], start, end, hass.states?.[item.id]?.attributes?.unit_of_measurement, item.invert),
          })),
          start, end, zone, missing, duplicate,
        };
        this.renderDetailsHistory();
      } catch {
        if (request === this.historyRequest) this.showHistory(this.t("Could not load Home Assistant history.", "Не вдалося завантажити історію Home Assistant."));
      }
    }

    /* 0.8.33 · 24 h graph zoom: wheel or pinch zooms around the finger/cursor, drag pans, double tap or ⟲ resets. */
    setChartView(view) {
      const data = this.detailsData;
      if (!data || this.historyMode === "month") return;
      const full = data.end - data.start;
      if (view) {
        const span = Math.max(30 * 1000, Math.min(full, view.end - view.start));
        let start = Math.max(data.start, Math.min(view.start, data.end - span));
        view = span >= full - 1000 ? null : { start, end:start + span };
      }
      this.chartView = view;
      cancelAnimationFrame(this.chartFrame);
      this.chartFrame = requestAnimationFrame(() => this.renderDetailsHistory());
    }

    refreshZoomButton() {
      const data = this.detailsData, view = this.chartView;
      const zoom = data && view && this.historyMode !== "month" ? (data.end - data.start) / (view.end - view.start) : 1;
      this.historyReset.hidden = zoom <= 1.01;
      this.historyReset.textContent = `⟲ ×${zoom >= 10 ? Math.round(zoom) : Math.round(zoom * 10) / 10}`;
      this.historyReset.setAttribute("aria-label", this.t("Reset zoom", "Скинути масштаб"));
      this.historyChart?.toggleAttribute("data-zoomed", zoom > 1.01);
    }

    attachChartZoom(chart) {
      const timeAt = (clientX) => {
        const svg = chart.querySelector("[data-history-plot]");
        const data = this.detailsData;
        if (!svg || !data) return null;
        const rect = svg.getBoundingClientRect();
        const view = this.chartView ?? { start:data.start, end:data.end };
        const ratio = Math.min(1, Math.max(0, ((clientX - rect.left) / rect.width * 390 - 45) / 334));
        return { time:view.start + ratio * (view.end - view.start), ratio, view };
      };
      const zoomAt = (clientX, factor) => {
        const at = timeAt(clientX);
        if (!at) return;
        const span = (at.view.end - at.view.start) * factor;
        this.setChartView({ start:at.time - at.ratio * span, end:at.time + (1 - at.ratio) * span });
      };
      chart.addEventListener("wheel", event => {
        if (this.historyMode === "month" || !chart.querySelector("[data-history-plot]")) return;
        event.preventDefault();
        zoomAt(event.clientX, Math.exp(event.deltaY * .0025));
      }, { passive:false });
      const pointers = new Map();
      let pinch = null, drag = null, lastTap = 0;
      chart.addEventListener("pointerdown", event => {
        if (this.historyMode === "month" || !chart.querySelector("[data-history-plot]")) return;
        pointers.set(event.pointerId, event.clientX);
        chart.setPointerCapture?.(event.pointerId);
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinch = { distance:Math.max(10, Math.abs(a - b)), center:(a + b) / 2, view:this.chartView };
          drag = null;
        } else if (pointers.size === 1) {
          const now = Date.now();
          if (now - lastTap < 320) { this.setChartView(null); lastTap = 0; return; }
          lastTap = now;
          drag = { x:event.clientX, at:timeAt(event.clientX) };
        }
      });
      chart.addEventListener("pointermove", event => {
        if (!pointers.has(event.pointerId)) return;
        pointers.set(event.pointerId, event.clientX);
        if (pinch && pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          const distance = Math.max(10, Math.abs(a - b));
          this.chartView = pinch.view;
          zoomAt(pinch.center, pinch.distance / distance);
        } else if (drag?.at && this.chartView) {
          const svg = chart.querySelector("[data-history-plot]");
          if (!svg) return;
          const width = svg.getBoundingClientRect().width * 334 / 390;
          const span = drag.at.view.end - drag.at.view.start;
          const shift = -(event.clientX - drag.x) / width * span;
          this.setChartView({ start:drag.at.view.start + shift, end:drag.at.view.end + shift });
        }
      });
      const release = event => {
        pointers.delete(event.pointerId);
        if (pointers.size < 2) pinch = null;
        if (!pointers.size) drag = null;
      };
      chart.addEventListener("pointerup", release);
      chart.addEventListener("pointercancel", release);
    }

    async loadMonthHistory() {
      const hass = this.hassData;
      const request = ++this.historyRequest;
      this.detailsData = null;
      const indices = installedInverters(this.config);
      const groups = [
        { key:"pv", field:"pv_energy_today", label:this.t("Solar", "Сонце") },
        { key:"load", field:"load_energy_today", label:this.t("Load", "Навантаження") },
        { key:"grid", field:"grid_energy_today", label:this.t("Grid", "Мережа") },
      ].map(group => ({ ...group, ids:[...new Set(indices.map(index => this.config[inverterField(index, group.field)]).filter(hasEditorBinding))] }))
        .filter(group => group.ids.length);
      if (!groups.length) {
        this.showHistory(this.t("Link the «Today» energy sensors (Solar, Load, Grid) in the editor to see the month.",
          "Прив'яжіть у редакторі сенсори енергії «Сьогодні» (Сонце, Навантаження, Мережа), щоб бачити місяць."));
        return;
      }
      if (typeof hass?.callWS !== "function") {
        this.showHistory(this.t("Home Assistant statistics are temporarily unavailable.", "Статистика Home Assistant тимчасово недоступна."));
        return;
      }
      this.showHistory(this.t("Loading statistics…", "Завантажую статистику…"));
      const first = new Date(); first.setHours(0, 0, 0, 0); first.setDate(first.getDate() - 29);
      const days = Array.from({ length:30 }, (_, k) => {
        const day = new Date(first); day.setDate(first.getDate() + k);
        return { key:day.toDateString(), short:`${day.getDate()}.${String(day.getMonth() + 1).padStart(2, "0")}`,
          label:day.toLocaleDateString(this.t("en-GB", "uk-UA"), { day:"numeric", month:"long" }) };
      });
      try {
        const result = await hass.callWS({
          type:"recorder/statistics_during_period", start_time:first.toISOString(), end_time:new Date().toISOString(),
          statistic_ids:groups.flatMap(group => group.ids), period:"day", types:["change"], units:{ energy:"kWh" },
        });
        if (request !== this.historyRequest) return;
        const series = groups.map(group => {
          const values = days.map(() => null);
          for (const id of group.ids) for (const row of result?.[id] ?? []) {
            const at = new Date(typeof row.start === "number" ? row.start : Date.parse(row.start));
            const index = days.findIndex(day => day.key === at.toDateString());
            if (index >= 0 && Number.isFinite(row.change)) values[index] = (values[index] ?? 0) + row.change;
          }
          return { key:group.key, label:group.label, values };
        });
        if (!series.some(item => item.values.some(Number.isFinite))) {
          this.showHistory(this.t("No daily statistics yet. The «Today» sensors need state_class total_increasing (or total).",
            "Ще немає денної статистики. Сенсори «Сьогодні» мають бути з state_class total_increasing (або total)."));
          return;
        }
        this.showHistory("", monthPlot(days, series, preferEnglish(this.config)));
      } catch {
        if (request === this.historyRequest) this.showHistory(this.t("Could not load Home Assistant statistics.", "Не вдалося завантажити статистику Home Assistant."));
      }
    }

    t(en, uk) { return preferEnglish(this.config) ? en : uk; }

    localizeIn(root) {
      const lang = this.t("en", "uk");
      for (const node of root.querySelectorAll("[data-uk-text]")) {
        node.textContent = node.getAttribute(`data-${lang}-text`);
      }
      for (const node of root.querySelectorAll("[data-uk-label]")) {
        const label = node.getAttribute(`data-${lang}-label`);
        node.setAttribute("aria-label", label);
        if (node.hasAttribute("title")) node.setAttribute("title", label);
      }
    }

    localize() {
      this.setAttribute("lang", this.t("en", "uk"));
      this.localizeIn(this.shadowRoot);
      this.updateClock();
    }

    clearNumeric() {
      if (this.activeNumeric) this.activeNumeric.view.element.removeAttribute("data-numeric-active");
      this.activeNumeric = null;
      this.numericPanel.hidden = true;
    }

    settingText(value) {
      if (value === null) return "";
      return typeof value === "number" ? this.t(String(value), String(value).replace(".", ",")) : String(value);
    }

    settingLabel(view) {
      const input = view.input ?? view.select;
      return input?.getAttribute(this.t("data-en-label", "data-uk-label")) ?? "";
    }

    openNumeric(view) {
      if (view.input?.disabled || view.element.dataset.kind === "time") return;
      const setting = this.readSetting(view.name);
      if (this.numericTarget(setting)?.domain !== "number" || setting.current === null) return;
      this.clearNumeric();
      this.activeNumeric = { view, route: this.settingRoute(setting) };
      view.element.setAttribute("data-numeric-active", "");
      this.numericPanel.hidden = false;
      this.renderNumeric();
    }

    renderNumeric() {
      const active = this.activeNumeric;
      if (!active) return;
      const { view, route } = active;
      const setting = this.readSetting(view.name);
      const target = this.numericTarget(setting);
      if (!target || target.domain !== "number" || route !== this.settingRoute(setting) || this.settingsScreen.hidden) {
        this.clearNumeric();
        return;
      }
      this.numericTitle.textContent = this.settingLabel(view);
      const { step, min, max } = target.entity.attributes ?? {};
      const usableStep = Number.isFinite(step) && step > 0;
      const raw = this.settingsDrafts.get(view.name)?.raw ?? setting.current;
      const text = this.settingText(raw);
      if (text !== this.numericInput.value) this.numericInput.value = text;
      const unit = view.element.dataset.unit;
      this.numericUnit.textContent = setting.unit || this.t(unit, unitsUk[unit] ?? unit);
      this.numericStep.textContent = usableStep ? this.t(`Step ${step}`, `Крок ${this.settingText(step)}`) +
        (this.numericUnit.textContent ? ` ${this.numericUnit.textContent}` : "") : this.t("Step unavailable", "Крок недоступний");
      this.numericInput.disabled = view.input.disabled;
      const value = Number(String(raw).replace(",", "."));
      const blocked = this.numericInput.disabled || !usableStep || !Number.isFinite(value) || String(raw).trim() === "";
      this.numericMinus.disabled = blocked || Number.isFinite(min) && value <= min;
      this.numericPlus.disabled = blocked || Number.isFinite(max) && value >= max;
    }

    nudgeSetting(view, direction) {
      if (!view?.input || view.input.disabled) return;
      const setting = this.readSetting(view.name);
      const target = this.numericTarget(setting);
      const { min, max, step } = target?.entity.attributes ?? {};
      if (target?.domain !== "number" || !Number.isFinite(step) || step <= 0) return;
      const raw = this.settingsDrafts.get(view.name)?.raw ?? setting.current;
      const base = Number.isFinite(min) ? min : 0;
      const current = Number(String(raw).replace(",", "."));
      if (!Number.isFinite(current) || String(raw).trim() === "") return;
      const steps = (current - base) / step;
      const next = direction > 0 ? Math.floor(steps + 1e-8) + 1 : Math.ceil(steps - 1e-8) - 1;
      const value = Number((base + next * step).toPrecision(12));
      if (Number.isFinite(min) && value < min || Number.isFinite(max) && value > max) return;
      this.stageSetting(view, this.settingText(value));
    }

    renderReadouts(readouts) {
      const states = this.hassData?.states ?? {};
      for (const output of readouts) {
        const name = output.dataset.readout;
        const state = states[this.config?.[name]];
        if (name === "device_alarms") {
          const alarms = state?.attributes?.alarms;
          const entries = Array.isArray(alarms) ? alarms.slice(0, 50).filter(entry =>
            entry && ["number", "string"].includes(typeof entry.code)) : [];
          const safe = (value) => typeof value === "string" || typeof value === "number" ? escapeHtml(value) : "";
          const markup = entries.map(({ code, message, occurred }) =>
            `<div><span title="${safe(message ?? "")}">${safe(code)} ${safe(message ?? "")}</span><time>${safe(occurred ?? "")}</time></div>`).join("") || "—";
          if (markup !== output.innerHTML) output.innerHTML = markup;
          continue;
        }
        const metadata = states[this.config?.device_info];
        const attributes = metadata?.attributes ?? {};
        const aliases = {
          device_serial:["Serial Number","serial_number","Inverter ID"],
          device_main:["Control Board Firmware Version","Main Firmware Version","main_version"],
          device_hmi:["HMI Version","HMI Firmware Version","hmi_version"],
          device_flash:["Flash","flash"],
        };
        const fallback = !this.config?.[name] ? aliases[name]?.map(key => attributes[key]).find(value => ["string","number"].includes(typeof value)) : undefined;
        const value = state?.state ?? fallback;
        const text = value !== undefined && value !== null && value !== "" && value !== "unavailable" && value !== "unknown" ? String(value) : "—";
        output.textContent = text;
        output.setAttribute("title", text);
      }
    }

    openSettings() {
      if (!this.settingsScreen.hidden || this.detailsKey) return;
      this.settingsMenuId = null;
      this.screen.setAttribute("hidden", "");
      this.settingsScreen.hidden = false;
      this.renderSettings();
      this.settingsTitle.focus({ preventScroll: true });
    }

    closeSettings() {
      this.closeUnboundHelp();
      if (this.settingsScreen.hidden) return;
      this.settingsSession++;
      this.settingsScreen.hidden = true;
      this.screen.removeAttribute("hidden");
      this.clearSettingDrafts();
      if (this.isConnected) this.gear.focus({ preventScroll: true });
    }

    backFromSettings() {
      if (this.settingsMenuId === null) {
        this.closeSettings();
        return;
      }
      const tile = this.shadowRoot.querySelector(`[data-settings-menu="${this.settingsMenuId}"]`);
      this.settingsSession++;
      this.clearSettingDrafts();
      this.settingsMenuId = null;
      this.renderSettings();
      tile.focus({ preventScroll: true });
    }

    goToSettingsPage(menuId, page) {
      const menu = settingsMenus.find(({ id }) => id === menuId);
      if (this.savingSettings || !menu || page < 0 || page >= (menu.pages?.length ?? 1)) return;
      this.clearNumeric();
      this.settingsMenuId = menuId;
      this.settingsPage = page;
      this.settingsNotice = "";
      this.renderSettings();
      this.settingsMain.scrollTop = 0;
      this.settingsTitle.focus({ preventScroll: true });
    }

    canEditSettings() {
      return this.hassData?.user?.is_admin === true && typeof this.hassData.callService === "function";
    }

    settingTarget(name) {
      const id = this.config?.[name];
      if (typeof id !== "string") return null;
      const [domain] = id.split(".", 1);
      const allowed = bindingDomains[name];
      if (!(Array.isArray(allowed) ? allowed.includes(domain) : allowed === domain)) return null;
      const entity = this.hassData?.states?.[id];
      const value = settingValue(entity, domain);
      return value === null ? null : { name, id, domain, entity, value };
    }

    batteryModeControl() {
      if (this.config?.battery_mode) return selectControl(this.settingTarget("battery_mode"), batteryChoices);
      const type = this.settingTarget("battery_control_mode");
      const mode = this.settingTarget("battery_operation_mode");
      const types = optionMatches(type, batteryChemistries);
      const modes = optionMatches(mode, batteryOperationModes);
      const currentType = selectedChoice(type, types);
      const currentMode = selectedChoice(mode, modes);
      const current = currentMode === "none" ? "none" : currentType === "lithium" ? "lithium"
        : currentType === "lead" ? currentMode : null;
      const choices = {
        lithium: currentType && currentMode && types.lithium && modes.soc,
        voltage: currentType && currentMode && types.lead && modes.voltage,
        soc: currentType && currentMode && types.lead && modes.soc,
        none: currentMode && modes.none,
      };
      return {
        current,
        targets: [type, mode].filter(Boolean),
        choices: Object.keys(choices).filter(key => choices[key]),
        writes: value => {
          const operation = { target: mode, value: modes[value === "lithium" ? "soc" : value] };
          if (value === "none") return [operation];
          const chemistry = { target: type, value: value === "lithium" ? types.lithium : types.lead };
          return value === "lithium" ? [operation, chemistry] : [chemistry, operation];
        },
      };
    }

    chargeStartTarget(name) {
      const soc = `${name}_soc`;
      const voltage = `${name}_voltage`;
      const mode = this.batteryModeControl().current;
      if (mode === "none") return null;
      if (mode === "lithium" || mode === "soc") return this.settingTarget(soc);
      if (mode === "voltage") return this.settingTarget(voltage);
      const single = [soc, voltage].filter(key => this.config?.[key]);
      return single.length === 1 ? this.settingTarget(single[0]) : null;
    }

    maskControl(name, target, options, bits) {
      const currentKey = selectedChoice(target, options);
      if (currentKey === null) return unavailableSetting;
      const mask = Number(currentKey);
      const bit = bits[name];
      const current = Boolean(mask & bit);
      return {
        current,
        targets: [target],
        canWrite: options[mask ^ bit] !== undefined,
        writes: value => {
          const requestedMask = Object.entries(bits).reduce((result, [key, flag]) => {
            const draft = this.settingsDrafts.get(key);
            const enabled = name === key ? value : draft?.route === target.id ? draft.raw : Boolean(mask & flag);
            return enabled ? result | flag : result;
          }, 0);
          return [{ target, value: options[requestedMask] }];
        },
      };
    }

    signalControl(name, targetKey, genKey, gridKey) {
      const target = this.settingTarget(targetKey);
      return this.maskControl(name, target, optionMatches(target, settingOptions.charging_signal), {
        [genKey]: 1, [gridKey]: 2,
      });
    }

    dayControl(name) {
      const target = this.settingTarget("time_of_use");
      if (target?.domain !== "select") return unavailableSetting;
      const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const aliases = { 31: ["Weekdays"], 96: ["Weekend"], 127: ["Week", "Everyday", "Every day", "All days"] };
      dayNames.forEach((day, i) => {
        aliases[1 << i] = [day];
        aliases[127 ^ (1 << i)] = [`Week -${day}`];
      });
      const options = optionMatches(target, aliases);
      const bits = Object.fromEntries(days.map(([day], i) => [`tou_${day}`, 1 << i]));
      return this.maskControl(name, target, options, bits);
    }

    timeOfUseControl(target) {
      const options = target.entity.attributes.options;
      const offOptions = ["disabled", "off", "disable"];
      const off = options.find(option => offOptions.includes(optionKey(option)));
      const current = !offOptions.includes(optionKey(target.value));
      if (current) this.lastTimeOfUse = { id: target.id, option: target.value };
      const remembered = this.lastTimeOfUse;
      const enabled = remembered?.id === target.id && options.includes(remembered.option) ? remembered.option
        : options.find(option => ["enabled", "on", "enable", "week", "everyday", "every day", "all days"].includes(optionKey(option)));
      return {
        current,
        targets: [target],
        canWrite: (current ? off : enabled) !== undefined,
        writes: value => [{ target, value: value ? enabled : off }],
      };
    }

    calendarControl(name) {
      const part = name.replace("basic_", "");
      const target = this.settingTarget("basic_datetime");
      if (!target) return unavailableSetting;
      const zone = this.hassData?.config?.time_zone;
      const parts = calendarParts(target.value, zone);
      if (!parts) return unavailableSetting;
      return {
        current:parts[part], targets:[target], numericAttributes:calendarBounds[part],
        writes:raw => {
          const edited = { ...parts };
          for (const [key, bounds] of Object.entries(calendarBounds)) {
            const draft = this.settingsDrafts.get(`basic_${key}`);
            if (this.config?.[`basic_${key}`]) continue;
            if (key === part || draft?.route === target.id) edited[key] = validateSettingNumber(key === part ? raw : draft.raw, bounds, this.t.bind(this));
          }
          return [{ target, value:calendarISO(edited, zone, this.t.bind(this)) }];
        },
      };
    }

    numericTarget(setting) {
      return setting.numericAttributes ? { domain:"number", entity:{ attributes:setting.numericAttributes } } : setting.targets[0];
    }

    readSetting(name) {
      if (lockedSettings.has(name)) return lockedSetting;
      if (!this.config?.[name] && calendarBounds[name.replace("basic_", "")] && name.startsWith("basic_")) return this.calendarControl(name);
      if (name === "battery_mode") return this.batteryModeControl();
      if (["generator_signal", "grid_signal"].includes(name) && this.config?.charging_signal) {
        return this.signalControl(name, "charging_signal", "generator_signal", "grid_signal");
      }
      const charge = name.match(/^tou_([1-6])_(grid|gen)_charge$/);
      if (charge && !this.config?.[name] && this.config?.[`tou_${charge[1]}_charge`]) {
        const slot = `tou_${charge[1]}`;
        return this.signalControl(name, `${slot}_charge`, `${slot}_gen_charge`, `${slot}_grid_charge`);
      }
      if (!this.config?.[name] && days.some(([day]) => name === `tou_${day}`)) return this.dayControl(name);
      // Program setpoints and battery thresholds follow the battery mode: % for SOC, V for voltage.
      const batterySetpoint = /^tou_[1-6]_battery$/.test(name) || thresholdSettings.has(name);
      const batteryMode = batterySetpoint ? this.batteryModeControl().current : null;
      const voltageField = `${name}_voltage`;
      const useVoltage = batterySetpoint && this.config?.[voltageField] &&
        (batteryMode === "voltage" || !this.config?.[name] && batteryMode === null);
      const target = ["generator_start", "grid_start"].includes(name)
        ? this.chargeStartTarget(name.replace("_start", "_charge_start"))
        : batteryMode === "none" ? null : this.settingTarget(useVoltage ? voltageField : name);
      if (!target) return unavailableSetting;
      if (name === "time_of_use" && target.domain === "select") return this.timeOfUseControl(target);
      if (settingOptions[name]) return selectControl(target, settingOptions[name]);
      const isTime = /^tou_[1-6]_start$/.test(name);
      const unit = target.entity.attributes?.unit_of_measurement;
      const current = isTime ? decodeTime(target.value) : target.domain === "button" ? false : target.value;
      if (current === null) return unavailableSetting;
      return {
        current,
        targets: [target],
        unit: typeof unit === "string" && !isTime ? this.t(unit, unitsUk[unit] ?? unit) : "",
        writes: value => {
          if (isTime) {
            const time = decodeTime(value);
            if (!time) throw new Error(this.t("Use a time in HH:MM format.", "Введи час у форматі ГГ:ХХ."));
            value = target.domain === "time" ? `${time}:00` : target.domain === "select"
              ? target.entity.attributes.options.find(option => decodeTime(option) === time)
              : Number(time.replace(":", ""));
          }
          if (target.domain === "number") value = validateSettingNumber(value, target.entity.attributes ?? {}, this.t.bind(this));
          return [{ target, value }];
        },
      };
    }

    settingRoute(setting) {
      return setting.targets.map(({ id }) => id).join(",");
    }

    clearSettingDrafts() {
      this.settingsDrafts.clear();
      this.settingsNotice = "";
      this.clearNumeric();
    }

    clearPendingSettings() {
      for (const pending of this.pendingSettings.values()) clearTimeout(pending.timer);
      this.pendingSettings.clear();
    }

    stageSetting(view, override) {
      const input = view.select && !view.select.hidden ? view.select : view.input;
      if (input.disabled || !this.canEditSettings() || this.savingSettings) return;
      const { name } = view;
      const setting = this.readSetting(name);
      if (setting.current === null) return;
      const raw = override ?? (input.type === "checkbox" ? input.checked : input.value);
      const route = this.settingRoute(setting);
      const draft = this.settingsDrafts.get(name);
      const normalized = String(raw).trim().replace(",", ".");
      const equivalent = sameSetting(setting.current, raw) || typeof setting.current === "number" &&
        /^[+-]?(?:\d+|\d*\.\d+)$/.test(normalized) && sameSetting(setting.current, Number(normalized));
      if (equivalent) this.settingsDrafts.delete(name);
      else this.settingsDrafts.set(name, {
        raw, route, expected: draft?.route === route ? draft.expected : setting.targets.map(({ id, value }) => [id, value]),
      });
      this.settingsNotice = "";
      this.renderSettings();
    }

    reconcileSettings() {
      for (const [id, pending] of this.pendingSettings) {
        const entity = this.hassData?.states?.[id];
        const current = settingValue(entity, pending.domain);
        const clockConfirmed = pending.domain === "datetime" && current !== null &&
          Date.parse(current) >= Date.parse(pending.value) && Date.parse(current) - Date.parse(pending.value) < 15000;
        if (!clockConfirmed && !sameSetting(current, pending.value)) continue;
        clearTimeout(pending.timer);
        this.pendingSettings.delete(id);
      }
    }

    renderSettings() {
      const pop = this.settingsScreen.querySelector(".unbound-pop");
      if (pop && pop.dataset.page !== `${this.settingsMenuId}:${this.settingsPage}`) pop.remove();
      const menu = settingsMenus.find(({ id }) => id === this.settingsMenuId);
      const page = menu ? this.settingsPanels.get(`${menu.id}:${this.settingsPage}`) : null;
      const descriptor = menu?.pages[this.settingsPage];
      const title = descriptor?.title ?? menu?.title ?? pair("System Setup", "Налаштування системи");
      this.settingsTitle.textContent = local(title, this.config);
      this.settingsMenu.hidden = Boolean(menu);
      this.settingsHome.hidden = Boolean(menu);
      this.settingsBody.hidden = !menu;
      for (const panel of this.settingsPanels.values()) panel.element.hidden = panel !== page;
      this.reconcileSettings();
      if (!page) {
        for (const node of [this.viewOnlyLabel, this.readOnlyMenuLabel, this.noSettingsLabel, this.settingsMessage]) node.hidden = true;
        return;
      }
      this.settingsPageName.textContent = local(descriptor.caption, this.config);
      this.settingsPrevious.disabled = this.savingSettings || this.settingsPage === 0;
      this.settingsNext.disabled = this.savingSettings || this.settingsPage >= menu.pages.length - 1;
      const readOnlyMenu = readOnlyMenus.has(menu.id);
      const editable = this.canEditSettings() && !readOnlyMenu;
      let connected = false;
      let dirty = false;
      let blocked = false;
      let waiting = false;
      let expired = false;
      for (const [name, views] of page.fields) {
        const setting = this.readSetting(name);
        let draft = this.settingsDrafts.get(name);

        const route = this.settingRoute(setting);
        if (draft && route && draft.route !== route) {
          this.settingsDrafts.delete(name);
          draft = undefined;
          this.settingsNotice = this.t("The linked entity changed. Enter the value again.", "Змінилася сутність для поля. Введи значення повторно.");
        }
        const available = setting.current !== null;
        const pending = setting.targets.map(({ id }) => this.pendingSettings.get(id)).filter(Boolean);
        const pendingUpdate = pending.some(item => !item.expired);
        const disabled = !editable || !available || pendingUpdate || this.savingSettings || setting.canWrite === false;
        const value = draft ? draft.raw : setting.current;
        connected ||= available;
        dirty ||= Boolean(draft);
        blocked ||= Boolean(draft && disabled);
        waiting ||= pendingUpdate;
        expired ||= pending.some(item => item.expired);
        for (const view of views) {
          const forMode = view.element.dataset.forMode;
          if (forMode) {
            const mode = this.settingsDrafts.get("work_mode")?.raw ?? this.readSetting("work_mode").current;
            const inactive = mode !== null && mode !== undefined && mode !== forMode;
            view.element.toggleAttribute("data-inactive", inactive);
            if (inactive) { this.renderSettingView(view, setting, false, true, undefined); continue; }
          }
          this.renderSettingView(view, setting, value, disabled, draft);
        }
      }
      this.renderReadouts(page.readouts);
      this.viewOnlyLabel.hidden = this.canEditSettings() || !page.fields.size;
      this.readOnlyMenuLabel.hidden = !readOnlyMenu || !page.fields.size;
      // Unlinked items are marked on the fields themselves, so the card keeps its height.
      this.noSettingsLabel.hidden = true;
      this.settingsApply.disabled = !dirty || blocked || this.savingSettings;
      const message = this.settingsNotice || (this.savingSettings ? this.t("Sending changes…", "Надсилаю зміни…") : waiting
        ? this.t("Waiting for the Home Assistant state…", "Очікую оновлення стану в Home Assistant…") : expired
          ? this.t("Home Assistant has yet to confirm the change. Check the state before retrying.", "Home Assistant ще не підтвердив зміну. Звір стан перед повторною спробою.") : "");
      this.settingsMessage.textContent = message;
      this.settingsMessage.hidden = !message;
      this.settingsMessage.toggleAttribute("data-error", Boolean(this.settingsNotice));
      this.renderNumeric();
    }

    renderSettingView(view, setting, value, disabled, draft) {
      const { element, input, select, unit, steppers } = view;
      const target = setting.targets[0];
      const showSelect = select && (!target || target.domain === "select");
      const available = setting.current !== null;
      input.disabled = disabled || Boolean(showSelect) || (input.type === "radio" && !setting.choices?.includes(input.value));
      if (select) {
        select.hidden = !showSelect;
        input.hidden = Boolean(showSelect);
        select.disabled = disabled || !showSelect;
        if (showSelect) {
          const options = available ? target.entity.attributes.options : [];
          const list = JSON.stringify(options);
          if (view.options !== list) {
            select.innerHTML = options.length ? options.map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("") : '<option value="">—</option>';
            view.options = list;
          }
          select.value = value ?? "";
        }
      }
      if (input.type === "radio") input.checked = input.value === value;
      else if (input.type === "checkbox") {
        input.checked = value === true;
        input.indeterminate = !available;
      } else {
        const text = this.settingText(value);
        if (text !== input.value) input.value = text;
        const fallback = element.dataset.unit;
        // As on the Deye screen: a unit only where the original shows one, written right after the number.
        unit.textContent = showSelect || !available || !fallback ? "" : setting.unit || this.t(fallback, unitsUk[fallback] ?? fallback);
        this.fitNumber(input, unit);
      }
      for (const button of steppers) {
        const step = this.numericTarget(setting)?.entity.attributes?.step;
        button.disabled = input.disabled || !Number.isFinite(step) || step <= 0;
      }
      element.toggleAttribute("data-unavailable", !available);
      element.toggleAttribute("data-unbound", !setting.locked && !this.settingBound(element.dataset.setting));
      element.toggleAttribute("data-dirty", Boolean(draft));
      element.toggleAttribute("data-locked", Boolean(setting.locked));
      if (setting.locked) element.title = this.t("Locked for safety: factory reset is never sent from the card.", "Заблоковано з міркувань безпеки: скидання налаштувань з картки не надсилається.");
    }

    settingBound(name) {
      // A menu item counts as linked when its own entity or one that drives it (shared selector, volts, date-time) is set.
      const config = this.config ?? {};
      const related = [name, `${name}_voltage`];
      const slot = /^tou_(\d)_(grid_charge|gen_charge|battery)$/.exec(name);
      if (slot) related.push(slot[2] === "battery" ? `tou_${slot[1]}_battery_voltage` : `tou_${slot[1]}_charge`);
      if (/^tou_(mon|tue|wed|thu|fri|sat|sun)$/.test(name)) related.push("time_of_use");
      if (/^basic_(year|month|day|hour|minute)$/.test(name)) related.push("basic_datetime");
      if (/^(generator|grid)_signal$/.test(name)) related.push("charging_signal");
      if (name === "battery_mode") related.push("battery_control_mode", "battery_operation_mode");
      if (name === "generator_start" || name === "grid_start") {
        const base = name.replace("_start", "_charge_start");
        related.push(`${base}_soc`, `${base}_voltage`);
      }
      return related.some(key => hasEditorBinding(config[key]));
    }

    showUnboundHelp(element) {
      this.closeUnboundHelp();
      const t = this.t.bind(this);
      const input = element.querySelector("input,select");
      const title = input?.getAttribute("aria-label") || element.dataset.setting;
      const menu = this.settingsScreen.querySelector("#settings-title")?.textContent ?? "";
      const page = this.settingsScreen.querySelector("[data-settings-page-name]")?.textContent ?? "";
      const pop = document.createElement("div");
      pop.className = "unbound-pop";
      pop.dataset.page = `${this.settingsMenuId}:${this.settingsPage}`;
      pop.setAttribute("role", "dialog");
      pop.innerHTML = `<b>${escapeHtml(t(`«${title}» is not linked`, `«${title}» — не прив’язано`))}</b>
        ${escapeHtml(t("No entity is selected, so this item is inactive.", "Сутність не вибрано, тому пункт неактивний."))}<br>
        ${escapeHtml(t("To link it:", "Прив’язати:"))} <i>${escapeHtml(t(`Edit card → Inverter menus → ${menu} → ${page}`, `Редагувати картку → Меню інвертора → ${menu} → ${page}`))}</i>${escapeHtml(t(", tap this field.", ", натисніть це поле."))}
        <div class="unbound-actions"><button type="button" data-unbound-close>${escapeHtml(t("Got it", "Зрозуміло"))}</button></div>`;
      this.settingsScreen.querySelector(".lcd-surface").append(pop);
      pop.querySelector("button").focus({ preventScroll:true });
    }

    closeUnboundHelp() {
      this.settingsScreen?.querySelector(".unbound-pop")?.remove();
    }

    fitNumber(input, unit) {
      const box = input.parentElement;
      if (!box || input.hidden) return;
      const length = Math.max(1, (input.value || input.placeholder || "").length);
      input.style.width = unit.textContent ? `${length + .4}ch` : "";
      box.toggleAttribute("data-unit", Boolean(unit.textContent));
      box.style.fontSize = "";
      // Long values shrink a little inside their own field instead of spilling over the frame.
      for (const size of [.9, .8, .72]) {
        if (box.scrollWidth <= box.clientWidth + .5) break;
        box.style.fontSize = `${size}em`;
      }
    }

    settingRequests(name, draft) {
      const setting = this.readSetting(name);
      if (setting.current === null || this.settingRoute(setting) !== draft.route || setting.canWrite === false) {
        throw new Error(this.t("The state or entity binding changed. Check the value in the menu.", "Стан або прив’язка сутності змінилися. Перевір значення в меню."));
      }
      if (draft.expected?.some(([id, value]) => { const target = setting.targets.find(target => target.id === id); return target?.domain !== "datetime" && !sameSetting(target?.value, value); })) {
        this.settingsDrafts.delete(name);
        throw new Error(this.t("Home Assistant changed the value. Check it before editing again.", "Значення змінилося в Home Assistant. Перевір його і введи зміни повторно."));
      }
      if (setting.choices && !setting.choices.includes(draft.raw)) {
        throw new Error(this.t("The selected mode is unavailable.", "Обраний режим зараз недоступний."));
      }
      const requests = setting.writes(draft.raw);
      for (const { target, value } of requests) {
        if (!target || value === undefined) throw new Error(this.t("The selected entity does not support this combination.", "Цю комбінацію не підтримує обрана сутність."));
      }
      return requests;
    }

    async applySettings(confirmed = false) {
      if (this.settingsScreen.hidden || this.settingsApply.disabled || !this.canEditSettings() || this.savingSettings) return;
      if (readOnlyMenus.has(this.settingsMenuId)) return;
      const page = this.settingsPanels.get(`${this.settingsMenuId}:${this.settingsPage}`);
      if (!page) return;
      const session = this.settingsSession;
      const requests = new Map();
      const edits = [];
      for (const [name, views] of page.fields) {
        const draft = this.settingsDrafts.get(name);
        if (!draft) continue;
        try {
          const plan = this.settingRequests(name, draft);
          edits.push({ name, draft, plan });
          for (const request of plan) {
            const id = request.target.id;
            if (requests.has(id) && !sameSetting(requests.get(id).value, request.value)) {
              throw new Error(this.t("One entity received different values. Check the bindings in the editor.", "Одна сутність отримала різні значення. Перевір прив’язки в редакторі."));
            }
            if (!requests.has(id)) requests.set(id, { ...request, name, route: draft.route });
          }
        } catch (error) {
          this.settingsNotice = error.message;
          this.renderSettings();
          views.find(view => !view.input.disabled)?.input.focus();
          return;
        }
      }
      // Apply limits before enabling a switch. Disable a switch before changing its limit.
      const order = ({ target, value }) => ["number","time","datetime"].includes(target.domain) ? 1
        : target.domain === "select" ? 2 : (value ? 3 : 0);
      const sequence = [...requests.values()].sort((a, b) => order(a) - order(b));
      if (!confirmed) {
        this.openApplyConfirm(page, edits);
        return;
      }
      if (sequence.some(({ name }) => lockedSettings.has(name))) return;
      const applied = new Set();
      this.settingsNotice = "";
      this.savingSettings = true;
      this.clearNumeric();
      this.renderSettings();
      try {
        for (const { target, value, name, route } of sequence) {
          if (!this.isConnected || this.settingsSession !== session || !this.canEditSettings()) break;
          const current = this.settingTarget(target.name);
          if (this.settingRoute(this.readSetting(name)) !== route || current?.id !== target.id) {
            throw new Error(this.t("The entity changed or is unavailable. Check the remaining fields.", "Сутність змінилася або недоступна. Перевір решту полів."));
          }
          if (!sameSetting(current.value, value)) {
            if (target.domain !== "datetime" && !sameSetting(current.value, target.value)) throw new Error(this.t("The value changed in Home Assistant. Check the remaining fields.", "Значення змінилося в Home Assistant. Перевір решту полів."));
            if (target.domain === "number") validateSettingNumber(value, current.entity.attributes ?? {}, this.t.bind(this));
            if (target.domain === "select" && !current.entity.attributes.options.includes(value)) {
              throw new Error(this.t("The selected mode is unavailable.", "Обраний режим зараз недоступний."));
            }
            await this.writeSetting(target, value);
            if (!this.isConnected || this.settingsSession !== session) break;
            if (target.domain !== "button") this.awaitSetting(target, value);
          }
          applied.add(target.id);
        }
      } catch (error) {
        if (this.settingsSession === session) this.settingsNotice = error.message;
      } finally {
        if (this.settingsSession === session) {
          for (const { name, draft, plan } of edits) {
            if (plan.every(({ target }) => applied.has(target.id)) && this.settingsDrafts.get(name) === draft) {
              this.settingsDrafts.delete(name);
            }
          }
        }
        this.savingSettings = false;
        if (!this.settingsScreen.hidden) this.renderSettings();
      }
    }

    settingDisplay(name, views, value, setting) {
      const view = views[0];
      if (value === null || value === undefined || value === "") return "—";
      if (view.input.type === "checkbox") return value === true ? this.t("On", "Увімк.") : this.t("Off", "Вимк.");
      if (view.input.type === "radio") {
        const option = views.find(item => item.input.value === String(value));
        return option ? this.settingLabel(option) : String(value);
      }
      const unit = setting.unit || this.t(view.element.dataset.unit, unitsUk[view.element.dataset.unit] ?? view.element.dataset.unit);
      return `${this.settingText(value)}${unit ? " " + unit : ""}`;
    }

    openApplyConfirm(page, edits) {
      const rows = edits.map(({ name, draft }) => {
        const views = page.fields.get(name);
        const setting = this.readSetting(name);
        const caption = views[0].input.type === "radio"
          ? this.t(this.radioGroupName(name, "en"), this.radioGroupName(name, "uk")) : this.settingLabel(views[0]);
        const before = this.settingDisplay(name, views, setting.current, setting);
        const after = this.settingDisplay(name, views, draft.raw, setting);
        const risk = riskySettings[name] && draft.raw === true ? `<p class="apply-risk">${escapeHtml(local(riskySettings[name], this.config))}</p>` : "";
        return `<li${risk ? " data-risk" : ""}><span class="apply-name">${escapeHtml(caption)}</span>
          <span class="apply-change"><span>${escapeHtml(before)}</span><span aria-hidden="true">→</span><span class="sr-only">${escapeHtml(this.t("becomes", "стане"))}</span><strong>${escapeHtml(after)}</strong></span>${risk}</li>`;
      });
      this.applyList.innerHTML = rows.join("");
      for (const node of this.applyConfirm.querySelectorAll("[data-uk-text]")) node.textContent = node.getAttribute(`data-${this.t("en", "uk")}-text`);
      if (!this.applyConfirm.open) this.applyConfirm.showModal();
      this.applyConfirm.querySelector(edits.some(({ name }) => riskySettings[name]) ? "[data-apply-cancel]" : "[data-apply-go]").focus();
    }

    radioGroupName(name, lang) {
      const names = {
        battery_mode: ["Battery mode", "Режим АКБ"], work_mode: ["Work mode", "Режим роботи"],
        energy_pattern: ["Energy pattern", "Пріоритет"], grid_frequency: ["Grid frequency", "Частота мережі"],
        grid_type: ["Grid type", "Тип мережі"], gen_port_mode: ["Gen port mode", "Режим порту генератора"],
        adv_parallel_role: ["Parallel role", "Роль у паралелі"], adv_parallel_phase: ["Parallel phase", "Фаза в паралелі"],
      }[name] ?? [name, name];
      return lang === "en" ? names[0] : names[1];
    }

    async writeSetting({ id, domain }, value) {
      try {
        const target = { entity_id: id };
        if (domain === "number") await this.hassData.callService(domain, "set_value", { value }, target);
        else if (domain === "select") await this.hassData.callService(domain, "select_option", { option: value }, target);
        else if (domain === "time") await this.hassData.callService(domain, "set_value", { time: value }, target);
        else if (domain === "datetime") await this.hassData.callService(domain, "set_value", { datetime:value }, target);
        else if (domain === "button") await this.hassData.callService(domain, "press", {}, target);
        else await this.hassData.callService(domain, value ? "turn_on" : "turn_off", {}, target);
      } catch {
        throw new Error(this.t("Home Assistant rejected the change. Check the entity and try again.", "Home Assistant не прийняв зміну. Перевір сутність і повтори спробу."));
      }
    }

    awaitSetting({ id, domain }, value) {
      clearTimeout(this.pendingSettings.get(id)?.timer);
      const pending = { domain, value, expired: false };
      this.pendingSettings.set(id, pending);
      pending.timer = setTimeout(() => {
        pending.expired = true;
        if (!this.settingsScreen.hidden) this.renderSettings();
      }, settingTimeout);
      this.reconcileSettings();
    }

    setGauge(key, wattsValue) {
      const { value, fill, gloss } = this.gauges[key];
      const magnitude = Math.abs(wattsValue ?? 0);
      const fraction = magnitude < flowThreshold ? 0 : Math.min(magnitude / (this.scale * 1000), 1);
      value.textContent = formatPower(wattsValue);
      value.toggleAttribute("data-unavailable", wattsValue === null);
      const path = fraction === 0 ? "" : arc(0, fraction);
      fill.setAttribute("d", path);
      gloss?.setAttribute("d", path);
      const gauge = this.gauges[key];
      gauge.hud ??= [...gauge.element.querySelectorAll(".hud-glow, .hud-edge, .hud-fill")];
      const hud = fraction === 0 ? "" : arc3d(fraction);
      for (const path of gauge.hud) path.setAttribute("d", hud);
      gauge.element.toggleAttribute("data-active", fraction > 0);
    }

    setFlow(name, power) {
      const direction = power === null || Math.abs(power) < flowThreshold ? "off" : power > 0 ? "forward" : "backward";
      this.wires[name].dataset.flow = direction;
      (this.flowPower ??= {})[name] = power === null ? 0 : Math.abs(power);
      this.syncFlowEngine();
    }

    syncFlowEngine() {
      const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      const active = this.isConnected && this.dataset.theme === "technika" && !reduce && this.wires
        && Object.values(this.wires).some(wire => wire?.dataset.flow !== "off");
      if (active && !this.flowFrame) {
        this.flowLast = performance.now();
        this.flowFrame = requestAnimationFrame(now => this.flowTick(now));
      } else if (!active && this.flowFrame) {
        cancelAnimationFrame(this.flowFrame);
        this.flowFrame = 0;
      }
      if (!active && this.wires) for (const wire of Object.values(this.wires)) clearFlowLayer(wire?.querySelector(".flow-layer"));
    }

    flowTick(now) {
      this.flowFrame = 0;
      const dt = Math.min(.1, Math.max(0, (now - this.flowLast) / 1000));
      this.flowLast = now;
      const style = this.visualConfig().lcd_particles ?? "dot";
      const appearance = this.dataset.appearance;
      const svg = "http://www.w3.org/2000/svg";
      const make = (tag, attrs) => { const node = document.createElementNS(svg, tag); for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); return node; };
      // Speed and the number of particles follow the power on each line: a quiet line crawls, a busy one streams.
      for (const [name, wire] of Object.entries(this.wires ?? {})) {
        const layer = wire?.querySelector(".flow-layer");
        if (!layer) continue;
        const direction = wire.dataset.flow;
        if (direction === "off") { if (layer.firstChild || layer.dataset.key) clearFlowLayer(layer); continue; }
        const state = (this.flowState ??= {})[name] ??= { phase:Math.random(), sparks:[] };
        const track = wire.querySelector(".wire-track");
        if (!state.length || state.track !== track) { state.track = track; state.length = track.getTotalLength(); }
        const share = Math.min(1, Math.max(.05, (this.flowPower?.[name] ?? 0) / Math.max(1, (this.scale || 1) * 1000)));
        const duration = 3.4 - 2.2 * share;
        const count = Math.max(1, Math.round(1 + share * 3));
        state.phase = (state.phase + dt / duration) % 1;
        const key = `${style}|${count}|${appearance}`;
        if (layer.dataset.key !== key) {
          layer.dataset.key = key;
          layer.dataset.level = String(Math.min(4, count));
          layer.replaceChildren();
          state.sparks = [];
          for (let index = 0; index < count; index++) {
            if (style === "glow") {
              const group = make("g", {});
              const halo = make("g", {});
              for (const [r, o] of [[5.6, .14], [4.2, .24], [3.1, .36]]) halo.append(make("circle", { r, class:"flow-glow-halo", opacity:o }));
              group.append(halo, make("circle", { r:1.8, class:"flow-core" }));
              layer.append(group);
            } else if (style === "packet") {
              const group = make("g", {});
              group.append(make("path", { class:"flow-tail flow-tail-glow", "stroke-width":3, opacity:.35 }), make("path", { class:"flow-tail", "stroke-width":2.2 }),
                make("circle", { r:1.6, class:"flow-core" }));
              layer.append(group);
            } else {
              const group = make("g", { class:"technika-particle" });
              group.innerHTML = '<circle r="3.7" class="particle-halo" opacity=".22"/><circle r="2.5" class="particle-edge"/><circle r="1.9" class="particle-body"/><circle r=".85" cx="-.52" cy="-.58" fill="#f6fcea"/>';
              layer.append(group);
            }
          }
          if (style === "packet") for (let index = 0; index < 8; index++) layer.append(make("circle", { r:.9, class:"flow-spark", opacity:0 }));
        }
        const sign = direction === "forward" ? 1 : -1;
        const at = (distance) => track.getPointAtLength(Math.min(state.length, Math.max(0, distance)));
        for (let index = 0; index < count; index++) {
          const node = layer.children[index];
          const t = (state.phase + index / count) % 1;
          const distance = state.length * (sign > 0 ? t : 1 - t);
          const point = at(distance);
          const alpha = Math.min(1, t * 7, (1 - t) * 7).toFixed(3);
          node.setAttribute("opacity", alpha);
          if (style === "packet") {
            const tail = [5, 4, 3, 2, 1, 0].map(step => at(distance - sign * 15 * step / 5));
            const near = tail.slice(3);
            node.children[0].setAttribute("d", "M" + tail.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L"));
            node.children[1].setAttribute("d", "M" + near.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L"));
            node.children[2].setAttribute("cx", point.x.toFixed(1));
            node.children[2].setAttribute("cy", point.y.toFixed(1));
            if (Math.random() < .25 && state.sparks.length < 8) state.sparks.push({ x:point.x, y:point.y, vx:(Math.random() - .5) * 26, vy:(Math.random() - .5) * 26, life:1 });
          } else {
            node.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
          }
        }
        if (style === "packet") {
          const pool = [...layer.children].slice(count);
          state.sparks = state.sparks.filter(spark => (spark.life -= dt * 2.6) > 0);
          pool.forEach((circle, index) => {
            const spark = state.sparks[index];
            if (!spark) { circle.setAttribute("opacity", 0); return; }
            spark.x += spark.vx * dt; spark.y += spark.vy * dt;
            circle.setAttribute("cx", spark.x.toFixed(1)); circle.setAttribute("cy", spark.y.toFixed(1));
            circle.setAttribute("opacity", spark.life.toFixed(2));
          });
        }
      }
      if (this.isConnected) this.flowFrame = requestAnimationFrame(next => this.flowTick(next));
    }

    updateStatus(states, readings) {
      const status = states[this.config.inverter_status]?.state?.trim();
      const hasPower = readings.some(value => value !== null);
      const known = status && status !== "unknown" && status !== "unavailable";
      const label = known ? status : this.config.inverter_status || !hasPower ? "—" : "ON";
      const kind = label === "—" ? "missing" : /^(?:F\d|fault|alarm|error|off$)/i.test(label) ? "fault" : "normal";
      // 0.8.32 · the circle always shows a short word: «ON» while working, a fault code / «OFF» / «ERR» on a fault.
      // The full state («Single…», «Normal», «Standby») stays in the tooltip and for screen readers.
      const code = /^F\d{1,3}\b/i.exec(label)?.[0].toUpperCase();
      const shown = kind === "missing" ? "—" : kind === "normal" ? "ON" : code ?? (/^off$/i.test(label) ? "OFF" : "ERR");
      this.statusLabel.textContent = shown;
      this.statusLabel.setAttribute("aria-label", label);
      this.statusLabel.toggleAttribute("data-on", shown === "ON");
      this.statusLabel.toggleAttribute("data-long", shown.length > 3);
      this.screen.dataset.status = kind;
    }

    updateCharge(states) {
      const primary = charge(states[this.config.battery_soc]);
      const second = charge(states[this.config.battery_soc_2]);
      const level = (node, value) => {
        // Colour by charge: below 30 % red, below 50 % yellow, otherwise green.
        if (value === null) node.removeAttribute("data-level");
        else node.dataset.level = value < 30 ? "low" : value < 50 ? "mid" : "ok";
      };
      this.socLeft.textContent = percent(primary);
      this.socRight.textContent = percent(second);
      level(this.socLeft, primary);
      level(this.socRight, second);
      const separate = batterySeparate(this.config) && this.inverterCount > 1;
      const banks = separate ? installedInverters(this.config).map(index => ({
        charge: charge(states[this.config[inverterField(index, "battery_soc")]]),
        capacity: Number(this.config[inverterField(index, "battery_soc_capacity_kwh")]),
      })) : [];
      const weighted = separate && banks.every(bank => Number.isFinite(bank.capacity) && bank.capacity > 0 && bank.charge !== null);
      this.socLabel.toggleAttribute("data-unweighted", separate && !weighted);
      const weightedSoc = weighted ? banks.reduce((sum, bank) => sum + bank.capacity * bank.charge, 0) /
        banks.reduce((sum, bank) => sum + bank.capacity, 0) : null;
      this.socLabel.textContent = !separate ? percent(primary) : weighted ? percent(weightedSoc)
        : banks.map(bank => percent(bank.charge)).join("·");
      const shown = !separate ? primary : weighted ? weightedSoc : null;
      const lowest = separate && !weighted && banks.every(bank => bank.charge !== null) ? Math.min(...banks.map(bank => bank.charge)) : null;
      level(this.socLabel, shown ?? lowest);
      this.runtimeSoc = shown ?? lowest;
      // ТЕХНіКА battery icon fills with the charge, like a glass jar.
      const fillLevel = shown ?? lowest;
      this.batteryFill ??= this.screen.querySelector('[data-gauge="battery_power"] .bat-fill');
      if (this.batteryFill) {
        this.batteryFill.setAttribute("width", fillLevel === null ? "0" : (34.8 * Math.min(100, Math.max(0, fillLevel)) / 100).toFixed(2));
        this.batteryFill.setAttribute("fill", fillLevel === null ? "none" : `url(#deye-bat-${fillLevel < 30 ? "low" : fillLevel < 50 ? "mid" : "ok"})`);
      }
    }

    updateBatteryTime(states, battery) {
      // 0.8.37 · «⏱ 2г 45хв»: time to 100 % while charging, to the cut-off while discharging; hidden at rest.
      if (!this.batTime) return;
      const info = mainRuntime(this.config, states, this.runtimeSoc ?? null, battery);
      this.batTime.toggleAttribute("hidden", !info);
      if (!info) { delete this.batTime.dataset.dir; return; }
      this.batTime.dataset.dir = info.charging ? "charge" : "discharge";
      const text = shortDuration(info.minutes, preferEnglish(this.config));
      if (this.batTimeText.textContent !== text) {
        this.batTimeText.textContent = text;
        // Centre the clock and the text together under the gauge centre.
        const width = this.batTimeText.getComputedTextLength?.() || text.length * 5;
        this.batTime.style.setProperty("--bt-shift", `${-(width + 5.2 + 3.4) / 2 + 3.4}px`);
      }
    }

    update3d(force = false) {
      // Pictures are only requested while the 3D theme is on; day or night follows sun.sun.
      if (this.dataset.look !== "3d") return;
      const night = this.hassData?.states?.["sun.sun"]?.state === "below_horizon";
      const scene = this.dataset.scene === "scene";
      const outage = Boolean(this.gridOff3d);
      if (!force && this.night3d === night && this.scene3d === scene && this.outage3d === outage) return;
      this.night3d = night;
      this.scene3d = scene;
      this.outage3d = outage;
      this.toggleAttribute("data-night", night);
      for (const image of this.screen.querySelectorAll("[data-obj3d], [data-src3d], [data-scene3d]")) {
        // Only the pictures of the chosen view are requested: the scene, or a picture in every gauge.
        const inGauge = Boolean(image.closest(".sep3d"));
        if (image.hasAttribute("data-scene3d") ? !scene : inGauge && scene) continue;
        if (!image.hasAttribute("data-watch3d")) {
          // A picture that cannot be loaded switches the card back to the usual ТЕХНіКА gauges instead of empty circles.
          image.setAttribute("data-watch3d", "");
          image.addEventListener("error", () => this.missing3d());
        }
        // 0.8.37 · No grid: the scene and the grid picture show the repair crew at the poles.
        if (image.hasAttribute("data-scene3d")) image.setAttribute("href", asset3d(`scene_${night ? "night" : "day"}_summer${outage ? "_outage" : ""}`));
        else if (image.dataset.obj3d === "grid" && outage) image.setAttribute("href", asset3d(`grid_${night ? "night" : "day"}_summer_outage`));
        else if (image.dataset.obj3d) image.setAttribute("href", picture3d(image.dataset.obj3d, night));
        else if (!image.getAttribute("href")) image.setAttribute("href", asset3d(image.dataset.src3d));
      }
    }

    missing3d() {
      if (this.missing3dFiles || this.dataset.look !== "3d") return;
      this.missing3dFiles = true;
      delete this.dataset.look;
      this.removeAttribute("data-night");
      if (!this.appearanceDialog.hidden && !this.workshopView) this.renderAppearance();
    }

    update() {
      this.update3d();
      if (!this.config || !this.hassData?.states) {
        if (!this.settingsScreen.hidden) this.renderSettings();
        return;
      }
      const states = this.hassData.states;
      const total = (key) => powerTotal(powerSources(this.config, gaugeByKey[key]), states, key === "pv_power");
      const grid = total("grid_power");
      const gridDisconnected = installedInverters(this.config).every(index => isGridDisconnected(
        states[this.config[inverterField(index, "grid_connected")]], states[this.config[inverterField(index, "grid_voltage")]],
      ));
      const batteryRaw = total("battery_power");
      const battery = batteryRaw === null ? null : batteryRaw * (this.config.battery_power_x2 === true ? 2 : 1);
      const load = total("load_power");
      const pv = total("pv_power");
      this.setGauge("grid_power", grid);
      this.setGauge("battery_power", battery);
      this.setGauge("load_power", load);
      this.setGauge("pv_power", pv);
      this.updateCharge(states);
      this.updateBatteryTime(states, battery);
      this.toggleAttribute("data-grid-off", gridDisconnected);
      this.gridOff3d = gridDisconnected;
      this.update3d();
      this.setFlow("solar", pv);
      this.wires.grid.toggleAttribute("data-disconnected", gridDisconnected);
      this.setFlow("grid", gridDisconnected ? null : grid);
      // 0.8.36 · particles on the power-line wires of the 3D pictures follow the Grid line.
      const poles = this.dataset.look === "3d" && this.dataset.motion !== "off" && !gridDisconnected ? grid : null;
      const sceneView = this.dataset.scene === "scene";
      for (let k = 0; k < 3; k++) {
        this.setFlow(`pole_tile_${k}`, sceneView ? null : poles);
        this.setFlow(`pole_scene_${k}`, sceneView ? poles : null);
      }
      this.setFlow("battery", signed(battery, true));
      this.setFlow("load", load);
      // Meaning colours: after normalisation a negative battery power charges, a negative grid power exports.
      const direction = (value, negative, positive) => value === null || Math.abs(value) < flowThreshold ? "idle" : value < 0 ? negative : positive;
      this.screen.dataset.batteryFlow = direction(battery, "charge", "discharge");
      this.screen.dataset.gridFlow = gridDisconnected ? "idle" : direction(grid, "export", "import");
      const genActive = generatorActive(this.config, states);
      // The editor preview always shows the generator, so it can be set up before it ever runs.
      this.generatorGroup.toggleAttribute("hidden", !genActive && !this.editorPreview);
      this.generatorPower.textContent = genActive || this.editorPreview ? formatPower(total("generator_power")) : "—";
      this.updateStatus(states, [grid, load, battery]);
      if (this.detailsKey) this.updateDetails();
      if (!this.settingsScreen.hidden) this.renderSettings();
      else if (this.pendingSettings.size) this.reconcileSettings();
      if (this.clockZone !== this.hassData.config?.time_zone) this.updateClock();
    }
  }

  const supportUrl = "https://send.monobank.ua/jar/9TWGTUBwUd";
  const supportQrSize = 37;
  const supportQrPath = "M4 4h7v1h-7zM12 4h1v1h-1zM17 4h1v1h-1zM19 4h2v1h-2zM26 4h7v1h-7zM4 5h1v1h-1zM10 5h1v1h-1zM12 5h1v1h-1zM15 5h2v1h-2zM23 5h2v1h-2zM26 5h1v1h-1zM32 5h1v1h-1zM4 6h1v1h-1zM6 6h3v1h-3zM10 6h1v1h-1zM12 6h2v1h-2zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h5v1h-5zM26 6h1v1h-1zM28 6h3v1h-3zM32 6h1v1h-1zM4 7h1v1h-1zM6 7h3v1h-3zM10 7h1v1h-1zM12 7h3v1h-3zM16 7h1v1h-1zM18 7h3v1h-3zM22 7h2v1h-2zM26 7h1v1h-1zM28 7h3v1h-3zM32 7h1v1h-1zM4 8h1v1h-1zM6 8h3v1h-3zM10 8h1v1h-1zM13 8h2v1h-2zM16 8h2v1h-2zM20 8h1v1h-1zM22 8h1v1h-1zM24 8h1v1h-1zM26 8h1v1h-1zM28 8h3v1h-3zM32 8h1v1h-1zM4 9h1v1h-1zM10 9h1v1h-1zM12 9h3v1h-3zM17 9h1v1h-1zM20 9h1v1h-1zM22 9h2v1h-2zM26 9h1v1h-1zM32 9h1v1h-1zM4 10h7v1h-7zM12 10h1v1h-1zM14 10h1v1h-1zM16 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM22 10h1v1h-1zM24 10h1v1h-1zM26 10h7v1h-7zM14 11h2v1h-2zM18 11h2v1h-2zM21 11h3v1h-3zM4 12h2v1h-2zM8 12h3v1h-3zM14 12h1v1h-1zM16 12h1v1h-1zM20 12h3v1h-3zM24 12h1v1h-1zM27 12h1v1h-1zM29 12h4v1h-4zM4 13h1v1h-1zM7 13h1v1h-1zM9 13h1v1h-1zM11 13h1v1h-1zM17 13h2v1h-2zM20 13h3v1h-3zM26 13h1v1h-1zM28 13h5v1h-5zM6 14h1v1h-1zM10 14h2v1h-2zM13 14h2v1h-2zM18 14h3v1h-3zM22 14h1v1h-1zM27 14h1v1h-1zM32 14h1v1h-1zM5 15h2v1h-2zM8 15h1v1h-1zM12 15h2v1h-2zM16 15h1v1h-1zM19 15h1v1h-1zM21 15h5v1h-5zM29 15h1v1h-1zM31 15h2v1h-2zM5 16h3v1h-3zM10 16h3v1h-3zM15 16h1v1h-1zM17 16h2v1h-2zM20 16h2v1h-2zM24 16h2v1h-2zM31 16h1v1h-1zM4 17h1v1h-1zM6 17h1v1h-1zM11 17h4v1h-4zM16 17h1v1h-1zM18 17h1v1h-1zM20 17h3v1h-3zM26 17h7v1h-7zM6 18h6v1h-6zM15 18h5v1h-5zM24 18h1v1h-1zM27 18h4v1h-4zM32 18h1v1h-1zM4 19h1v1h-1zM7 19h3v1h-3zM11 19h1v1h-1zM13 19h1v1h-1zM15 19h1v1h-1zM17 19h1v1h-1zM21 19h1v1h-1zM26 19h1v1h-1zM28 19h1v1h-1zM31 19h2v1h-2zM4 20h2v1h-2zM7 20h1v1h-1zM9 20h3v1h-3zM14 20h1v1h-1zM16 20h2v1h-2zM21 20h1v1h-1zM23 20h3v1h-3zM31 20h1v1h-1zM4 21h1v1h-1zM6 21h2v1h-2zM9 21h1v1h-1zM13 21h2v1h-2zM17 21h2v1h-2zM20 21h1v1h-1zM22 21h1v1h-1zM26 21h4v1h-4zM31 21h2v1h-2zM6 22h2v1h-2zM10 22h3v1h-3zM14 22h1v1h-1zM19 22h1v1h-1zM21 22h1v1h-1zM30 22h1v1h-1zM32 22h1v1h-1zM6 23h4v1h-4zM13 23h2v1h-2zM16 23h1v1h-1zM18 23h1v1h-1zM21 23h3v1h-3zM31 23h2v1h-2zM4 24h2v1h-2zM8 24h6v1h-6zM15 24h1v1h-1zM17 24h2v1h-2zM20 24h2v1h-2zM23 24h7v1h-7zM32 24h1v1h-1zM12 25h1v1h-1zM16 25h1v1h-1zM20 25h1v1h-1zM23 25h2v1h-2zM28 25h1v1h-1zM32 25h1v1h-1zM4 26h7v1h-7zM13 26h1v1h-1zM15 26h6v1h-6zM23 26h2v1h-2zM26 26h1v1h-1zM28 26h3v1h-3zM32 26h1v1h-1zM4 27h1v1h-1zM10 27h1v1h-1zM12 27h1v1h-1zM15 27h1v1h-1zM17 27h1v1h-1zM19 27h1v1h-1zM21 27h1v1h-1zM23 27h2v1h-2zM28 27h1v1h-1zM4 28h1v1h-1zM6 28h3v1h-3zM10 28h1v1h-1zM12 28h2v1h-2zM16 28h2v1h-2zM20 28h10v1h-10zM31 28h1v1h-1zM4 29h1v1h-1zM6 29h3v1h-3zM10 29h1v1h-1zM14 29h1v1h-1zM17 29h2v1h-2zM20 29h3v1h-3zM25 29h1v1h-1zM32 29h1v1h-1zM4 30h1v1h-1zM6 30h3v1h-3zM10 30h1v1h-1zM14 30h1v1h-1zM19 30h1v1h-1zM22 30h4v1h-4zM29 30h4v1h-4zM4 31h1v1h-1zM10 31h1v1h-1zM12 31h1v1h-1zM16 31h1v1h-1zM18 31h5v1h-5zM24 31h1v1h-1zM28 31h2v1h-2zM31 31h2v1h-2zM4 32h7v1h-7zM12 32h4v1h-4zM17 32h6v1h-6zM24 32h1v1h-1zM26 32h1v1h-1zM28 32h1v1h-1zM31 32h1v1h-1z";

  customElements.define(editorTag, DeyeLcdEditor);
  customElements.define(cardTag, DeyeLcd);
  if (!customElements.get(legacyCardTag)) customElements.define(legacyCardTag, class extends DeyeLcd {});
  window.customCards = window.customCards || [];
  console.info(`%c DEYE · LCD ТЕХНіКА %c ${version} `, "color:#f5f9e6;background:#485b32;font-weight:700", "color:#485b32;background:#e7ebdf");
  window.customCards.push({
    type: cardTag,
    name: "Deye · LCD ТЕХНіКА",
    preview: true,
    documentationURL: "https://github.com/hrudkaav/deye-lcd-tehnika",
    description: `Екран Deye зі світлим, темним та автоматичним оформленням, меню System Setup і добовими графіками. ${version}.`,
  });
})();

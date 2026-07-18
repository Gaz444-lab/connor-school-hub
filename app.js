/**
 * Connor's School Hub — Grade 10 · Fish Hoek High School
 * Central daily student workspace. Data: localStorage.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "connor-school-hub-v2";
  const LEGACY_KEY = "connor-school-hub-v1";
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const SUBJECT_COLORS = [
    "#e11d48", "#7c3aed", "#2563eb", "#0891b2",
    "#16a34a", "#ca8a04", "#ea580c", "#4f46e5",
  ];

  /** Fish Hoek High · Grade 10 subjects (Connor) */
  const CONNOR_SUBJECTS = [
    { id: "sub-art", name: "Art", color: "#e11d48" },
    { id: "sub-drama", name: "Drama", color: "#7c3aed" },
    { id: "sub-eng", name: "English", color: "#2563eb" },
    { id: "sub-afr", name: "Afrikaans", color: "#0891b2" },
    { id: "sub-ml", name: "Maths Lit", color: "#16a34a" },
    { id: "sub-lo", name: "Life Orientation", color: "#ca8a04" },
    { id: "sub-hist", name: "History", color: "#ea580c" },
    { id: "sub-egd", name: "EGD", color: "#4f46e5" },
  ];

  const DEFAULT_ROUTINES = {
    morning: [
      { id: "m1", label: "Check timetable & bag for today's subjects", done: false },
      { id: "m2", label: "Homework due today packed", done: false },
      { id: "m3", label: "PE kit / Art materials / EGD gear if needed", done: false },
      { id: "m4", label: "Water bottle, lunch, charged device", done: false },
      { id: "m5", label: "Leave on time for Fish Hoek", done: false },
    ],
    afternoon: [
      { id: "a1", label: "Empty bag — letters / notices on table", done: false },
      { id: "a2", label: "Log new homework & tests in School Hub", done: false },
      { id: "a3", label: "Do highest-priority homework first", done: false },
      { id: "a4", label: "15–25 min revision for next test", done: false },
      { id: "a5", label: "Pack bag for tomorrow", done: false },
      { id: "a6", label: "Charge laptop / phone", done: false },
    ],
  };

  const DEFAULT_LINKS = [
    { id: "lk1", title: "D6 Communicator / School portal", url: "https://www.d6.co.za/", icon: "🏫" },
    { id: "lk2", title: "Google Classroom", url: "https://classroom.google.com/", icon: "📘" },
    { id: "lk3", title: "Google Drive", url: "https://drive.google.com/", icon: "📁" },
    { id: "lk4", title: "Fish Hoek High (info)", url: "https://www.fishhoekhigh.co.za/", icon: "🌊" },
    { id: "lk5", title: "YouTube (study / EGD)", url: "https://www.youtube.com/", icon: "▶️" },
  ];

  // ——— State ———
  let state = loadState();
  let currentView = "today";
  let workTab = "homework";
  let selectedDay = todayWeekdayIndex();
  let agendaDate = todayISO();
  let hwFilter = "open";
  let gradeSubjectFilter = "all";
  let toastTimer = null;
  let studyTimer = null;
  let studyRemaining = 25 * 60;
  let studyRunning = false;
  let studyMode = "focus"; // focus | break

  // ——— Persistence ———
  function defaultState() {
    return {
      version: 2,
      studentName: "Connor",
      school: "Fish Hoek High School",
      grade: "10",
      theme: "light",
      subjects: CONNOR_SUBJECTS.map((s) => ({ ...s })),
      homework: [],
      projects: [],
      tests: [],
      grades: [],
      notes: [],
      events: [],
      goals: [],
      studyLog: [],
      timetable: {},
      links: DEFAULT_LINKS.map((l) => ({ ...l })),
      routines: {
        morning: DEFAULT_ROUTINES.morning.map((r) => ({ ...r })),
        afternoon: DEFAULT_ROUTINES.afternoon.map((r) => ({ ...r })),
      },
      routineDate: todayISO(),
      studyStreak: 0,
      lastStudyDate: null,
      focusMinutes: 25,
      breakMinutes: 5,
    };
  }

  function loadState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const old = JSON.parse(legacy);
          const merged = { ...defaultState(), ...old, version: 2 };
          // Prefer Connor subject list if still on generic defaults
          if (!old.school || (old.subjects || []).some((s) => s.id === "sub-math")) {
            merged.subjects = CONNOR_SUBJECTS.map((s) => ({ ...s }));
            merged.studentName = old.studentName || "Connor";
            merged.school = "Fish Hoek High School";
            merged.grade = "10";
            merged.links = DEFAULT_LINKS.map((l) => ({ ...l }));
            merged.routines = {
              morning: DEFAULT_ROUTINES.morning.map((r) => ({ ...r, done: false })),
              afternoon: DEFAULT_ROUTINES.afternoon.map((r) => ({ ...r, done: false })),
            };
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
        return defaultState();
      }
      const parsed = JSON.parse(raw);
      const base = defaultState();
      return {
        ...base,
        ...parsed,
        subjects: parsed.subjects?.length ? parsed.subjects : base.subjects,
        links: parsed.links?.length ? parsed.links : base.links,
        routines: {
          morning: parsed.routines?.morning?.length ? parsed.routines.morning : base.routines.morning,
          afternoon: parsed.routines?.afternoon?.length ? parsed.routines.afternoon : base.routines.afternoon,
        },
        grades: parsed.grades || [],
        notes: parsed.notes || [],
        events: parsed.events || [],
        goals: parsed.goals || [],
        studyLog: parsed.studyLog || [],
      };
    } catch {
      return defaultState();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  // ——— Dates (SA-friendly) ———
  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function todayWeekdayIndex() {
    const js = new Date().getDay();
    return js === 0 ? 6 : js - 1;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
  }

  function formatLongDate(d = new Date()) {
    return d.toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const a = new Date(todayISO() + "T12:00:00");
    const b = new Date(iso + "T12:00:00");
    return Math.round((b - a) / 86400000);
  }

  function dueLabel(iso) {
    const n = daysUntil(iso);
    if (n === null) return { text: "", cls: "" };
    if (n < 0) return { text: `${Math.abs(n)}d overdue`, cls: "overdue" };
    if (n === 0) return { text: "Due today", cls: "soon" };
    if (n === 1) return { text: "Tomorrow", cls: "soon" };
    if (n <= 7) return { text: `In ${n} days`, cls: "soon" };
    return { text: formatDate(iso), cls: "" };
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  function nowHM() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function weekDatesFrom(iso) {
    const d = new Date(iso + "T12:00:00");
    const js = d.getDay();
    const monOffset = js === 0 ? -6 : 1 - js;
    const mon = new Date(d);
    mon.setDate(d.getDate() + monOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(mon);
      x.setDate(mon.getDate() + i);
      const y = x.getFullYear();
      const m = String(x.getMonth() + 1).padStart(2, "0");
      const day = String(x.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    });
  }

  // ——— Subjects ———
  function subjectById(id) {
    return state.subjects.find((s) => s.id === id) || null;
  }

  function subjectBadge(id) {
    const s = subjectById(id);
    if (!s) return "";
    return `<span class="badge subject" style="--subject:${s.color}">${esc(s.name)}</span>`;
  }

  function subjectOptions(selected, includeAll) {
    let html = includeAll ? `<option value="all" ${selected === "all" ? "selected" : ""}>All subjects</option>` : "";
    html += state.subjects
      .map((s) => `<option value="${s.id}" ${s.id === selected ? "selected" : ""}>${esc(s.name)}</option>`)
      .join("");
    return html;
  }

  // ——— Helpers ———
  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2200);
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme === "dark" ? "dark" : "light");
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = state.theme === "dark" ? "☀️" : "🌙";
  }

  function resetRoutinesIfNewDay() {
    if (state.routineDate !== todayISO()) {
      state.routineDate = todayISO();
      state.routines.morning.forEach((r) => (r.done = false));
      state.routines.afternoon.forEach((r) => (r.done = false));
      save();
    }
  }

  function subjectAverage(subjectId) {
    const marks = state.grades.filter((g) => g.subjectId === subjectId);
    if (!marks.length) return null;
    // Weighted if weights present
    let tw = 0;
    let sum = 0;
    marks.forEach((g) => {
      const w = Number(g.weight) || 1;
      const pct = (Number(g.score) / Number(g.outOf || 100)) * 100;
      sum += pct * w;
      tw += w;
    });
    return tw ? sum / tw : null;
  }

  function overallAverage() {
    const avgs = state.subjects.map((s) => subjectAverage(s.id)).filter((a) => a !== null);
    if (!avgs.length) return null;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  }

  function avgClass(n) {
    if (n === null) return "";
    if (n >= 70) return "good";
    if (n >= 50) return "warn";
    return "low";
  }

  function fmtPct(n) {
    if (n === null || n === undefined) return "—";
    return `${Math.round(n)}%`;
  }

  // ——— Modal ———
  const modalRoot = document.getElementById("modal-root");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalFooter = document.getElementById("modal-footer");

  function openModal({ title, bodyHtml, footerHtml }) {
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalFooter.innerHTML = footerHtml || "";
    modalRoot.hidden = false;
    const first = modalBody.querySelector("input, select, textarea");
    if (first) setTimeout(() => first.focus(), 40);
  }

  function closeModal() {
    modalRoot.hidden = true;
    modalBody.innerHTML = "";
    modalFooter.innerHTML = "";
  }

  modalRoot.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-modal]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalRoot.hidden) closeModal();
  });

  // ——— Navigation ———
  function setView(view) {
    currentView = view || "today";
    render();
  }

  // Left sidebar (and settings in sidebar footer)
  document.querySelector(".sidebar")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (btn) setView(btn.dataset.view);
  });

  document.querySelector(".topbar-actions")?.addEventListener("click", (e) => {
    if (e.target.closest("#theme-toggle")) {
      state.theme = state.theme === "dark" ? "light" : "dark";
      save();
      applyTheme();
      return;
    }
    if (e.target.closest("#quick-add")) {
      openQuickAdd();
      return;
    }
  });

  function openQuickAdd() {
    openModal({
      title: "Quick add",
      bodyHtml: `
        <div class="quick-menu">
          <button type="button" data-qa="hw"><span>📝</span>Homework</button>
          <button type="button" data-qa="test"><span>📋</span>Test / exam</button>
          <button type="button" data-qa="project"><span>🚀</span>Project</button>
          <button type="button" data-qa="grade"><span>📊</span>Grade / mark</button>
          <button type="button" data-qa="note"><span>📓</span>Note</button>
          <button type="button" data-qa="event"><span>📅</span>Event</button>
          <button type="button" data-qa="goal"><span>🎯</span>Goal</button>
          <button type="button" data-qa="study"><span>⏱️</span>Start study</button>
        </div>`,
      footerHtml: `<button type="button" class="btn btn-ghost" data-close-modal>Close</button>`,
    });
    modalBody.querySelectorAll("[data-qa]").forEach((btn) => {
      btn.onclick = () => {
        const t = btn.dataset.qa;
        closeModal();
        if (t === "hw") openHomeworkModal(null);
        else if (t === "test") openTestModal(null);
        else if (t === "project") openProjectModal(null);
        else if (t === "grade") openGradeModal(null);
        else if (t === "note") openNoteModal(null);
        else if (t === "event") openEventModal(null);
        else if (t === "goal") openGoalModal(null);
        else if (t === "study") setView("study");
      };
    });
  }

  // ——— Render ———
  function render() {
    resetRoutinesIfNewDay();
    const schoolLine = `${state.school || "School"} · Grade ${state.grade || "—"}`;
    document.getElementById("date-line").textContent = formatLongDate();
    document.getElementById("app-title").textContent = `${state.studentName}'s School Hub`;
    const schoolEl = document.getElementById("sidebar-school");
    if (schoolEl) schoolEl.textContent = schoolLine;
    document.title = `${state.studentName}'s School Hub · Gr ${state.grade}`;

    // Highlight active nav (including Settings in sidebar footer)
    document.querySelectorAll(".sidebar [data-view]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === currentView);
    });

    const main = document.getElementById("main");
    const map = {
      today: renderToday,
      agenda: renderAgenda,
      work: renderWork,
      grades: renderGrades,
      study: renderStudy,
      timetable: renderTimetable,
      routines: renderRoutines,
      notes: renderNotes,
      goals: renderGoals,
      links: renderLinks,
      settings: renderSettings,
    };
    main.innerHTML = (map[currentView] || renderToday)();
    bindMain(main);
  }

  // ——— TODAY ———
  function renderToday() {
    const openHw = state.homework.filter((h) => !h.done);
    const dueToday = openHw.filter((h) => h.due === todayISO());
    const overdue = openHw.filter((h) => daysUntil(h.due) !== null && daysUntil(h.due) < 0);
    const dueSoon = openHw
      .filter((h) => {
        const n = daysUntil(h.due);
        return n !== null && n >= 0 && n <= 3;
      })
      .sort((a, b) => (a.due || "").localeCompare(b.due || ""));
    const upcomingTests = state.tests
      .filter((t) => !t.done && daysUntil(t.date) !== null && daysUntil(t.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
    const dayName = DAYS[todayWeekdayIndex()];
    const periods = (state.timetable[dayName] || []).slice().sort(sortPeriods);
    const hm = nowHM();
    const nextPeriod = periods.find((p) => (p.end || p.start || "") > hm);
    const openGoals = state.goals.filter((g) => !g.done).slice(0, 3);
    const avg = overallAverage();
    const mDone = state.routines.morning.filter((r) => r.done).length;
    const aDone = state.routines.afternoon.filter((r) => r.done).length;

    return `
      <div class="greeting">
        <h2>${greeting()}, ${esc(state.studentName)}! 👋</h2>
        <p>Your Grade ${esc(state.grade)} command centre for the day.</p>
        <span class="school-tag">${esc(state.school)}</span>
        ${state.studyStreak > 0 ? `<span class="streak" style="margin-left:6px">🔥 ${state.studyStreak}-day study streak</span>` : ""}
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-value">${dueToday.length + overdue.length}</div><div class="stat-label">Due / late</div></div>
        <div class="stat"><div class="stat-value">${openHw.length}</div><div class="stat-label">Open HW</div></div>
        <div class="stat"><div class="stat-value">${upcomingTests.length}</div><div class="stat-label">Tests ahead</div></div>
        <div class="stat"><div class="stat-value">${fmtPct(avg)}</div><div class="stat-label">Avg mark</div></div>
      </div>
      ${
        nextPeriod
          ? (() => {
              const sub = subjectById(nextPeriod.subjectId);
              return `<div class="card mb-12">
                <h3 class="card-title">Up next · ${esc(dayName)}</h3>
                <div class="period now" style="--subject:${sub?.color || "var(--accent-bright)"}">
                  <div class="period-time">${esc(nextPeriod.start || "")}<br>${esc(nextPeriod.end || "")}</div>
                  <div>
                    <div class="period-subject">${esc(sub?.name || "Class")}</div>
                    ${nextPeriod.room ? `<div class="period-room">Room ${esc(nextPeriod.room)}</div>` : ""}
                  </div>
                </div>
              </div>`;
            })()
          : ""
      }
      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">Focus now <span class="count">${dueSoon.length + overdue.length}</span></h3>
          ${
            overdue.length || dueSoon.length
              ? `<div class="item-list">${[...overdue, ...dueSoon]
                  .slice(0, 6)
                  .map((h) => homeworkItemHtml(h, true))
                  .join("")}</div>`
              : `<div class="empty"><div class="empty-icon">✨</div><p>Nothing urgent. Great time to revise or get ahead.</p>
                 <button type="button" class="btn btn-secondary btn-sm" data-goto="study">Start a study block</button></div>`
          }
        </div>
        <div class="card">
          <h3 class="card-title">Today's classes <span class="count">${dayName}</span></h3>
          ${
            periods.length
              ? periods
                  .map((p) => {
                    const sub = subjectById(p.subjectId);
                    const isNow = p.start && p.end && hm >= p.start && hm <= p.end;
                    return `
                    <div class="period ${isNow ? "now" : ""}" style="--subject:${sub?.color || "var(--accent-bright)"}">
                      <div class="period-time">${esc(p.start || "")}<br>${esc(p.end || "")}</div>
                      <div>
                        <div class="period-subject">${esc(sub?.name || "Class")}</div>
                        ${p.room ? `<div class="period-room">Room ${esc(p.room)}</div>` : ""}
                      </div>
                    </div>`;
                  })
                  .join("")
              : `<div class="empty"><p>No timetable for ${esc(dayName)} yet.</p>
                 <button type="button" class="btn btn-secondary btn-sm" data-goto="timetable">Set schedule</button></div>`
          }
        </div>
      </div>
      <div class="grid-2 mt-12">
        <div class="card">
          <h3 class="card-title">Upcoming tests</h3>
          ${
            upcomingTests.length
              ? `<div class="item-list">${upcomingTests.map((t) => testItemHtml(t, true)).join("")}</div>`
              : `<p class="text-sm text-muted">No tests logged. Add them when teachers announce.</p>`
          }
        </div>
        <div class="card">
          <h3 class="card-title">Routines · goals</h3>
          <p class="text-sm text-muted mb-8">Morning ${mDone}/${state.routines.morning.length} · After school ${aDone}/${state.routines.afternoon.length}</p>
          <div class="progress-bar mb-12"><span style="width:${routinePct()}%"></span></div>
          ${
            openGoals.length
              ? openGoals
                  .map(
                    (g) =>
                      `<div class="item-meta mb-8"><span class="badge type-goal">🎯</span> ${esc(g.title)}</div>`
                  )
                  .join("")
              : `<p class="text-sm text-muted mb-8">No open goals — set one in More → Goals.</p>`
          }
          <div class="flex-between">
            <button type="button" class="btn btn-secondary btn-sm" data-goto="routines">Checklists</button>
            <button type="button" class="btn btn-secondary btn-sm" data-goto="goals">Goals</button>
            <button type="button" class="btn btn-primary btn-sm" id="quick-add-today">＋ Add</button>
          </div>
        </div>
      </div>`;
  }

  function routinePct() {
    const all = [...state.routines.morning, ...state.routines.afternoon];
    if (!all.length) return 0;
    return Math.round((all.filter((r) => r.done).length / all.length) * 100);
  }

  // ——— AGENDA ———
  function agendaItemsFor(iso) {
    const items = [];
    state.homework
      .filter((h) => h.due === iso)
      .forEach((h) => items.push({ kind: "hw", sort: "1", data: h }));
    state.tests
      .filter((t) => t.date === iso)
      .forEach((t) => items.push({ kind: "test", sort: "2", data: t }));
    state.projects
      .filter((p) => p.due === iso)
      .forEach((p) => items.push({ kind: "project", sort: "3", data: p }));
    state.events
      .filter((e) => e.date === iso)
      .forEach((e) => items.push({ kind: "event", sort: e.time || "4", data: e }));
    return items.sort((a, b) => String(a.sort).localeCompare(String(b.sort)));
  }

  function renderAgenda() {
    const week = weekDatesFrom(agendaDate);
    const items = agendaItemsFor(agendaDate);
    return `
      <div class="view-header">
        <div>
          <h2>Agenda</h2>
          <p>Week overview — homework, tests, events</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-event">+ Event</button>
      </div>
      <div class="calendar-strip">
        ${week
          .map((iso) => {
            const d = new Date(iso + "T12:00:00");
            const has = agendaItemsFor(iso).length > 0;
            const isToday = iso === todayISO();
            const sel = iso === agendaDate;
            return `<button type="button" class="cal-day ${isToday ? "today" : ""} ${sel ? "selected" : ""} ${has ? "has-items" : ""}" data-agenda-date="${iso}">
              ${d.toLocaleDateString("en-ZA", { weekday: "short" })}
              <strong>${d.getDate()}</strong>
            </button>`;
          })
          .join("")}
      </div>
      <div class="flex-between mb-12">
        <strong>${formatDate(agendaDate)}</strong>
        <button type="button" class="btn btn-ghost btn-sm" data-action="agenda-today">Jump to today</button>
      </div>
      <div class="card">
        ${
          items.length
            ? `<div class="item-list">${items
                .map((it) => {
                  if (it.kind === "hw") return homeworkItemHtml(it.data, true);
                  if (it.kind === "test") return testItemHtml(it.data, true);
                  if (it.kind === "project") return projectItemHtml(it.data, true);
                  return eventItemHtml(it.data);
                })
                .join("")}</div>`
            : `<div class="empty"><div class="empty-icon">📅</div><p>Nothing scheduled this day.</p>
               <button type="button" class="btn btn-secondary btn-sm" data-action="add-event">Add event</button></div>`
        }
      </div>`;
  }

  function eventItemHtml(e) {
    return `
      <div class="item">
        <div class="item-body">
          <p class="item-title">${esc(e.title)}</p>
          <div class="item-meta">
            <span class="badge type-event">Event</span>
            ${e.time ? `<span>${esc(e.time)}</span>` : ""}
            ${e.notes ? `<span>${esc(e.notes.slice(0, 40))}</span>` : ""}
          </div>
        </div>
        <div class="item-actions">
          <button type="button" class="icon-btn" data-action="edit-event" data-id="${e.id}">✏️</button>
          <button type="button" class="icon-btn" data-action="del-event" data-id="${e.id}">🗑️</button>
        </div>
      </div>`;
  }

  // ——— WORK (homework + projects + tests) ———
  function renderWork() {
    return `
      <div class="view-header">
        <div>
          <h2>Work</h2>
          <p>Homework, projects & tests in one place</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-work">+ Add</button>
      </div>
      <div class="tabs">
        <button type="button" class="tab ${workTab === "homework" ? "active" : ""}" data-work-tab="homework">Homework</button>
        <button type="button" class="tab ${workTab === "projects" ? "active" : ""}" data-work-tab="projects">Projects</button>
        <button type="button" class="tab ${workTab === "tests" ? "active" : ""}" data-work-tab="tests">Tests</button>
      </div>
      ${workTab === "homework" ? renderHomeworkPanel() : ""}
      ${workTab === "projects" ? renderProjectsPanel() : ""}
      ${workTab === "tests" ? renderTestsPanel() : ""}`;
  }

  function renderHomeworkPanel() {
    let list = state.homework.slice();
    if (hwFilter === "open") list = list.filter((h) => !h.done);
    else if (hwFilter === "done") list = list.filter((h) => h.done);
    list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.due || "9999").localeCompare(b.due || "9999");
    });
    return `
      <div class="filters">
        <button type="button" class="chip ${hwFilter === "open" ? "active" : ""}" data-hw-filter="open">To do</button>
        <button type="button" class="chip ${hwFilter === "done" ? "active" : ""}" data-hw-filter="done">Done</button>
        <button type="button" class="chip ${hwFilter === "all" ? "active" : ""}" data-hw-filter="all">All</button>
      </div>
      <div class="card">
        ${
          list.length
            ? `<div class="item-list">${list.map((h) => homeworkItemHtml(h)).join("")}</div>`
            : `<div class="empty"><div class="empty-icon">📝</div><p>No homework here. Use ＋ when teachers set work.</p></div>`
        }
      </div>`;
  }

  function homeworkItemHtml(h, compact) {
    const due = dueLabel(h.due);
    const pri = h.priority || "medium";
    return `
      <div class="item ${h.done ? "done" : ""}">
        <button type="button" class="item-check ${h.done ? "checked" : ""}" data-action="toggle-hw" data-id="${h.id}">${h.done ? "✓" : ""}</button>
        <div class="item-body">
          <p class="item-title">${esc(h.title)}</p>
          <div class="item-meta">
            ${subjectBadge(h.subjectId)}
            ${due.text ? `<span class="badge ${due.cls}">${esc(due.text)}</span>` : ""}
            <span class="badge priority-${pri}">${pri}</span>
          </div>
        </div>
        ${
          compact
            ? ""
            : `<div class="item-actions">
                <button type="button" class="icon-btn" data-action="edit-hw" data-id="${h.id}">✏️</button>
                <button type="button" class="icon-btn" data-action="del-hw" data-id="${h.id}">🗑️</button>
              </div>`
        }
      </div>`;
  }

  function renderProjectsPanel() {
    const list = state.projects.slice().sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.due || "9999").localeCompare(b.due || "9999");
    });
    return `<div class="card">${
      list.length
        ? `<div class="item-list">${list.map((p) => projectItemHtml(p)).join("")}</div>`
        : `<div class="empty"><div class="empty-icon">🚀</div><p>No projects yet (Art, Drama, History, EGD…).</p></div>`
    }</div>`;
  }

  function projectItemHtml(p, compact) {
    const pct = Math.min(100, Math.max(0, Number(p.progress) || 0));
    const due = dueLabel(p.due);
    return `
      <div class="item ${p.done ? "done" : ""}">
        <button type="button" class="item-check ${p.done ? "checked" : ""}" data-action="toggle-project" data-id="${p.id}">${p.done ? "✓" : ""}</button>
        <div class="item-body">
          <p class="item-title">${esc(p.title)}</p>
          <div class="item-meta">
            ${subjectBadge(p.subjectId)}
            ${due.text ? `<span class="badge ${due.cls}">${esc(due.text)}</span>` : ""}
            <span class="badge">${pct}%</span>
          </div>
          <div class="progress-bar thin"><span style="width:${pct}%"></span></div>
        </div>
        ${
          compact
            ? ""
            : `<div class="item-actions">
                <button type="button" class="icon-btn" data-action="edit-project" data-id="${p.id}">✏️</button>
                <button type="button" class="icon-btn" data-action="del-project" data-id="${p.id}">🗑️</button>
              </div>`
        }
      </div>`;
  }

  function renderTestsPanel() {
    const list = state.tests.slice().sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.date || "9999").localeCompare(b.date || "9999");
    });
    return `<div class="card">${
      list.length
        ? `<div class="item-list">${list.map((t) => testItemHtml(t)).join("")}</div>`
        : `<div class="empty"><div class="empty-icon">📋</div><p>No tests yet. Add when dates are announced.</p></div>`
    }</div>`;
  }

  function testItemHtml(t, compact) {
    const n = daysUntil(t.date);
    let when = formatDate(t.date);
    let cls = "type-test";
    if (n !== null) {
      if (n < 0) {
        when = "Past";
        cls = "overdue";
      } else if (n === 0) {
        when = "Today!";
        cls = "soon";
      } else if (n === 1) {
        when = "Tomorrow";
        cls = "soon";
      } else {
        when = `In ${n}d · ${formatDate(t.date)}`;
        if (n <= 7) cls = "soon";
      }
    }
    return `
      <div class="item ${t.done ? "done" : ""}">
        <button type="button" class="item-check ${t.done ? "checked" : ""}" data-action="toggle-test" data-id="${t.id}">${t.done ? "✓" : ""}</button>
        <div class="item-body">
          <p class="item-title">${esc(t.title)}</p>
          <div class="item-meta">
            ${subjectBadge(t.subjectId)}
            <span class="badge ${cls}">${esc(when)}</span>
            ${t.topic ? `<span>${esc(t.topic)}</span>` : ""}
          </div>
        </div>
        ${
          compact
            ? ""
            : `<div class="item-actions">
                <button type="button" class="icon-btn" data-action="edit-test" data-id="${t.id}">✏️</button>
                <button type="button" class="icon-btn" data-action="del-test" data-id="${t.id}">🗑️</button>
              </div>`
        }
      </div>`;
  }

  // ——— GRADES ———
  function renderGrades() {
    const avg = overallAverage();
    let marks = state.grades.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (gradeSubjectFilter !== "all") marks = marks.filter((g) => g.subjectId === gradeSubjectFilter);

    return `
      <div class="view-header">
        <div>
          <h2>Grades</h2>
          <p>Track assessments · weighted averages</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-grade">+ Mark</button>
      </div>
      <div class="card mb-12">
        <div class="flex-between">
          <div>
            <div class="text-sm text-muted">Overall average</div>
            <div class="stat-value ${avgClass(avg)}" style="text-align:left">${fmtPct(avg)}</div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" data-action="add-grade">Log a mark</button>
        </div>
      </div>
      <div class="card mb-12">
        <h3 class="card-title">By subject</h3>
        ${state.subjects
          .map((s) => {
            const a = subjectAverage(s.id);
            const n = state.grades.filter((g) => g.subjectId === s.id).length;
            return `<div class="grade-row">
              <div>
                <strong style="color:${s.color}">${esc(s.name)}</strong>
                <div class="text-sm text-muted">${n} assessment${n === 1 ? "" : "s"}</div>
              </div>
              <div class="grade-avg ${avgClass(a)}">${fmtPct(a)}</div>
              <button type="button" class="btn btn-ghost btn-sm" data-grade-filter="${s.id}">View</button>
            </div>`;
          })
          .join("")}
      </div>
      <div class="filters">
        <button type="button" class="chip ${gradeSubjectFilter === "all" ? "active" : ""}" data-grade-filter="all">All marks</button>
        ${state.subjects
          .map(
            (s) =>
              `<button type="button" class="chip ${gradeSubjectFilter === s.id ? "active" : ""}" data-grade-filter="${s.id}">${esc(s.name)}</button>`
          )
          .join("")}
      </div>
      <div class="card">
        ${
          marks.length
            ? `<div class="item-list">${marks
                .map((g) => {
                  const pct = (Number(g.score) / Number(g.outOf || 100)) * 100;
                  return `<div class="item">
                    <div class="item-body">
                      <p class="item-title">${esc(g.title)}</p>
                      <div class="item-meta">
                        ${subjectBadge(g.subjectId)}
                        <span class="badge">${g.score}/${g.outOf || 100} · ${Math.round(pct)}%</span>
                        ${g.date ? `<span>${formatDate(g.date)}</span>` : ""}
                        ${g.weight && g.weight != 1 ? `<span>w${g.weight}</span>` : ""}
                      </div>
                    </div>
                    <div class="item-actions">
                      <button type="button" class="icon-btn" data-action="edit-grade" data-id="${g.id}">✏️</button>
                      <button type="button" class="icon-btn" data-action="del-grade" data-id="${g.id}">🗑️</button>
                    </div>
                  </div>`;
                })
                .join("")}</div>`
            : `<div class="empty"><div class="empty-icon">📊</div><p>No marks logged yet. Add tests, tasks & PAT marks here.</p></div>`
        }
      </div>`;
  }

  // ——— STUDY ———
  function renderStudy() {
    const todayLog = state.studyLog.filter((s) => s.date === todayISO());
    const minsToday = todayLog.reduce((a, s) => a + (s.minutes || 0), 0);
    const mm = String(Math.floor(studyRemaining / 60)).padStart(2, "0");
    const ss = String(studyRemaining % 60).padStart(2, "0");
    return `
      <div class="view-header">
        <div>
          <h2>Study</h2>
          <p>Focus timer · build a streak</p>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-value">${minsToday}</div><div class="stat-label">Mins today</div></div>
        <div class="stat"><div class="stat-value">${state.studyStreak || 0}</div><div class="stat-label">Day streak</div></div>
        <div class="stat"><div class="stat-value">${todayLog.length}</div><div class="stat-label">Sessions</div></div>
        <div class="stat"><div class="stat-value">${state.focusMinutes}</div><div class="stat-label">Focus len</div></div>
      </div>
      <div class="card mb-12">
        <div class="timer-mode">${studyMode === "focus" ? "🎯 Focus block" : "☕ Break"} · ${esc(studyRunning ? "Running" : "Paused")}</div>
        <div class="timer-display" id="timer-display">${mm}:${ss}</div>
        <div class="timer-controls">
          <button type="button" class="btn btn-primary" data-action="timer-toggle">${studyRunning ? "Pause" : "Start"}</button>
          <button type="button" class="btn btn-secondary" data-action="timer-reset">Reset</button>
          <button type="button" class="btn btn-ghost" data-action="timer-skip">Skip to ${studyMode === "focus" ? "break" : "focus"}</button>
        </div>
        <p class="text-sm text-muted mt-12" style="text-align:center">Completing a focus block logs study time & updates your streak.</p>
      </div>
      <div class="card">
        <h3 class="card-title">Today's sessions</h3>
        ${
          todayLog.length
            ? todayLog
                .map(
                  (s) =>
                    `<div class="item-meta mb-8">✅ ${s.minutes} min · ${esc(s.mode || "focus")} · ${esc(s.note || "")}</div>`
                )
                .join("")
            : `<p class="text-sm text-muted">No sessions yet today. Hit Start when you sit down to work.</p>`
        }
      </div>`;
  }

  function startTimerTick() {
    if (studyTimer) clearInterval(studyTimer);
    if (!studyRunning) return;
    studyTimer = setInterval(() => {
      if (studyRemaining <= 1) {
        studyRemaining = 0;
        completeTimerBlock();
      } else {
        studyRemaining -= 1;
        const el = document.getElementById("timer-display");
        if (el) {
          const mm = String(Math.floor(studyRemaining / 60)).padStart(2, "0");
          const ss = String(studyRemaining % 60).padStart(2, "0");
          el.textContent = `${mm}:${ss}`;
        }
      }
    }, 1000);
  }

  function completeTimerBlock() {
    studyRunning = false;
    if (studyTimer) clearInterval(studyTimer);
    if (studyMode === "focus") {
      const mins = state.focusMinutes || 25;
      state.studyLog.push({
        id: uid("st"),
        date: todayISO(),
        minutes: mins,
        mode: "focus",
        note: "Timer session",
      });
      if (state.lastStudyDate !== todayISO()) {
        const y = new Date(todayISO() + "T12:00:00");
        y.setDate(y.getDate() - 1);
        const yIso = y.toISOString().slice(0, 10);
        state.studyStreak = state.lastStudyDate === yIso ? (state.studyStreak || 0) + 1 : 1;
        state.lastStudyDate = todayISO();
      }
      save();
      toast(`Nice — ${mins} min logged 🔥`);
      studyMode = "break";
      studyRemaining = (state.breakMinutes || 5) * 60;
    } else {
      toast("Break over — back to it!");
      studyMode = "focus";
      studyRemaining = (state.focusMinutes || 25) * 60;
    }
    if (currentView === "study") render();
  }

  // ——— SIDEBAR SECTIONS ———
  function renderTimetable() {
    const dayName = DAYS[selectedDay];
    const periods = (state.timetable[dayName] || []).slice().sort(sortPeriods);
    const todayIdx = todayWeekdayIndex();
    return `
      <div class="view-header">
        <div>
          <h2>Timetable</h2>
          <p>Fish Hoek High · weekly schedule</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-period">+ Class</button>
      </div>
      <div class="day-tabs">
        ${DAYS.map(
          (d, i) =>
            `<button type="button" class="day-tab ${i === selectedDay ? "active" : ""} ${i === todayIdx ? "today" : ""}" data-day="${i}">${d.slice(0, 3)}</button>`
        ).join("")}
      </div>
      <div class="card">
        <h3 class="card-title">${esc(dayName)}</h3>
        ${
          periods.length
            ? periods
                .map((p) => {
                  const sub = subjectById(p.subjectId);
                  return `<div class="period" style="--subject:${sub?.color || "var(--accent-bright)"}">
                    <div class="period-time">${esc(p.start || "—")}<br>${esc(p.end || "")}</div>
                    <div>
                      <div class="period-subject">${esc(sub?.name || "Class")}</div>
                      ${p.room ? `<div class="period-room">Room ${esc(p.room)}</div>` : ""}
                    </div>
                    <div class="item-actions">
                      <button type="button" class="icon-btn" data-action="edit-period" data-id="${p.id}" data-day="${esc(dayName)}">✏️</button>
                      <button type="button" class="icon-btn" data-action="del-period" data-id="${p.id}" data-day="${esc(dayName)}">🗑️</button>
                    </div>
                  </div>`;
                })
                .join("")
            : `<div class="empty"><p>No classes on ${esc(dayName)}. Add your FHHS periods.</p>
               <button type="button" class="btn btn-primary btn-sm" data-action="add-period">Add class</button></div>`
        }
      </div>`;
  }

  function sortPeriods(a, b) {
    return (a.start || "").localeCompare(b.start || "");
  }

  function renderRoutines() {
    return `
      <div class="view-header">
        <div>
          <h2>Routines</h2>
          <p>Resets every morning · stay ready for school</p>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">🌅 Before school
            <span class="count">${state.routines.morning.filter((r) => r.done).length}/${state.routines.morning.length}</span>
          </h3>
          ${state.routines.morning.map((r) => routineRow("morning", r)).join("")}
          <button type="button" class="btn btn-secondary btn-sm mt-12" data-action="add-routine" data-which="morning">+ Item</button>
        </div>
        <div class="card">
          <h3 class="card-title">🏠 After school
            <span class="count">${state.routines.afternoon.filter((r) => r.done).length}/${state.routines.afternoon.length}</span>
          </h3>
          ${state.routines.afternoon.map((r) => routineRow("afternoon", r)).join("")}
          <button type="button" class="btn btn-secondary btn-sm mt-12" data-action="add-routine" data-which="afternoon">+ Item</button>
        </div>
      </div>`;
  }

  function routineRow(which, r) {
    return `
      <div class="routine-item ${r.done ? "done" : ""}">
        <button type="button" class="item-check ${r.done ? "checked" : ""}" data-action="toggle-routine" data-which="${which}" data-id="${r.id}">${r.done ? "✓" : ""}</button>
        <span class="routine-label">${esc(r.label)}</span>
        <button type="button" class="icon-btn" data-action="del-routine" data-which="${which}" data-id="${r.id}">🗑️</button>
      </div>`;
  }

  function renderNotes() {
    const list = state.notes.slice().sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
    return `
      <div class="view-header">
        <div>
          <h2>Notes</h2>
          <p>Quick notes by subject</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-note">+ Note</button>
      </div>
      <div class="card">
        ${
          list.length
            ? list
                .map((n) => {
                  const sub = subjectById(n.subjectId);
                  return `<div class="note-card" style="--subject:${sub?.color || "var(--accent-bright)"}">
                    <div class="flex-between">
                      <h4>${esc(n.title)}</h4>
                      <div class="item-actions">
                        <button type="button" class="icon-btn" data-action="edit-note" data-id="${n.id}">✏️</button>
                        <button type="button" class="icon-btn" data-action="del-note" data-id="${n.id}">🗑️</button>
                      </div>
                    </div>
                    ${subjectBadge(n.subjectId)}
                    <p class="mt-8">${esc(n.body || "")}</p>
                  </div>`;
                })
                .join("")
            : `<div class="empty"><div class="empty-icon">📓</div><p>No notes yet. Capture formulas, quotes, EGD tips…</p></div>`
        }
      </div>`;
  }

  function renderGoals() {
    const list = state.goals.slice().sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
    return `
      <div class="view-header">
        <div>
          <h2>Goals</h2>
          <p>Weekly targets keep Grade 10 on track</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-goal">+ Goal</button>
      </div>
      <div class="card">
        ${
          list.length
            ? `<div class="item-list">${list
                .map(
                  (g) => `
              <div class="item ${g.done ? "done" : ""}">
                <button type="button" class="item-check ${g.done ? "checked" : ""}" data-action="toggle-goal" data-id="${g.id}">${g.done ? "✓" : ""}</button>
                <div class="item-body">
                  <p class="item-title">${esc(g.title)}</p>
                  <div class="item-meta">
                    ${g.subjectId ? subjectBadge(g.subjectId) : ""}
                    ${g.due ? `<span class="badge">${formatDate(g.due)}</span>` : ""}
                  </div>
                </div>
                <button type="button" class="icon-btn" data-action="del-goal" data-id="${g.id}">🗑️</button>
              </div>`
                )
                .join("")}</div>`
            : `<div class="empty"><div class="empty-icon">🎯</div><p>Set goals like “Maths Lit past paper” or “Drama monologue”.</p></div>`
        }
      </div>`;
  }

  function renderLinks() {
    return `
      <div class="view-header">
        <div>
          <h2>Links</h2>
          <p>School tools one click away</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-link">+ Link</button>
      </div>
      <div class="card">
        ${state.links
          .map(
            (l) => `
          <a class="link-row" href="${esc(l.url)}" target="_blank" rel="noopener">
            <span class="link-icon">${esc(l.icon || "🔗")}</span>
            <span class="link-body">
              <strong>${esc(l.title)}</strong>
              <small>${esc(l.url)}</small>
            </span>
          </a>
          <div class="flex-between mb-8" style="padding:0 4px">
            <button type="button" class="btn btn-ghost btn-sm" data-action="edit-link" data-id="${l.id}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" data-action="del-link" data-id="${l.id}">Remove</button>
          </div>`
          )
          .join("")}
      </div>`;
  }

  // ——— SETTINGS ———
  function renderSettings() {
    return `
      <div class="view-header">
        <div>
          <h2>Settings</h2>
          <p>Profile, subjects, backup</p>
        </div>
      </div>
      <div class="card settings-section">
        <h3>Profile</h3>
        <div class="form-stack">
          <div class="field"><label>Name</label><input id="set-name" value="${esc(state.studentName)}" /></div>
          <div class="field-row">
            <div class="field"><label>School</label><input id="set-school" value="${esc(state.school)}" /></div>
            <div class="field"><label>Grade</label><input id="set-grade" value="${esc(state.grade)}" /></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Focus minutes</label><input type="number" id="set-focus" min="5" max="90" value="${state.focusMinutes || 25}" /></div>
            <div class="field"><label>Break minutes</label><input type="number" id="set-break" min="1" max="30" value="${state.breakMinutes || 5}" /></div>
          </div>
          <button type="button" class="btn btn-primary" data-action="save-profile">Save profile</button>
        </div>
      </div>
      <div class="card settings-section">
        <h3>Subjects (Grade 10)</h3>
        ${state.subjects
          .map(
            (s) => `
          <div class="subject-row">
            <span class="subject-swatch" style="background:${s.color}"></span>
            <span>${esc(s.name)}</span>
            <button type="button" class="btn btn-ghost btn-sm" data-action="del-subject" data-id="${s.id}">Remove</button>
          </div>`
          )
          .join("")}
        <button type="button" class="btn btn-secondary btn-sm mt-12" data-action="add-subject">+ Subject</button>
        <button type="button" class="btn btn-ghost btn-sm mt-12" data-action="reset-subjects">Restore FHHS list</button>
      </div>
      <div class="card settings-section">
        <h3>Appearance</h3>
        <button type="button" class="btn btn-secondary" data-action="toggle-theme">Switch to ${state.theme === "dark" ? "light" : "dark"} mode</button>
      </div>
      <div class="card settings-section">
        <h3>Backup</h3>
        <p class="text-sm text-muted mb-12">Export JSON before a new Mac or browser. Import restores everything.</p>
        <div class="flex-between">
          <button type="button" class="btn btn-secondary" data-action="export-data">Export backup</button>
          <button type="button" class="btn btn-secondary" data-action="import-data">Import backup</button>
        </div>
        <input type="file" id="import-file" accept="application/json,.json" hidden />
      </div>
      <div class="card settings-section">
        <h3>Danger zone</h3>
        <button type="button" class="btn btn-danger" data-action="reset-all">Reset all data</button>
      </div>
      <p class="text-sm text-muted" style="text-align:center">Fish Hoek High · Grade 10 · data stays on this Mac</p>`;
  }

  // ——— Modals (forms) ———
  function openHomeworkModal(existing) {
    const h = existing || {
      title: "",
      subjectId: state.subjects[0]?.id || "",
      due: todayISO(),
      priority: "medium",
      notes: "",
      done: false,
    };
    openModal({
      title: existing ? "Edit homework" : "New homework",
      bodyHtml: formFields([
        ["hw-title", "Title", "text", h.title, "e.g. Maths Lit worksheet 4"],
        ["hw-subject", "Subject", "select", h.subjectId],
        ["hw-due", "Due date", "date", h.due || ""],
        ["hw-priority", "Priority", "priority", h.priority],
        ["hw-notes", "Notes", "textarea", h.notes || ""],
      ]),
      footerHtml: footerSave(existing),
    });
    document.getElementById("form-save").onclick = () => {
      const title = val("hw-title");
      if (!title) return toast("Add a title");
      const data = {
        title,
        subjectId: val("hw-subject"),
        due: val("hw-due"),
        priority: val("hw-priority"),
        notes: val("hw-notes"),
        done: h.done || false,
      };
      if (existing) Object.assign(existing, data);
      else state.homework.push({ id: uid("hw"), createdAt: todayISO(), ...data });
      save();
      closeModal();
      toast(existing ? "Updated" : "Homework added");
      render();
    };
  }

  function openProjectModal(existing) {
    const p = existing || {
      title: "",
      subjectId: state.subjects[0]?.id || "",
      due: "",
      progress: 0,
      notes: "",
      done: false,
    };
    openModal({
      title: existing ? "Edit project" : "New project",
      bodyHtml: `
        <div class="form-stack">
          <div class="field"><label>Title</label><input id="pr-title" value="${esc(p.title)}" /></div>
          <div class="field-row">
            <div class="field"><label>Subject</label><select id="pr-subject">${subjectOptions(p.subjectId)}</select></div>
            <div class="field"><label>Due</label><input type="date" id="pr-due" value="${esc(p.due || "")}" /></div>
          </div>
          <div class="field"><label id="pr-prog-label">Progress (${Number(p.progress) || 0}%)</label>
            <input type="range" id="pr-progress" min="0" max="100" step="5" value="${Number(p.progress) || 0}" /></div>
          <div class="field"><label>Notes</label><textarea id="pr-notes">${esc(p.notes || "")}</textarea></div>
        </div>`,
      footerHtml: footerSave(existing),
    });
    const range = document.getElementById("pr-progress");
    range.oninput = () => {
      document.getElementById("pr-prog-label").textContent = `Progress (${range.value}%)`;
    };
    document.getElementById("form-save").onclick = () => {
      const title = val("pr-title");
      if (!title) return toast("Add a title");
      const data = {
        title,
        subjectId: val("pr-subject"),
        due: val("pr-due"),
        progress: Number(val("pr-progress")) || 0,
        notes: val("pr-notes"),
        done: existing ? existing.done : false,
      };
      if (data.progress >= 100) data.done = true;
      if (existing) Object.assign(existing, data);
      else state.projects.push({ id: uid("pr"), ...data });
      save();
      closeModal();
      toast(existing ? "Updated" : "Project added");
      render();
    };
  }

  function openTestModal(existing) {
    const t = existing || {
      title: "",
      subjectId: state.subjects[0]?.id || "",
      date: "",
      topic: "",
      notes: "",
      done: false,
    };
    openModal({
      title: existing ? "Edit test" : "New test / exam",
      bodyHtml: formFields([
        ["te-title", "Title", "text", t.title, "e.g. History Cycle Test"],
        ["te-subject", "Subject", "select", t.subjectId],
        ["te-date", "Date", "date", t.date || ""],
        ["te-topic", "Topic", "text", t.topic || "", "Chapters / content"],
        ["te-notes", "Revision notes", "textarea", t.notes || ""],
      ]),
      footerHtml: footerSave(existing),
    });
    document.getElementById("form-save").onclick = () => {
      const title = val("te-title");
      if (!title) return toast("Add a title");
      const data = {
        title,
        subjectId: val("te-subject"),
        date: val("te-date"),
        topic: val("te-topic"),
        notes: val("te-notes"),
        done: t.done || false,
      };
      if (existing) Object.assign(existing, data);
      else state.tests.push({ id: uid("te"), ...data });
      save();
      closeModal();
      toast(existing ? "Updated" : "Test added");
      render();
    };
  }

  function openGradeModal(existing) {
    const g = existing || {
      title: "",
      subjectId: state.subjects[0]?.id || "",
      score: "",
      outOf: 100,
      weight: 1,
      date: todayISO(),
    };
    openModal({
      title: existing ? "Edit mark" : "Log mark",
      bodyHtml: `
        <div class="form-stack">
          <div class="field"><label>Title</label><input id="gr-title" value="${esc(g.title)}" placeholder="e.g. Term 2 task" /></div>
          <div class="field"><label>Subject</label><select id="gr-subject">${subjectOptions(g.subjectId)}</select></div>
          <div class="field-row">
            <div class="field"><label>Score</label><input type="number" id="gr-score" value="${esc(g.score)}" step="0.5" /></div>
            <div class="field"><label>Out of</label><input type="number" id="gr-out" value="${esc(g.outOf || 100)}" /></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Weight</label><input type="number" id="gr-weight" value="${esc(g.weight || 1)}" min="0.5" step="0.5" /></div>
            <div class="field"><label>Date</label><input type="date" id="gr-date" value="${esc(g.date || "")}" /></div>
          </div>
        </div>`,
      footerHtml: footerSave(existing),
    });
    document.getElementById("form-save").onclick = () => {
      const title = val("gr-title");
      if (!title) return toast("Add a title");
      const data = {
        title,
        subjectId: val("gr-subject"),
        score: Number(val("gr-score")),
        outOf: Number(val("gr-out")) || 100,
        weight: Number(val("gr-weight")) || 1,
        date: val("gr-date"),
      };
      if (existing) Object.assign(existing, data);
      else state.grades.push({ id: uid("gr"), ...data });
      save();
      closeModal();
      toast(existing ? "Updated" : "Mark saved");
      render();
    };
  }

  function openNoteModal(existing) {
    const n = existing || {
      title: "",
      subjectId: state.subjects[0]?.id || "",
      body: "",
    };
    openModal({
      title: existing ? "Edit note" : "New note",
      bodyHtml: formFields([
        ["no-title", "Title", "text", n.title, ""],
        ["no-subject", "Subject", "select", n.subjectId],
        ["no-body", "Note", "textarea", n.body || ""],
      ]),
      footerHtml: footerSave(existing),
    });
    document.getElementById("form-save").onclick = () => {
      const title = val("no-title");
      if (!title) return toast("Add a title");
      const data = {
        title,
        subjectId: val("no-subject"),
        body: val("no-body"),
        updated: todayISO(),
      };
      if (existing) Object.assign(existing, data);
      else state.notes.push({ id: uid("no"), ...data });
      save();
      closeModal();
      toast("Note saved");
      render();
    };
  }

  function openEventModal(existing) {
    const e = existing || {
      title: "",
      date: agendaDate || todayISO(),
      time: "",
      notes: "",
    };
    openModal({
      title: existing ? "Edit event" : "New event",
      bodyHtml: `
        <div class="form-stack">
          <div class="field"><label>Title</label><input id="ev-title" value="${esc(e.title)}" placeholder="e.g. Drama rehearsal" /></div>
          <div class="field-row">
            <div class="field"><label>Date</label><input type="date" id="ev-date" value="${esc(e.date || "")}" /></div>
            <div class="field"><label>Time</label><input type="time" id="ev-time" value="${esc(e.time || "")}" /></div>
          </div>
          <div class="field"><label>Notes</label><textarea id="ev-notes">${esc(e.notes || "")}</textarea></div>
        </div>`,
      footerHtml: footerSave(existing),
    });
    document.getElementById("form-save").onclick = () => {
      const title = val("ev-title");
      if (!title) return toast("Add a title");
      const data = {
        title,
        date: val("ev-date"),
        time: val("ev-time"),
        notes: val("ev-notes"),
      };
      if (existing) Object.assign(existing, data);
      else state.events.push({ id: uid("ev"), ...data });
      save();
      closeModal();
      toast("Event saved");
      render();
    };
  }

  function openGoalModal(existing) {
    const g = existing || {
      title: "",
      subjectId: "",
      due: "",
      done: false,
    };
    openModal({
      title: existing ? "Edit goal" : "New goal",
      bodyHtml: `
        <div class="form-stack">
          <div class="field"><label>Goal</label><input id="go-title" value="${esc(g.title)}" placeholder="e.g. Finish EGD drawing set" /></div>
          <div class="field"><label>Subject (optional)</label>
            <select id="go-subject"><option value="">—</option>${subjectOptions(g.subjectId)}</select></div>
          <div class="field"><label>Target date</label><input type="date" id="go-due" value="${esc(g.due || "")}" /></div>
        </div>`,
      footerHtml: footerSave(existing),
    });
    document.getElementById("form-save").onclick = () => {
      const title = val("go-title");
      if (!title) return toast("Add a goal");
      const data = {
        title,
        subjectId: val("go-subject"),
        due: val("go-due"),
        done: g.done || false,
      };
      if (existing) Object.assign(existing, data);
      else state.goals.push({ id: uid("go"), ...data });
      save();
      closeModal();
      toast("Goal saved");
      render();
    };
  }

  function openPeriodModal(dayName, existing) {
    const p = existing || {
      subjectId: state.subjects[0]?.id || "",
      start: "08:00",
      end: "08:45",
      room: "",
      notes: "",
    };
    openModal({
      title: existing ? "Edit class" : `Add class — ${dayName}`,
      bodyHtml: `
        <div class="form-stack">
          <div class="field"><label>Subject</label><select id="pe-subject">${subjectOptions(p.subjectId)}</select></div>
          <div class="field-row">
            <div class="field"><label>Start</label><input type="time" id="pe-start" value="${esc(p.start || "08:00")}" /></div>
            <div class="field"><label>End</label><input type="time" id="pe-end" value="${esc(p.end || "08:45")}" /></div>
          </div>
          <div class="field"><label>Room</label><input id="pe-room" value="${esc(p.room || "")}" /></div>
          <div class="field"><label>Notes</label><input id="pe-notes" value="${esc(p.notes || "")}" /></div>
        </div>`,
      footerHtml: footerSave(existing),
    });
    document.getElementById("form-save").onclick = () => {
      const data = {
        subjectId: val("pe-subject"),
        start: val("pe-start"),
        end: val("pe-end"),
        room: val("pe-room"),
        notes: val("pe-notes"),
      };
      if (!state.timetable[dayName]) state.timetable[dayName] = [];
      if (existing) Object.assign(existing, data);
      else state.timetable[dayName].push({ id: uid("pe"), ...data });
      save();
      closeModal();
      toast("Saved");
      render();
    };
  }

  function openLinkModal(existing) {
    const l = existing || { title: "", url: "https://", icon: "🔗" };
    openModal({
      title: existing ? "Edit link" : "Add link",
      bodyHtml: `
        <div class="form-stack">
          <div class="field"><label>Title</label><input id="li-title" value="${esc(l.title)}" /></div>
          <div class="field"><label>URL</label><input id="li-url" value="${esc(l.url)}" /></div>
          <div class="field"><label>Icon (emoji)</label><input id="li-icon" value="${esc(l.icon || "🔗")}" /></div>
        </div>`,
      footerHtml: footerSave(existing),
    });
    document.getElementById("form-save").onclick = () => {
      const title = val("li-title");
      const url = val("li-url");
      if (!title || !url) return toast("Title and URL required");
      const data = { title, url, icon: val("li-icon") || "🔗" };
      if (existing) Object.assign(existing, data);
      else state.links.push({ id: uid("lk"), ...data });
      save();
      closeModal();
      toast("Link saved");
      render();
    };
  }

  function formFields(fields) {
    return `<div class="form-stack">${fields
      .map(([id, label, type, value, ph]) => {
        if (type === "select") {
          return `<div class="field"><label>${label}</label><select id="${id}">${subjectOptions(value)}</select></div>`;
        }
        if (type === "priority") {
          return `<div class="field"><label>${label}</label>
            <select id="${id}">
              <option value="low" ${value === "low" ? "selected" : ""}>Low</option>
              <option value="medium" ${value === "medium" ? "selected" : ""}>Medium</option>
              <option value="high" ${value === "high" ? "selected" : ""}>High</option>
            </select></div>`;
        }
        if (type === "textarea") {
          return `<div class="field"><label>${label}</label><textarea id="${id}" placeholder="${esc(ph || "")}">${esc(value)}</textarea></div>`;
        }
        if (type === "date") {
          return `<div class="field"><label>${label}</label><input type="date" id="${id}" value="${esc(value)}" /></div>`;
        }
        return `<div class="field"><label>${label}</label><input id="${id}" value="${esc(value)}" placeholder="${esc(ph || "")}" /></div>`;
      })
      .join("")}</div>`;
  }

  function footerSave(existing) {
    return `<button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
      <button type="button" class="btn btn-primary" id="form-save">${existing ? "Save" : "Add"}</button>`;
  }

  function val(id) {
    return document.getElementById(id)?.value.trim() ?? "";
  }

  // ——— Events ———
  function bindMain(main) {
    main.onclick = onMainClick;
  }

  function onMainClick(e) {
    const goto = e.target.closest("[data-goto]");
    if (goto) {
      setView(goto.dataset.goto);
      return;
    }
    if (e.target.closest("#quick-add-today")) {
      openQuickAdd();
      return;
    }
    const ad = e.target.closest("[data-agenda-date]");
    if (ad) {
      agendaDate = ad.dataset.agendaDate;
      render();
      return;
    }
    const dayTab = e.target.closest("[data-day]");
    if (dayTab && dayTab.classList.contains("day-tab")) {
      selectedDay = Number(dayTab.dataset.day);
      render();
      return;
    }
    const wt = e.target.closest("[data-work-tab]");
    if (wt) {
      workTab = wt.dataset.workTab;
      render();
      return;
    }
    const hf = e.target.closest("[data-hw-filter]");
    if (hf) {
      hwFilter = hf.dataset.hwFilter;
      render();
      return;
    }
    const gf = e.target.closest("[data-grade-filter]");
    if (gf) {
      gradeSubjectFilter = gf.dataset.gradeFilter;
      render();
      return;
    }

    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;

    const find = (arr) => arr.find((x) => x.id === id);

    switch (action) {
      case "add-work":
        if (workTab === "projects") openProjectModal(null);
        else if (workTab === "tests") openTestModal(null);
        else openHomeworkModal(null);
        break;
      case "add-homework":
      case "edit-hw":
        openHomeworkModal(action === "edit-hw" ? find(state.homework) : null);
        break;
      case "toggle-hw": {
        const h = find(state.homework);
        if (h) {
          h.done = !h.done;
          save();
          render();
        }
        break;
      }
      case "del-hw":
        if (confirm("Delete homework?")) {
          state.homework = state.homework.filter((x) => x.id !== id);
          save();
          render();
        }
        break;

      case "add-project":
      case "edit-project":
        openProjectModal(action === "edit-project" ? find(state.projects) : null);
        break;
      case "toggle-project": {
        const p = find(state.projects);
        if (p) {
          p.done = !p.done;
          if (p.done) p.progress = 100;
          save();
          render();
        }
        break;
      }
      case "del-project":
        if (confirm("Delete project?")) {
          state.projects = state.projects.filter((x) => x.id !== id);
          save();
          render();
        }
        break;

      case "add-test":
      case "edit-test":
        openTestModal(action === "edit-test" ? find(state.tests) : null);
        break;
      case "toggle-test": {
        const t = find(state.tests);
        if (t) {
          t.done = !t.done;
          save();
          render();
        }
        break;
      }
      case "del-test":
        if (confirm("Delete test?")) {
          state.tests = state.tests.filter((x) => x.id !== id);
          save();
          render();
        }
        break;

      case "add-grade":
      case "edit-grade":
        openGradeModal(action === "edit-grade" ? find(state.grades) : null);
        break;
      case "del-grade":
        if (confirm("Delete mark?")) {
          state.grades = state.grades.filter((x) => x.id !== id);
          save();
          render();
        }
        break;

      case "add-note":
      case "edit-note":
        openNoteModal(action === "edit-note" ? find(state.notes) : null);
        break;
      case "del-note":
        if (confirm("Delete note?")) {
          state.notes = state.notes.filter((x) => x.id !== id);
          save();
          render();
        }
        break;

      case "add-event":
      case "edit-event":
        openEventModal(action === "edit-event" ? find(state.events) : null);
        break;
      case "del-event":
        if (confirm("Delete event?")) {
          state.events = state.events.filter((x) => x.id !== id);
          save();
          render();
        }
        break;
      case "agenda-today":
        agendaDate = todayISO();
        render();
        break;

      case "add-goal":
        openGoalModal(null);
        break;
      case "toggle-goal": {
        const g = find(state.goals);
        if (g) {
          g.done = !g.done;
          save();
          render();
        }
        break;
      }
      case "del-goal":
        state.goals = state.goals.filter((x) => x.id !== id);
        save();
        render();
        break;

      case "add-period":
        openPeriodModal(DAYS[selectedDay], null);
        break;
      case "edit-period": {
        const day = el.dataset.day;
        const p = (state.timetable[day] || []).find((x) => x.id === id);
        if (p) openPeriodModal(day, p);
        break;
      }
      case "del-period": {
        const day = el.dataset.day;
        if (confirm("Remove class?")) {
          state.timetable[day] = (state.timetable[day] || []).filter((x) => x.id !== id);
          save();
          render();
        }
        break;
      }

      case "toggle-routine": {
        const which = el.dataset.which;
        const r = state.routines[which]?.find((x) => x.id === id);
        if (r) {
          r.done = !r.done;
          save();
          render();
        }
        break;
      }
      case "del-routine": {
        const which = el.dataset.which;
        state.routines[which] = state.routines[which].filter((x) => x.id !== id);
        save();
        render();
        break;
      }
      case "add-routine": {
        const which = el.dataset.which;
        const label = prompt("Checklist item:");
        if (label?.trim()) {
          state.routines[which].push({ id: uid("rt"), label: label.trim(), done: false });
          save();
          render();
        }
        break;
      }

      case "add-link":
      case "edit-link":
        openLinkModal(action === "edit-link" ? find(state.links) : null);
        break;
      case "del-link":
        state.links = state.links.filter((x) => x.id !== id);
        save();
        render();
        break;

      case "timer-toggle":
        studyRunning = !studyRunning;
        if (studyRunning) startTimerTick();
        else if (studyTimer) clearInterval(studyTimer);
        render();
        break;
      case "timer-reset":
        studyRunning = false;
        if (studyTimer) clearInterval(studyTimer);
        studyRemaining =
          (studyMode === "focus" ? state.focusMinutes || 25 : state.breakMinutes || 5) * 60;
        render();
        break;
      case "timer-skip":
        studyRunning = false;
        if (studyTimer) clearInterval(studyTimer);
        if (studyMode === "focus") {
          studyMode = "break";
          studyRemaining = (state.breakMinutes || 5) * 60;
        } else {
          studyMode = "focus";
          studyRemaining = (state.focusMinutes || 25) * 60;
        }
        render();
        break;

      case "save-profile": {
        state.studentName = document.getElementById("set-name")?.value.trim() || "Connor";
        state.school = document.getElementById("set-school")?.value.trim() || state.school;
        state.grade = document.getElementById("set-grade")?.value.trim() || "10";
        state.focusMinutes = Number(document.getElementById("set-focus")?.value) || 25;
        state.breakMinutes = Number(document.getElementById("set-break")?.value) || 5;
        save();
        toast("Profile saved");
        render();
        break;
      }
      case "toggle-theme":
        state.theme = state.theme === "dark" ? "light" : "dark";
        save();
        applyTheme();
        render();
        break;
      case "add-subject": {
        const name = prompt("Subject name:");
        if (name?.trim()) {
          const color = SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length];
          state.subjects.push({ id: uid("sub"), name: name.trim(), color });
          save();
          render();
        }
        break;
      }
      case "del-subject":
        if (state.subjects.length <= 1) return toast("Keep at least one subject");
        if (confirm("Remove subject?")) {
          state.subjects = state.subjects.filter((s) => s.id !== id);
          save();
          render();
        }
        break;
      case "reset-subjects":
        if (confirm("Replace subjects with Connor's FHHS Grade 10 list?")) {
          state.subjects = CONNOR_SUBJECTS.map((s) => ({ ...s }));
          save();
          toast("Subjects restored");
          render();
        }
        break;
      case "export-data": {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `school-hub-backup-${todayISO()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast("Backup downloaded");
        break;
      }
      case "import-data":
        document.getElementById("import-file")?.click();
        break;
      case "reset-all":
        if (confirm("Erase ALL data and start fresh?")) {
          state = defaultState();
          save();
          applyTheme();
          toast("Reset complete");
          setView("today");
        }
        break;
      default:
        break;
    }
  }

  document.addEventListener("change", (e) => {
    if (e.target.id !== "import-file") return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        state = { ...defaultState(), ...data, version: 2 };
        save();
        applyTheme();
        toast("Backup imported");
        render();
      } catch {
        toast("Could not import file");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  // ——— Boot ———
  applyTheme();
  studyRemaining = (state.focusMinutes || 25) * 60;
  render();
})();

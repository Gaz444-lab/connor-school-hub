/**
 * Connor's School Hub
 * Client-side student planner — data saved in localStorage.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "connor-school-hub-v1";
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const SUBJECT_COLORS = [
    "#4f6df5", "#16a34a", "#d97706", "#dc2626", "#7c3aed",
    "#0891b2", "#db2777", "#65a30d", "#ea580c", "#2563eb",
  ];

  const DEFAULT_SUBJECTS = [
    { id: "sub-math", name: "Maths", color: "#4f6df5" },
    { id: "sub-eng", name: "English", color: "#16a34a" },
    { id: "sub-sci", name: "Science", color: "#d97706" },
    { id: "sub-hist", name: "History", color: "#7c3aed" },
    { id: "sub-pe", name: "PE", color: "#0891b2" },
  ];

  const DEFAULT_ROUTINES = {
    morning: [
      { id: "m1", label: "Pack bag (books & homework)", done: false },
      { id: "m2", label: "Check timetable for today", done: false },
      { id: "m3", label: "Water bottle & lunch", done: false },
      { id: "m4", label: "Phone / keys / PE kit if needed", done: false },
    ],
    afternoon: [
      { id: "a1", label: "Empty bag — put letters on the table", done: false },
      { id: "a2", label: "Write down new homework", done: false },
      { id: "a3", label: "Do highest-priority homework first", done: false },
      { id: "a4", label: "Pack bag for tomorrow", done: false },
      { id: "a5", label: "Charge devices", done: false },
    ],
  };

  // ——— State ———
  let state = loadState();
  let currentView = "today";
  let selectedDay = todayWeekdayIndex();
  let hwFilter = "open";
  let toastTimer = null;

  // ——— Persistence ———
  function defaultState() {
    return {
      studentName: "Connor",
      theme: "light",
      subjects: DEFAULT_SUBJECTS.map((s) => ({ ...s })),
      homework: [],
      projects: [],
      tests: [],
      timetable: {},
      routines: {
        morning: DEFAULT_ROUTINES.morning.map((r) => ({ ...r })),
        afternoon: DEFAULT_ROUTINES.afternoon.map((r) => ({ ...r })),
      },
      routineDate: todayISO(),
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      return {
        ...base,
        ...parsed,
        subjects: parsed.subjects?.length ? parsed.subjects : base.subjects,
        routines: {
          morning: parsed.routines?.morning?.length ? parsed.routines.morning : base.routines.morning,
          afternoon: parsed.routines?.afternoon?.length ? parsed.routines.afternoon : base.routines.afternoon,
        },
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

  // ——— Dates ———
  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function todayWeekdayIndex() {
    // JS: 0=Sun … convert to Mon=0 … Sun=6
    const js = new Date().getDay();
    return js === 0 ? 6 : js - 1;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  function formatLongDate(d = new Date()) {
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
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
    if (n === null) return "";
    if (n < 0) return { text: `${Math.abs(n)}d overdue`, cls: "overdue" };
    if (n === 0) return { text: "Due today", cls: "soon" };
    if (n === 1) return { text: "Due tomorrow", cls: "soon" };
    if (n <= 7) return { text: `Due in ${n} days`, cls: "soon" };
    return { text: formatDate(iso), cls: "" };
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
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

  function subjectOptions(selected) {
    return state.subjects
      .map((s) => `<option value="${s.id}" ${s.id === selected ? "selected" : ""}>${esc(s.name)}</option>`)
      .join("");
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
    if (first) setTimeout(() => first.focus(), 50);
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
    currentView = view;
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
    render();
  }

  document.getElementById("main-nav").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (btn) setView(btn.dataset.view);
  });

  document.querySelector(".topbar-actions").addEventListener("click", (e) => {
    const themeBtn = e.target.closest("#theme-toggle");
    if (themeBtn) {
      state.theme = state.theme === "dark" ? "light" : "dark";
      save();
      applyTheme();
      return;
    }
    const settings = e.target.closest("[data-view='settings']");
    if (settings) setView("settings");
  });

  // ——— Render ———
  function render() {
    resetRoutinesIfNewDay();
    document.getElementById("date-line").textContent = formatLongDate();
    document.getElementById("app-title").textContent = `${state.studentName}'s School Hub`;
    document.title = `${state.studentName}'s School Hub`;

    const main = document.getElementById("main");
    const views = {
      today: renderToday,
      homework: renderHomework,
      projects: renderProjects,
      tests: renderTests,
      timetable: renderTimetable,
      routines: renderRoutines,
      settings: renderSettings,
    };
    main.innerHTML = (views[currentView] || renderToday)();
    bindMainEvents(main);
  }

  // ——— Today ———
  function renderToday() {
    const openHw = state.homework.filter((h) => !h.done);
    const dueSoon = openHw
      .filter((h) => {
        const n = daysUntil(h.due);
        return n !== null && n <= 3;
      })
      .sort((a, b) => (a.due || "").localeCompare(b.due || ""));
    const upcomingTests = state.tests
      .filter((t) => !t.done && daysUntil(t.date) !== null && daysUntil(t.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
    const dayName = DAYS[todayWeekdayIndex()];
    const periods = (state.timetable[dayName] || []).slice().sort(sortPeriods);
    const openProjects = state.projects.filter((p) => !p.done);
    const mDone = state.routines.morning.filter((r) => r.done).length;
    const aDone = state.routines.afternoon.filter((r) => r.done).length;

    return `
      <div class="greeting">
        <h2>${greeting()}, ${esc(state.studentName)}! 👋</h2>
        <p>Here's your school day at a glance.</p>
      </div>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${openHw.length}</div>
          <div class="stat-label">Homework</div>
        </div>
        <div class="stat">
          <div class="stat-value">${upcomingTests.length}</div>
          <div class="stat-label">Tests ahead</div>
        </div>
        <div class="stat">
          <div class="stat-value">${openProjects.length}</div>
          <div class="stat-label">Projects</div>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <h3 class="card-title">Today's classes <span class="count">${dayName}</span></h3>
          ${
            periods.length
              ? periods
                  .map((p) => {
                    const sub = subjectById(p.subjectId);
                    return `
                    <div class="period" style="--subject:${sub?.color || "var(--accent)"}">
                      <div class="period-time">${esc(p.start || "")}<br>${esc(p.end || "")}</div>
                      <div>
                        <div class="period-subject">${esc(sub?.name || p.title || "Class")}</div>
                        ${p.room ? `<div class="period-room">Room ${esc(p.room)}</div>` : ""}
                      </div>
                      <div></div>
                    </div>`;
                  })
                  .join("")
              : `<div class="empty"><div class="empty-icon">🗓️</div><p>No classes set for ${esc(dayName)}. Add them in Schedule.</p>
                 <button type="button" class="btn btn-secondary btn-sm" data-goto="timetable">Open Schedule</button></div>`
          }
        </div>
        <div class="card">
          <h3 class="card-title">Due soon <span class="count">${dueSoon.length}</span></h3>
          ${
            dueSoon.length
              ? `<div class="item-list">${dueSoon
                  .slice(0, 5)
                  .map((h) => homeworkItemHtml(h, true))
                  .join("")}</div>`
              : `<div class="empty"><div class="empty-icon">✨</div><p>Nothing urgent — nice work!</p></div>`
          }
        </div>
      </div>
      <div class="grid-2 mt-12">
        <div class="card">
          <h3 class="card-title">Upcoming tests <span class="count">${upcomingTests.length}</span></h3>
          ${
            upcomingTests.length
              ? `<div class="item-list">${upcomingTests.map((t) => testItemHtml(t, true)).join("")}</div>`
              : `<div class="empty"><p class="text-muted text-sm">No upcoming tests logged.</p></div>`
          }
        </div>
        <div class="card">
          <h3 class="card-title">Routines today</h3>
          <p class="text-sm text-muted mb-12">Morning ${mDone}/${state.routines.morning.length} · After school ${aDone}/${state.routines.afternoon.length}</p>
          <div class="progress-bar mb-12"><span style="width:${routinePct()}%"></span></div>
          <button type="button" class="btn btn-secondary btn-block" data-goto="routines">Open checklists</button>
        </div>
      </div>
    `;
  }

  function routinePct() {
    const all = [...state.routines.morning, ...state.routines.afternoon];
    if (!all.length) return 0;
    return Math.round((all.filter((r) => r.done).length / all.length) * 100);
  }

  // ——— Homework ———
  function renderHomework() {
    let list = state.homework.slice();
    if (hwFilter === "open") list = list.filter((h) => !h.done);
    else if (hwFilter === "done") list = list.filter((h) => h.done);
    list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.due || "9999").localeCompare(b.due || "9999");
    });

    return `
      <div class="view-header">
        <div>
          <h2>Homework</h2>
          <p>Track assignments and due dates</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-homework">+ Add</button>
      </div>
      <div class="filters">
        <button type="button" class="chip ${hwFilter === "open" ? "active" : ""}" data-hw-filter="open">To do</button>
        <button type="button" class="chip ${hwFilter === "done" ? "active" : ""}" data-hw-filter="done">Done</button>
        <button type="button" class="chip ${hwFilter === "all" ? "active" : ""}" data-hw-filter="all">All</button>
      </div>
      <div class="card">
        ${
          list.length
            ? `<div class="item-list">${list.map((h) => homeworkItemHtml(h)).join("")}</div>`
            : `<div class="empty"><div class="empty-icon">📝</div><p>No homework here yet.</p>
               <button type="button" class="btn btn-primary btn-sm" data-action="add-homework">Add homework</button></div>`
        }
      </div>
    `;
  }

  function homeworkItemHtml(h, compact) {
    const due = dueLabel(h.due);
    const pri = h.priority || "medium";
    return `
      <div class="item ${h.done ? "done" : ""}" data-id="${h.id}">
        <button type="button" class="item-check ${h.done ? "checked" : ""}" data-action="toggle-hw" data-id="${h.id}" aria-label="Mark done">
          ${h.done ? "✓" : ""}
        </button>
        <div class="item-body">
          <p class="item-title">${esc(h.title)}</p>
          <div class="item-meta">
            ${subjectBadge(h.subjectId)}
            ${due.text ? `<span class="badge ${due.cls}">${esc(due.text)}</span>` : ""}
            <span class="badge priority-${pri}">${pri}</span>
            ${h.notes && !compact ? `<span>${esc(h.notes.slice(0, 60))}${h.notes.length > 60 ? "…" : ""}</span>` : ""}
          </div>
        </div>
        ${
          compact
            ? ""
            : `<div class="item-actions">
                <button type="button" class="icon-btn" data-action="edit-hw" data-id="${h.id}" title="Edit">✏️</button>
                <button type="button" class="icon-btn" data-action="del-hw" data-id="${h.id}" title="Delete">🗑️</button>
              </div>`
        }
      </div>`;
  }

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
      bodyHtml: `
        <div class="form-stack">
          <div class="field">
            <label for="hw-title">Title</label>
            <input id="hw-title" value="${esc(h.title)}" placeholder="e.g. Algebra worksheet p.42" required />
          </div>
          <div class="field-row">
            <div class="field">
              <label for="hw-subject">Subject</label>
              <select id="hw-subject">${subjectOptions(h.subjectId)}</select>
            </div>
            <div class="field">
              <label for="hw-due">Due date</label>
              <input type="date" id="hw-due" value="${esc(h.due || "")}" />
            </div>
          </div>
          <div class="field">
            <label for="hw-priority">Priority</label>
            <select id="hw-priority">
              <option value="low" ${h.priority === "low" ? "selected" : ""}>Low</option>
              <option value="medium" ${h.priority === "medium" ? "selected" : ""}>Medium</option>
              <option value="high" ${h.priority === "high" ? "selected" : ""}>High</option>
            </select>
          </div>
          <div class="field">
            <label for="hw-notes">Notes</label>
            <textarea id="hw-notes" placeholder="Page numbers, teacher notes…">${esc(h.notes || "")}</textarea>
          </div>
        </div>`,
      footerHtml: `
        <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
        <button type="button" class="btn btn-primary" id="hw-save">${existing ? "Save" : "Add"}</button>`,
    });
    document.getElementById("hw-save").onclick = () => {
      const title = document.getElementById("hw-title").value.trim();
      if (!title) {
        toast("Add a title");
        return;
      }
      const data = {
        title,
        subjectId: document.getElementById("hw-subject").value,
        due: document.getElementById("hw-due").value,
        priority: document.getElementById("hw-priority").value,
        notes: document.getElementById("hw-notes").value.trim(),
        done: h.done || false,
      };
      if (existing) {
        Object.assign(existing, data);
        toast("Homework updated");
      } else {
        state.homework.push({ id: uid("hw"), createdAt: todayISO(), ...data });
        toast("Homework added");
      }
      save();
      closeModal();
      render();
    };
  }

  // ——— Projects ———
  function renderProjects() {
    const list = state.projects.slice().sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.due || "9999").localeCompare(b.due || "9999");
    });
    return `
      <div class="view-header">
        <div>
          <h2>Projects</h2>
          <p>Bigger work with progress tracking</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-project">+ Add</button>
      </div>
      <div class="card">
        ${
          list.length
            ? `<div class="item-list">${list.map(projectItemHtml).join("")}</div>`
            : `<div class="empty"><div class="empty-icon">🚀</div><p>No projects yet — science fair, essays, group work…</p>
               <button type="button" class="btn btn-primary btn-sm" data-action="add-project">Add project</button></div>`
        }
      </div>
    `;
  }

  function projectItemHtml(p) {
    const pct = Math.min(100, Math.max(0, Number(p.progress) || 0));
    const due = dueLabel(p.due);
    return `
      <div class="item ${p.done ? "done" : ""}">
        <button type="button" class="item-check ${p.done ? "checked" : ""}" data-action="toggle-project" data-id="${p.id}">
          ${p.done ? "✓" : ""}
        </button>
        <div class="item-body">
          <p class="item-title">${esc(p.title)}</p>
          <div class="item-meta">
            ${subjectBadge(p.subjectId)}
            ${due.text ? `<span class="badge ${due.cls}">${esc(due.text)}</span>` : ""}
            <span class="badge">${pct}%</span>
          </div>
          <div class="progress-bar"><span style="width:${pct}%"></span></div>
          ${p.notes ? `<p class="text-sm text-muted mt-8">${esc(p.notes)}</p>` : ""}
        </div>
        <div class="item-actions">
          <button type="button" class="icon-btn" data-action="edit-project" data-id="${p.id}">✏️</button>
          <button type="button" class="icon-btn" data-action="del-project" data-id="${p.id}">🗑️</button>
        </div>
      </div>`;
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
          <div class="field">
            <label for="pr-title">Title</label>
            <input id="pr-title" value="${esc(p.title)}" placeholder="e.g. History research project" />
          </div>
          <div class="field-row">
            <div class="field">
              <label for="pr-subject">Subject</label>
              <select id="pr-subject">${subjectOptions(p.subjectId)}</select>
            </div>
            <div class="field">
              <label for="pr-due">Due date</label>
              <input type="date" id="pr-due" value="${esc(p.due || "")}" />
            </div>
          </div>
          <div class="field">
            <label for="pr-progress">Progress (${Number(p.progress) || 0}%)</label>
            <input type="range" id="pr-progress" min="0" max="100" step="5" value="${Number(p.progress) || 0}" />
          </div>
          <div class="field">
            <label for="pr-notes">Notes / next steps</label>
            <textarea id="pr-notes">${esc(p.notes || "")}</textarea>
          </div>
        </div>`,
      footerHtml: `
        <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
        <button type="button" class="btn btn-primary" id="pr-save">${existing ? "Save" : "Add"}</button>`,
    });
    const range = document.getElementById("pr-progress");
    const label = range.previousElementSibling;
    range.oninput = () => {
      label.textContent = `Progress (${range.value}%)`;
    };
    document.getElementById("pr-save").onclick = () => {
      const title = document.getElementById("pr-title").value.trim();
      if (!title) {
        toast("Add a title");
        return;
      }
      const data = {
        title,
        subjectId: document.getElementById("pr-subject").value,
        due: document.getElementById("pr-due").value,
        progress: Number(document.getElementById("pr-progress").value) || 0,
        notes: document.getElementById("pr-notes").value.trim(),
        done: existing ? existing.done : false,
      };
      if (data.progress >= 100) data.done = true;
      if (existing) {
        Object.assign(existing, data);
        toast("Project updated");
      } else {
        state.projects.push({ id: uid("pr"), ...data });
        toast("Project added");
      }
      save();
      closeModal();
      render();
    };
  }

  // ——— Tests ———
  function renderTests() {
    const list = state.tests.slice().sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.date || "9999").localeCompare(b.date || "9999");
    });
    return `
      <div class="view-header">
        <div>
          <h2>Tests & exams</h2>
          <p>Know what's coming and plan revision</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-test">+ Add</button>
      </div>
      <div class="card">
        ${
          list.length
            ? `<div class="item-list">${list.map((t) => testItemHtml(t)).join("")}</div>`
            : `<div class="empty"><div class="empty-icon">📋</div><p>No tests logged yet.</p>
               <button type="button" class="btn btn-primary btn-sm" data-action="add-test">Add a test</button></div>`
        }
      </div>
    `;
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
        when = `In ${n} days · ${formatDate(t.date)}`;
        if (n <= 7) cls = "soon";
      }
    }
    return `
      <div class="item ${t.done ? "done" : ""}">
        <button type="button" class="item-check ${t.done ? "checked" : ""}" data-action="toggle-test" data-id="${t.id}">
          ${t.done ? "✓" : ""}
        </button>
        <div class="item-body">
          <p class="item-title">${esc(t.title)}</p>
          <div class="item-meta">
            ${subjectBadge(t.subjectId)}
            <span class="badge ${cls}">${esc(when)}</span>
            ${t.topic ? `<span>${esc(t.topic)}</span>` : ""}
          </div>
          ${t.notes && !compact ? `<p class="text-sm text-muted mt-8">${esc(t.notes)}</p>` : ""}
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
      bodyHtml: `
        <div class="form-stack">
          <div class="field">
            <label for="te-title">Title</label>
            <input id="te-title" value="${esc(t.title)}" placeholder="e.g. Mid-term Maths exam" />
          </div>
          <div class="field-row">
            <div class="field">
              <label for="te-subject">Subject</label>
              <select id="te-subject">${subjectOptions(t.subjectId)}</select>
            </div>
            <div class="field">
              <label for="te-date">Date</label>
              <input type="date" id="te-date" value="${esc(t.date || "")}" />
            </div>
          </div>
          <div class="field">
            <label for="te-topic">Topic / chapters</label>
            <input id="te-topic" value="${esc(t.topic || "")}" placeholder="e.g. Fractions & percentages" />
          </div>
          <div class="field">
            <label for="te-notes">Revision notes</label>
            <textarea id="te-notes">${esc(t.notes || "")}</textarea>
          </div>
        </div>`,
      footerHtml: `
        <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
        <button type="button" class="btn btn-primary" id="te-save">${existing ? "Save" : "Add"}</button>`,
    });
    document.getElementById("te-save").onclick = () => {
      const title = document.getElementById("te-title").value.trim();
      if (!title) {
        toast("Add a title");
        return;
      }
      const data = {
        title,
        subjectId: document.getElementById("te-subject").value,
        date: document.getElementById("te-date").value,
        topic: document.getElementById("te-topic").value.trim(),
        notes: document.getElementById("te-notes").value.trim(),
        done: t.done || false,
      };
      if (existing) {
        Object.assign(existing, data);
        toast("Test updated");
      } else {
        state.tests.push({ id: uid("te"), ...data });
        toast("Test added");
      }
      save();
      closeModal();
      render();
    };
  }

  // ——— Timetable ———
  function sortPeriods(a, b) {
    return (a.start || "").localeCompare(b.start || "");
  }

  function renderTimetable() {
    const dayName = DAYS[selectedDay];
    const periods = (state.timetable[dayName] || []).slice().sort(sortPeriods);
    const todayIdx = todayWeekdayIndex();

    return `
      <div class="view-header">
        <div>
          <h2>Schedule</h2>
          <p>Weekly class timetable</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="add-period">+ Class</button>
      </div>
      <div class="day-tabs">
        ${DAYS.map(
          (d, i) => `
          <button type="button" class="day-tab ${i === selectedDay ? "active" : ""} ${i === todayIdx ? "today" : ""}" data-day="${i}">
            ${d.slice(0, 3)}
          </button>`
        ).join("")}
      </div>
      <div class="card">
        <h3 class="card-title">${esc(dayName)}</h3>
        ${
          periods.length
            ? periods
                .map((p) => {
                  const sub = subjectById(p.subjectId);
                  return `
                  <div class="period" style="--subject:${sub?.color || "var(--accent)"}">
                    <div class="period-time">${esc(p.start || "—")}<br>${esc(p.end || "")}</div>
                    <div>
                      <div class="period-subject">${esc(sub?.name || p.title || "Class")}</div>
                      ${p.room ? `<div class="period-room">Room ${esc(p.room)}</div>` : ""}
                      ${p.notes ? `<div class="period-room">${esc(p.notes)}</div>` : ""}
                    </div>
                    <div class="item-actions">
                      <button type="button" class="icon-btn" data-action="edit-period" data-id="${p.id}" data-day="${esc(dayName)}">✏️</button>
                      <button type="button" class="icon-btn" data-action="del-period" data-id="${p.id}" data-day="${esc(dayName)}">🗑️</button>
                    </div>
                  </div>`;
                })
                .join("")
            : `<div class="empty"><div class="empty-icon">🗓️</div><p>No classes on ${esc(dayName)} yet.</p>
               <button type="button" class="btn btn-primary btn-sm" data-action="add-period">Add a class</button></div>`
        }
      </div>
    `;
  }

  function openPeriodModal(dayName, existing) {
    const p = existing || {
      subjectId: state.subjects[0]?.id || "",
      start: "09:00",
      end: "09:50",
      room: "",
      notes: "",
    };
    openModal({
      title: existing ? "Edit class" : `Add class — ${dayName}`,
      bodyHtml: `
        <div class="form-stack">
          <div class="field">
            <label for="pe-subject">Subject</label>
            <select id="pe-subject">${subjectOptions(p.subjectId)}</select>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="pe-start">Start</label>
              <input type="time" id="pe-start" value="${esc(p.start || "09:00")}" />
            </div>
            <div class="field">
              <label for="pe-end">End</label>
              <input type="time" id="pe-end" value="${esc(p.end || "09:50")}" />
            </div>
          </div>
          <div class="field">
            <label for="pe-room">Room</label>
            <input id="pe-room" value="${esc(p.room || "")}" placeholder="e.g. B12" />
          </div>
          <div class="field">
            <label for="pe-notes">Notes</label>
            <input id="pe-notes" value="${esc(p.notes || "")}" placeholder="Teacher, equipment…" />
          </div>
        </div>`,
      footerHtml: `
        <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
        <button type="button" class="btn btn-primary" id="pe-save">${existing ? "Save" : "Add"}</button>`,
    });
    document.getElementById("pe-save").onclick = () => {
      const data = {
        subjectId: document.getElementById("pe-subject").value,
        start: document.getElementById("pe-start").value,
        end: document.getElementById("pe-end").value,
        room: document.getElementById("pe-room").value.trim(),
        notes: document.getElementById("pe-notes").value.trim(),
      };
      if (!state.timetable[dayName]) state.timetable[dayName] = [];
      if (existing) {
        Object.assign(existing, data);
        toast("Class updated");
      } else {
        state.timetable[dayName].push({ id: uid("pe"), ...data });
        toast("Class added");
      }
      save();
      closeModal();
      render();
    };
  }

  // ——— Routines ———
  function renderRoutines() {
    return `
      <div class="view-header">
        <div>
          <h2>Routines</h2>
          <p>Before school & after school checklists · resets each day</p>
        </div>
      </div>
      <div class="grid-2">
        <div class="card routine-section">
          <h3 class="card-title">🌅 Before school
            <span class="count">${state.routines.morning.filter((r) => r.done).length}/${state.routines.morning.length}</span>
          </h3>
          ${state.routines.morning.map((r) => routineRow("morning", r)).join("")}
          <button type="button" class="btn btn-secondary btn-sm mt-12" data-action="add-routine" data-which="morning">+ Item</button>
        </div>
        <div class="card routine-section">
          <h3 class="card-title">🏠 After school
            <span class="count">${state.routines.afternoon.filter((r) => r.done).length}/${state.routines.afternoon.length}</span>
          </h3>
          ${state.routines.afternoon.map((r) => routineRow("afternoon", r)).join("")}
          <button type="button" class="btn btn-secondary btn-sm mt-12" data-action="add-routine" data-which="afternoon">+ Item</button>
        </div>
      </div>
    `;
  }

  function routineRow(which, r) {
    return `
      <div class="routine-item ${r.done ? "done" : ""}">
        <button type="button" class="item-check ${r.done ? "checked" : ""}" data-action="toggle-routine" data-which="${which}" data-id="${r.id}">
          ${r.done ? "✓" : ""}
        </button>
        <span class="routine-label">${esc(r.label)}</span>
        <button type="button" class="icon-btn" data-action="del-routine" data-which="${which}" data-id="${r.id}" title="Remove">🗑️</button>
      </div>`;
  }

  // ——— Settings ———
  function renderSettings() {
    return `
      <div class="view-header">
        <div>
          <h2>Settings</h2>
          <p>Personalise the hub & manage data</p>
        </div>
      </div>
      <div class="card settings-section">
        <h3>Profile</h3>
        <div class="form-stack">
          <div class="field">
            <label for="set-name">Student name</label>
            <input id="set-name" value="${esc(state.studentName)}" />
          </div>
          <button type="button" class="btn btn-primary" data-action="save-name">Save name</button>
        </div>
      </div>
      <div class="card settings-section">
        <h3>Subjects</h3>
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
      </div>
      <div class="card settings-section">
        <h3>Appearance</h3>
        <button type="button" class="btn btn-secondary" data-action="toggle-theme">
          Switch to ${state.theme === "dark" ? "light" : "dark"} mode
        </button>
      </div>
      <div class="card settings-section">
        <h3>Backup & share</h3>
        <p class="text-sm text-muted mb-12">Export a JSON backup, or import one on another device. Data stays in this browser unless you export.</p>
        <div class="flex-between" style="flex-wrap:wrap">
          <button type="button" class="btn btn-secondary" data-action="export-data">Export backup</button>
          <button type="button" class="btn btn-secondary" data-action="import-data">Import backup</button>
        </div>
        <input type="file" id="import-file" accept="application/json,.json" hidden />
      </div>
      <div class="card settings-section">
        <h3>Danger zone</h3>
        <button type="button" class="btn btn-danger" data-action="reset-all">Reset all data</button>
      </div>
      <p class="text-sm text-muted" style="text-align:center;padding:8px">Connor's School Hub · data saved on this device</p>
    `;
  }

  // ——— Event binding for main ———
  function bindMainEvents(main) {
    main.addEventListener("click", onMainClick);
    main.querySelectorAll("[data-day]").forEach((tab) => {
      // day tabs handled in onMainClick
    });
  }

  function onMainClick(e) {
    const goto = e.target.closest("[data-goto]");
    if (goto) {
      setView(goto.dataset.goto);
      return;
    }

    const dayTab = e.target.closest("[data-day]");
    if (dayTab && dayTab.classList.contains("day-tab")) {
      selectedDay = Number(dayTab.dataset.day);
      render();
      return;
    }

    const filter = e.target.closest("[data-hw-filter]");
    if (filter) {
      hwFilter = filter.dataset.hwFilter;
      render();
      return;
    }

    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;

    switch (action) {
      case "add-homework":
        openHomeworkModal(null);
        break;
      case "edit-hw": {
        const h = state.homework.find((x) => x.id === id);
        if (h) openHomeworkModal(h);
        break;
      }
      case "toggle-hw": {
        const h = state.homework.find((x) => x.id === id);
        if (h) {
          h.done = !h.done;
          save();
          render();
        }
        break;
      }
      case "del-hw":
        if (confirm("Delete this homework?")) {
          state.homework = state.homework.filter((x) => x.id !== id);
          save();
          toast("Deleted");
          render();
        }
        break;

      case "add-project":
        openProjectModal(null);
        break;
      case "edit-project": {
        const p = state.projects.find((x) => x.id === id);
        if (p) openProjectModal(p);
        break;
      }
      case "toggle-project": {
        const p = state.projects.find((x) => x.id === id);
        if (p) {
          p.done = !p.done;
          if (p.done) p.progress = 100;
          save();
          render();
        }
        break;
      }
      case "del-project":
        if (confirm("Delete this project?")) {
          state.projects = state.projects.filter((x) => x.id !== id);
          save();
          toast("Deleted");
          render();
        }
        break;

      case "add-test":
        openTestModal(null);
        break;
      case "edit-test": {
        const t = state.tests.find((x) => x.id === id);
        if (t) openTestModal(t);
        break;
      }
      case "toggle-test": {
        const t = state.tests.find((x) => x.id === id);
        if (t) {
          t.done = !t.done;
          save();
          render();
        }
        break;
      }
      case "del-test":
        if (confirm("Delete this test?")) {
          state.tests = state.tests.filter((x) => x.id !== id);
          save();
          toast("Deleted");
          render();
        }
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
        if (confirm("Remove this class?")) {
          state.timetable[day] = (state.timetable[day] || []).filter((x) => x.id !== id);
          save();
          toast("Removed");
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
        if (label && label.trim()) {
          state.routines[which].push({ id: uid("rt"), label: label.trim(), done: false });
          save();
          render();
        }
        break;
      }

      case "save-name": {
        const name = document.getElementById("set-name")?.value.trim() || "Connor";
        state.studentName = name;
        save();
        toast("Name saved");
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
        if (name && name.trim()) {
          const color = SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length];
          state.subjects.push({ id: uid("sub"), name: name.trim(), color });
          save();
          toast("Subject added");
          render();
        }
        break;
      }
      case "del-subject":
        if (state.subjects.length <= 1) {
          toast("Keep at least one subject");
          break;
        }
        if (confirm("Remove this subject?")) {
          state.subjects = state.subjects.filter((s) => s.id !== id);
          save();
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
        if (confirm("Erase ALL data and start fresh? This cannot be undone.")) {
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

  // Import file (delegated once)
  document.addEventListener("change", (e) => {
    if (e.target.id !== "import-file") return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object") throw new Error("Invalid");
        state = { ...defaultState(), ...data };
        save();
        applyTheme();
        toast("Backup imported");
        render();
      } catch {
        toast("Could not import that file");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  // ——— Boot ———
  applyTheme();
  render();
})();

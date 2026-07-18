# Connor's School Hub 🎒

**Central daily workspace for Grade 10 at Fish Hoek High School.**

Subjects built in: **Art · Drama · English · Afrikaans · Maths Lit · Life Orientation · History · EGD**

Same idea as AccountHub for Mum: live on the Mac via Desktop shortcuts, updates from GitHub when Dad ships changes. Data stays in the browser on that Mac.

---

## For Connor’s Mac (after Xcode / git is ready)

### First time only

Open **Terminal** and paste:

```bash
curl -fsSL https://raw.githubusercontent.com/Gaz444-lab/connor-school-hub/main/scripts/setup-for-connor.sh | bash
```

That clones into `~/Documents/connor-school-hub` and puts on the **Desktop**:

| Shortcut | When to use |
|----------|-------------|
| **School Hub.command** | Every day — opens the app |
| **Update School Hub.command** | After Dad says he pushed an update |

macOS may ask to allow Terminal the first time → **Open**.

### Every day

1. Double-click **School Hub.command**
2. Browser opens → `http://127.0.0.1:8765/`
3. Work in the hub (homework, grades, study timer, etc.)

### When Dad ships an update

Double-click **Update School Hub.command**, then open **School Hub** again.

> **Wait for Xcode?** Yes — run the `curl` setup **after** `xcode-select --install` finishes (needs `git`). You do **not** need to re-run setup for every app feature update; use **Update School Hub** for those.

### Optional: website (no install)

https://gaz444-lab.github.io/connor-school-hub/

---

## What’s in the hub

| Area | Features |
|------|----------|
| **Today** | Greeting, due/late counts, next class, focus list, today’s timetable, tests, routines & goals |
| **Agenda** | Week strip calendar — homework, tests, projects, custom events |
| **Work** | Homework · Projects · Tests (priorities, due dates, progress bars) |
| **Grades** | Log marks (score / out of / weight), subject averages, overall average |
| **Study** | Focus timer (Pomodoro-style), session log, study streak |
| **More** | Timetable, before/after school routines, subject notes, goals, school links (Classroom, D6, Drive…) |
| **＋ / Settings** | Quick-add anything · profile · dark mode · export/import backup |

Research-backed student-planner staples: timetable, agenda, grades, reminders via due badges, study blocks, subject organisation, one “command centre” home screen.

---

## For Dad (your Mac)

Repo: https://github.com/Gaz444-lab/connor-school-hub  
Local: `~/connor-school-hub`

```bash
cd ~/connor-school-hub
# edit files…
git add -A
git commit -m "Describe the change"
git push
```

Tell Connor to run **Update School Hub.command**.

His marks/homework live in **his** browser localStorage — not in git.

---

## Tech

Static HTML/CSS/JS · no Node required · Python local server for daily use · GitHub Pages optional.

Made for Connor · Fish Hoek High · Grade 10 🌊

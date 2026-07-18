# Connor's School Hub 📚

A simple school organiser for tracking **homework**, **projects**, **tests**, **class schedules**, and **before/after school routines**.

Built as a static web app — no server, no install. Data is saved in the browser (localStorage). Perfect for GitHub Pages so Connor can open a link and always get the latest version of the app when you push updates.

## Features

| Area | What it does |
|------|----------------|
| **Today** | Greeting, counts, today's classes, due-soon homework, upcoming tests, routine progress |
| **Homework** | Add / complete / prioritise assignments by subject and due date |
| **Projects** | Longer work with a progress bar |
| **Tests** | Exam dates with countdown and revision notes |
| **Schedule** | Weekly timetable (Mon–Sun) with times and rooms |
| **Routines** | Morning “to school” and after-school checklists (reset each day) |
| **Settings** | Rename student, manage subjects, dark mode, export/import backup |

## Live app (easiest on a MacBook)

**Open in the browser (always the latest code after GitHub Pages builds):**

👉 **https://gaz444-lab.github.io/connor-school-hub/**

Bookmark that URL on Connor’s MacBook, or keep it in the Dock.

---

## One-time setup on Connor’s Mac (Desktop shortcut + auto-updates)

On **Connor’s MacBook**, open **Terminal** and paste:

```bash
curl -fsSL https://raw.githubusercontent.com/Gaz444-lab/connor-school-hub/main/scripts/setup-for-connor.sh | bash
```

That will:

1. Download the app into `~/Documents/connor-school-hub`
2. Put **Connor School Hub** on the Desktop

Then he double-clicks **Connor School Hub** on the Desktop.  
Each launch: pull latest from GitHub → open the app in the browser.

macOS may ask to allow Terminal the first time — choose **Open**.

### Already cloned?

```bash
cd ~/Documents/connor-school-hub   # or wherever it lives
bash scripts/setup-for-connor.sh
```

Or double-click **Open School Hub.command** inside the project folder.

---

## Repo

- GitHub: https://github.com/Gaz444-lab/connor-school-hub  
- Pages: https://gaz444-lab.github.io/connor-school-hub/

### Updating the app (dad)

Edit files on your machine, then:

```bash
cd ~/connor-school-hub
git add .
git commit -m "Describe the change"
git push
```

Pages redeploys in about a minute. Connor’s Desktop shortcut also runs `git pull` when he opens it.

> **Note:** App *code* updates via GitHub. Connor’s *personal data* (homework list, etc.) lives in **his** browser. Use **Settings → Export backup** to move data between devices.

## Add to Home Screen (phone)

- **iPhone:** Safari → Share → **Add to Home Screen**
- **Android:** Chrome → menu → **Add to Home screen** / **Install app**

## Tech

- Plain HTML, CSS, and JavaScript (no build step)
- Works offline after first load (same device/browser)
- Optional PWA manifest for home-screen install

## Privacy

Everything stays on the device unless you export a backup file. No accounts, no analytics, no cloud sync built in.

---

Made for Connor 🎒

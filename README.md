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

## Run locally

Open `index.html` in a browser, or from this folder:

```bash
# Python
python3 -m http.server 8080

# or Node
npx --yes serve .
```

Then visit `http://localhost:8080`.

## Push to GitHub (so Connor gets app updates)

1. Create a new **empty** repository on GitHub (e.g. `connor-school-hub`).
2. In this folder:

```bash
cd ~/connor-school-hub
git init
git add .
git commit -m "Initial commit: Connor's School Hub"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/connor-school-hub.git
git push -u origin main
```

3. Enable **GitHub Pages**:
   - Repo → **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: `main` / folder `/ (root)` → Save

4. After a minute, the app is live at:

   `https://YOUR_USERNAME.github.io/connor-school-hub/`

Share that link with Connor (bookmark it, or “Add to Home Screen” on iPhone/Android for an app-like icon).

### Updating the app later

Edit files → commit → push. Pages redeploys automatically. Connor refreshes the page (or reopens the bookmark) to get the new version.

```bash
git add .
git commit -m "Describe the change"
git push
```

> **Note:** App *code* updates via GitHub. Connor’s *personal data* (homework list, etc.) lives in his browser. Use **Settings → Export backup** if he needs to move data to another device.

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

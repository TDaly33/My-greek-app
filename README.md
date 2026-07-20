# Ρήματα — Greek Verb Drill

A practice app for the 79 verbs in the dataset. Pick tenses, voice, and a
verb group, then type the conjugated forms. Works fully offline once set up.

**First, decide what you want:**
- Just try it on your computer right now → do **Part 0** then **Part 1**.
- Want it as an installed app icon on your phone, usable with no wifi → do
  **Part 0**, **Part 1** to check it works, then **Part 2**.

---

## Part 0 — Download the files into one folder

You need all 13 files below saved into a folder named `greek-app` — 11 sit
directly inside it, and 2 font files go in a `fonts` subfolder inside it.
This only works if the structure matches exactly.

### Step 1: Create the folders

Anywhere you like (e.g. your Desktop), create a new folder named
`greek-app`. Inside that folder, create one more folder named `fonts`.

```
greek-app/
├── (11 files go here)
└── fonts/
    └── (2 font files go here)
```

### Step 2: Download each file into the right place

**Into `greek-app/` directly:**
- `index.html`
- `style.css`
- `app.js`
- `manifest.json`
- `sw.js`
- `verbs_index.json`
- `verbs_conjugated.json`
- `icon.svg`
- `icon-192.png`
- `icon-512.png`
- `icon-maskable.png`

**Into `greek-app/fonts/`:**
- `Lora.woff`
- `Lora-Italic.woff`

### Step 3: Double-check

Confirm the 11 files sit directly inside `greek-app`, and the 2 font files
sit inside `greek-app/fonts/`. That's it, ready for Part 1.

---

## Part 1 — Run it on your computer

Don't double-click `index.html` — it won't load the verb data that way.
Follow these steps exactly instead.

### Step 1: Open a terminal

- **Mac:** open the "Terminal" app (search for it with Spotlight, Cmd+Space).
- **Windows:** open "Command Prompt" or "PowerShell" (search in the Start menu).

### Step 2: Go to the app folder

Type `cd ` (with a space after it), then drag the `greek-app` folder from
your file explorer/Finder into the terminal window — it'll paste the path
in automatically. Press Enter. You should now be "inside" the folder.

### Step 3: Start a local server

Copy-paste this exact line into the terminal and press Enter:

```
python3 -m http.server 8000
```

- If that gives an error like "command not found", try `python` instead of
  `python3`.
- If neither works, you don't have Python installed. Install it from
  [python.org](https://python.org) (just click through the installer with
  default options), then try Step 3 again.

Leave this terminal window open — closing it stops the app.

### Step 4: Open it in your browser

Go to this address in Chrome, Safari, or Edge:

```
http://localhost:8000
```

The app should load. Try building a practice set and answering a few
questions to confirm it works.

### Step 5: Test offline mode (optional but recommended)

With the page still open, turn off your wifi. Reload the page. It should
still work — that's the service worker doing its job.

**To stop the app later:** click back into the terminal window and press
`Ctrl+C`, then close the window.

---

## Part 2 — Install it as an app icon on your phone

Phones require a real `https://` web address to allow "install to home
screen" and offline caching — a plain local address from Part 1 won't
qualify. Two free ways to get one:

- **Netlify Drop** — faster, but needs a computer and can be unreliable
  when attempted from a phone browser.
- **GitHub Pages** — a couple more steps, but fully reliable and works
  entirely from a phone if you're away from your computer.

### Option A: Netlify Drop (from a computer)

**Step 1:** Open **[app.netlify.com/drop](https://app.netlify.com/drop)**
on your computer.

**Step 2:** Drag your whole `greek-app` folder (the one containing
`index.html`) onto the page where it says to drop files.

**Step 3:** Netlify gives you a URL like
`https://random-name-12345.netlify.app` — a live, permanent address for
your app. Skip to "Add it to your home screen" below.

### Option B: GitHub Pages (works entirely from your phone)

**Step 1: Get the files onto your phone.** Download all 11 files (see
Part 0) onto your iPhone — tap each, then Share → **Save to Files**, into
one folder so they're easy to find later.

**Step 2: Create a free GitHub account** (skip if you have one) at
**[github.com/join](https://github.com/join)** in Safari.

**Step 3: Create a new repository.**
1. Go to **[github.com/new](https://github.com/new)**
2. Repository name: `greek-app` (or anything)
3. Leave it set to **Public**
4. Don't check "Add a README"
5. Tap **Create repository**

**Step 4: Upload your files.**
1. On the new repo's page, tap **Add file** → **Upload files**
2. Tap **choose your files** → **Browse** → find your files → select all
   11 → **Open**
3. Wait for them to appear in the upload list, scroll down, tap
   **Commit changes**
4. If multi-select is fussy, upload in a few smaller batches instead —
   repeat "Add file → Upload files" 2–3 times

**Step 5: Turn on GitHub Pages.**
1. On the repo page, go to **Settings** (may be under a "..." menu, or
   swipe the tab row)
2. Scroll to **Pages** in the left-hand list
3. Under "Build and deployment": Source = **Deploy from a branch**,
   branch = **main**, folder = **/(root)**
4. Tap **Save**

**Step 6: Get your URL.** Wait about a minute, refresh the Pages settings
screen — your live URL appears, like
`https://yourname.github.io/greek-app/`.

### Add it to your home screen (either option)

Open your URL in:
- **iPhone:** Safari (must be Safari, not Chrome)
- **Android:** Chrome

Then:
- **iPhone (Safari):** tap the Share icon (square with an arrow) → **Add to
  Home Screen** → Add.
- **Android (Chrome):** tap the ⋮ menu (top right) → **Add to Home
  screen** → Add.

### Make it work offline

Open the app from its new home-screen icon once while connected to wifi
or data — this lets it download and cache everything. After that, turn on
airplane mode and open it again to confirm it still works.

---

## If something breaks

| Problem | Likely fix |
|---|---|
| Blank page / "failed to fetch" | You opened `index.html` directly instead of via `http://localhost:8000` — go back to Part 1. |
| "python3: command not found" | Try `python` instead, or install Python from python.org. |
| Netlify page looks broken online | Make sure you dragged the *folder*, not a zip file, and that it contains `index.html` at the top level (not inside a subfolder). |
| GitHub file upload not multi-selecting on iPhone | Upload files in smaller batches — repeat "Add file → Upload files" a few times instead of selecting all 11 at once. |
| Doesn't work offline on phone | Open the app once while online first — it needs that first visit to cache the files. |
| **You updated the files but still see the old version** | This is a service worker caching thing, not a mistake on your part — see below. |

### Fixing "I still see the old version"

The app caches itself aggressively so it works offline, which means after your
*first* visit, your browser may keep serving that first version indefinitely
even after you replace the files — it doesn't know to check again.

**Quickest fix — two reloads:**
1. Replace the files in your `greek-app` folder with the new ones (overwrite,
   don't create a second folder).
2. Reload the page once (this lets the browser notice the app changed).
3. Reload a second time (this actually loads the new version).

**If that doesn't work, force it manually:**
1. Open Chrome DevTools (F12, or right-click → Inspect).
2. Go to the **Application** tab → **Service Workers** on the left.
3. Click **Unregister** next to the app's service worker.
4. Still in DevTools, go to **Application → Storage**, click **Clear site data**.
5. Close DevTools and reload the page normally.

**Fastest way to just check the new version is real:** open
`http://localhost:8000` in an Incognito/Private window — that has no cached
service worker yet, so it always shows the true current files.

---

## What's in the folder

- `index.html` / `style.css` / `app.js` — the app itself
- `verbs_index.json` — lightweight verb list (id, lemma, translation, class)
- `verbs_conjugated.json` — full conjugated paradigms for all 79 verbs
- `manifest.json` / `sw.js` — enable "Add to Home Screen" and offline mode
- `icon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable.png` — app icon

## How practice sessions work

Reworked to match how Conjuguemos actually works, including its retry-until-
correct grading style (confirmed by checking how Conjuguemos itself behaves,
not guessed).

- **Verbs** — a searchable, numbered checklist of all 79 verbs grouped by
  conjugation class, with quick-select chips for each group (Irregular,
  Class A, Class B1, Class B2, Passive/Deponent) so you can select or
  deselect a whole category in one tap, on top of picking verbs individually.
- **Tenses & moods** and **Pronouns** — pick exactly which tenses and which
  of the 6 persons to be quizzed on.
- **Voice** — active, passive, or both.
- **Practice length** — just set a timer (1–60 minutes) and go, exactly how
  Conjuguemos works: no card limit, verbs repeat as needed to fill the time,
  with a live countdown.
- **Live score** — visible the whole time you're drilling ("Score: 6/8"),
  not just at the end.
- **The Greek pronoun only** during questions (εγώ, εσύ, αυτός…) — no
  English gloss, so you're not leaning on the translation to figure out
  what's being asked.
- **Verb meaning is hidden by default** — there's a "Show meaning" button
  if you want the English translation, but it's not given away up front.
- **Hint button** — reveals the stem before you commit to an answer.
- **Retry until correct** — get a form wrong and you'll feel a gentle shake
  and hear a soft buzzer, with the box outlining red; what you typed stays
  exactly where it was (cursor included) so you can amend it rather than
  retype from scratch, and it won't move on until you get it right. Get it
  right the first time and it just quietly advances to the next one — no
  "Correct!" screen in the way. (A question only ever counts as missed once,
  on your first wrong attempt, even if you retry it several times —
  matching how Conjuguemos scores it.)
- **Dark mode** — toggle via the 🌙/☀️ button in the header; your choice is
  remembered.
- At the end: your score, a review list of everything you missed (shown
  split into **stem** and **ending** — the same principal-parts logic the
  conjugation engine itself uses), and a **"Practice missed only"** button
  to immediately redrill just those forms.
- Your filter choices are remembered automatically for next time.

## Extending it

Adding more verbs means adding entries to `verbs.js` in the dataset
project and re-running its export script to regenerate
`verbs_conjugated.json` / `verbs_index.json` — nothing in this app folder
needs to change.

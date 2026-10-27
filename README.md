# Corvus — Ghost in the Machine

> *An intelligence beyond the veil.*

Corvus is a local-first AI workspace for [Ollama](https://ollama.com) and open-weight models such as Gemma. It pairs a haunted-terminal Halloween look with the marigolds and papel picado of Día de los Muertos, and it is built with plain HTML, CSS and JavaScript plus a small Python launcher that has no dependencies.

Chats stream from a model running on your own computer. There are no API keys, no accounts, no analytics and no hosted AI service involved.

Built for Hacktoberfest under the theme **Ghost in the Machine**.

---

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [Using Corvus](#using-corvus)
- [Adding your own media](#adding-your-own-media)
- [Configuration](#configuration)
- [Project structure](#project-structure)
- [Privacy and security](#privacy-and-security)
- [Offline use and PWA install](#offline-use-and-pwa-install)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)

---

## Features

**AI workspace (The Séance)**
- Real streaming chat with Ollama's `/api/chat` endpoint, parsing its newline-delimited JSON as it arrives
- Stop generation, regenerate the last reply, and retry after an error
- Model selector populated from the models you actually have installed
- Editable system prompt
- Safe Markdown rendering (model output is HTML-escaped first), code blocks with a copy button, and a copy button on each reply
- Thinking animation and an elapsed-time counter
- Export a conversation as Markdown or JSON

**Local archive (Memory Vault and The Archive)**
- Sessions save automatically in your browser
- Search by title or message content, rename, reopen, export and delete
- Confirmation before anything destructive

**Runtime tools**
- **Summoning Chamber:** endpoint, connection status, installed models with sizes, connection test, and setup help for missing models
- **Whisper Studio:** prompt experiments with a custom system instruction, temperature and `num_predict`, plus saved outputs shown side by side
- **System Diagnostics:** reachability, model readiness, latency, request count, last generation time and last error. Nothing is faked or estimated.

**Design and accessibility**
- Obsidian, marigold, spectral violet and magenta palette driven by CSS variables
- A slider that moves the look between Halloween and Día de los Muertos
- Papel picado banner, drifting marigold petals, scanlines, restrained animation
- High-contrast mode, adjustable font size, keyboard-visible focus, and full respect for `prefers-reduced-motion`
- Horizontal top navigation plus a collapsible vertical sidebar, which becomes a drawer on mobile

**Media slots**
- Every image and video spot is controlled from one file, `js/assets.js`, and falls back gracefully when empty or broken

---

## How it works

```
┌──────────────┐   HTTP    ┌──────────────────────┐   HTTP    ┌───────────┐
│   Browser    │ ────────▶ │  server/server.py    │ ────────▶ │  Ollama   │
│ index.html   │ ◀──────── │  127.0.0.1:8734      │ ◀──────── │ :11434    │
│ js/app.js    │  stream   │  static files +      │  stream   │ + model   │
└──────────────┘           │  allow-listed proxy  │           └───────────┘
                           └──────────────────────┘
```

1. The browser loads the app from the Python launcher.
2. API calls go to the same origin (`/api/...`), so there are no CORS problems.
3. The launcher forwards only three routes to Ollama and streams the response back line by line.
4. `app.js` reads the stream, appends tokens to the message and re-renders it safely.

**Allowed proxy routes:** `GET /api/tags`, `GET /api/version`, `POST /api/chat`. Everything else returns 404.

---

## Quick start

### Requirements

| Need | Notes |
|------|-------|
| **Python 3.8+** | No packages to install. On Windows, tick "Add Python to PATH". |
| **Ollama** | Download from [ollama.com](https://ollama.com). It runs in the background after install. |
| **A model** | Several GB to download. Gemma 4B suits most laptops with 8 GB RAM or more. |
| **A modern browser** | Chrome, Edge, Firefox or Safari. |

### 1. Get a model

```bash
ollama pull gemma3:4b
```

Check [ollama.com/library](https://ollama.com/library) for current Gemma tags. Corvus never downloads models for you.

### 2. Get Corvus

```bash
git clone https://github.com/<your-username>/corvus.git
cd corvus
```

### 3. Start it

**macOS / Linux**
```bash
./scripts/start.sh
```
If you get "permission denied", run `chmod +x scripts/start.sh` first.

**Windows**

Double-click `scripts\start.bat`, or run it from Command Prompt.

**Any system**
```bash
python3 server/server.py
```

Your browser opens at **http://127.0.0.1:8734**. Keep the terminal window open while you use Corvus.

> Do not open `index.html` by double-clicking it. Browsers block the requests to Ollama from `file://` pages. Always start through the launcher.

---

## Using Corvus

1. Click **Enter the Machine**.
2. Check the status strip. The first badge should read **Ollama: Connected**.
3. Open **Runtime** (the Summoning Chamber) and choose your Gemma model if it isn't already selected.
4. Go to **The Séance** and type a message. Enter sends, Shift+Enter adds a new line. On touch devices, Enter adds a new line and you use the Send button.

The first reply can take up to a minute while the model loads into memory. Later replies are faster.

### Status meanings

| Status | Meaning |
|--------|---------|
| Checking | A connection test is running |
| Connected | Ollama answered a real request |
| Model unavailable | Ollama is reachable but the selected model is not installed |
| Disconnected | Ollama could not be reached |

A "Connected" badge only appears after a successful request.

---

## Adding your own media

Edit `js/assets.js`. Each slot takes a local path or a URL. Leave a slot empty and a placeholder or built-in artwork is used instead.

```javascript
const MEDIA = {
  logo: "",                  // replaces the built-in SVG wordmark
  heroBackground: "",        // image behind the landing hero
  heroVideo: "",             // muted, looping hero video
  sidebarArtwork: "",
  chatBackground: "",
  chatEmpty: "",             // image shown in an empty chat
  loadingAnimation: "",      // small image/gif beside the thinking dots
  featureCards: [],          // up to 6 images, one per feature card
  halloweenGallery: [],      // images or videos (.mp4 / .webm)
  diaDeLosMuertosGallery: [],
  ambientVideos: [],         // [0] plays faintly behind the workspace
  decorativeSVGs: []
};
```

Example:

```javascript
heroBackground: "assets/images/lab.jpg",
heroVideo: "assets/videos/candles.mp4",
halloweenGallery: ["assets/images/raven.jpg", "assets/videos/fog.mp4"],
```

Tips:
- Put files in `assets/images/` and `assets/videos/`.
- Keep videos small. Short, compressed loops (a few MB) work best.
- Videos are muted, loop, and never play audio. They pause when you turn off **Background video** or **Ambient animation** in Settings, or when your system prefers reduced motion.
- Only use media you have the right to use.

---

## Configuration

**Environment variables for the launcher**

| Variable | Default | Purpose |
|----------|---------|---------|
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Where Ollama is running |
| `PORT` | `8734` | Port Corvus listens on (always bound to 127.0.0.1) |

```bash
# macOS / Linux
PORT=8800 OLLAMA_HOST=http://127.0.0.1:11434 python3 server/server.py

# Windows (Command Prompt)
set PORT=8800
python server\server.py
```

**In-app settings** (saved in your browser)
- High contrast, ambient animation, background video, sidebar collapse
- Halloween ↔ Día de los Muertos slider, font size
- Ollama endpoint override. Leave blank to use the launcher's proxy. A direct endpoint such as `http://127.0.0.1:11434` only works if Ollama allows your page's origin (see the `OLLAMA_ORIGINS` setting in Ollama's docs), which is why the proxy is the supported route.
- Export all data and delete all data

**Health check:** `http://127.0.0.1:8734/health` returns a small JSON status from the launcher.

---

## Project structure

```
corvus/
├── index.html          # all pages and views (hash-routed)
├── manifest.json       # PWA manifest
├── sw.js               # service worker (app shell cache only)
├── README.md
├── css/
│   └── style.css       # design tokens, layout, components, responsive rules
├── js/
│   ├── assets.js       # developer-editable media slots
│   └── app.js          # routing, Ollama client, chat, storage, settings, UI
├── server/
│   └── server.py       # loopback static server + allow-listed Ollama proxy
├── scripts/
│   ├── start.sh        # macOS / Linux launcher
│   └── start.bat       # Windows launcher
└── assets/
    ├── icons/icon.svg
    ├── images/         # your images (add a .gitkeep if tracking empty folders)
    ├── videos/         # your videos
    └── fonts/          # optional local fonts
```

---

## Privacy and security

- **Local by default.** Prompts go from your browser to the launcher on your machine, then to your Ollama. Corvus has no analytics and no third-party requests.
- **Loopback only.** The launcher binds to `127.0.0.1` and rejects requests whose `Host` header is not `localhost` or `127.0.0.1`, which protects against DNS rebinding.
- **Small attack surface.** Only three Ollama routes are proxied, JSON bodies are validated, and request size is capped at 5 MB.
- **No content logging.** The launcher's request logging is switched off so conversations do not end up in terminal output.
- **Untrusted model output.** Responses are HTML-escaped before Markdown formatting is applied. Generated code is shown, never executed.
- **Storage honesty.** Conversations are kept in your browser's `localStorage` **unencrypted**. Anyone with access to your browser profile can read them. Clearing browser data erases them, so use Export for backups.
- **No remote fallback.** If a model is missing, Corvus tells you. It never silently switches to another service.

If you set a remote endpoint in Settings, the privacy badge changes to warn you that prompts are leaving your machine.

---

## Offline use and PWA install

Once Ollama, your model and the Corvus files are all on your computer, chatting needs no internet connection.

- The service worker caches the app shell (HTML, CSS, JS, icon) so the interface can load again later.
- It does **not** cache model weights and it does not start Ollama or the launcher. Start the launcher first, even when installed.
- You can install Corvus from your browser's install button. A PWA is a windowed web page, not a native executable.
- Diagnostics shows each layer separately (app assets, Ollama, model, inference), so you can see exactly what is missing.

If you later want a native desktop build, the plain structure makes it straightforward to wrap with Tauri or Electron. Neither is included.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `python is not recognized` | Reinstall Python and tick "Add Python to PATH", or use `python3`. |
| Blank page or no model replies from a `file://` address | Start with the launcher and use `http://127.0.0.1:8734`. |
| **Ollama: Disconnected** | Start Ollama, then go to Runtime and click **Test connection**. Check `OLLAMA_HOST` if you changed it. |
| **Model unavailable** | Run `ollama pull gemma3:4b`, then click **Refresh models**. |
| First reply is very slow | The model is loading into memory. Try a smaller model if it stays slow. |
| Crashes or extreme slowness | The model is too large for your RAM. Try `gemma3:1b` or `gemma3:4b`. |
| Port already in use | Set `PORT` to another number and open that address. |
| Direct endpoint fails with a network error | Use the launcher proxy, or configure `OLLAMA_ORIGINS` for Ollama. |
| Conversations disappeared | Browser data was cleared. Export regularly. |

When reporting a bug, include your OS, browser, Ollama version, model name and any red text from the browser console (F12).

---

## Known limitations

- Needs enough RAM or VRAM for the model you choose. Gemma sizes vary widely.
- Direct browser-to-Ollama requests depend on browser and Ollama settings. The launcher proxy exists for this reason.
- Open-weight is not the same as fully open source. Each model has its own licence, usage terms and limits, so read the model's terms before commercial use. Corvus makes no claim about a model's training data or rights.
- Chat history uses `localStorage`, which has size limits and is not encrypted.
- No attachment or file upload support yet.
- Markdown support is deliberately small: headings, bold, italics, inline code, bullet lists and fenced code blocks. Code is not syntax-colored yet.
- Tested manually; there is no automated test suite yet.

---

## Roadmap

- Move the archive to IndexedDB
- Syntax highlighting for code blocks
- Editable and persistent generation presets
- Attachments, if they can be processed locally and honestly
- Optional filesystem-backed archive through the launcher
- Automated tests for the stream parser and proxy
- Packaged desktop builds

---

## Contributing

Contributions are welcome, especially during Hacktoberfest.

1. Fork the repository and create a branch: `git checkout -b feature/your-idea`
2. Keep the project framework-free. Plain HTML, CSS, JavaScript and the standard-library Python launcher are intentional.
3. Run the app and test your change against a real local model when you can.
4. Check the browser console for errors before opening a pull request.
5. Open a pull request describing what changed and how you tested it.

Good first contributions: new decorative SVGs, accessibility improvements, translations, syntax highlighting, better mobile polish, and tests.

Guidelines:
- Never add features that send user data to remote services by default.
- Keep status indicators honest. A feature should only be shown as working when it is.
- Treat Día de los Muertos imagery with respect as a tradition of remembrance.

---

## Acknowledgements

- [Ollama](https://ollama.com) for making local model serving simple
- Google's Gemma open-weight models
- The traditions of Halloween and Día de los Muertos, which inspired the visual language
- The Hacktoberfest community and its **Ghost in the Machine** theme

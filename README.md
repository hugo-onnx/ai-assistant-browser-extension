# watsonx Orchestrate – Chrome Extension

A Google Chrome extension that lets you chat with **IBM watsonx Orchestrate** from your browser sidebar. It connects through a lightweight FastAPI proxy server that handles authentication and streaming.

![Chrome Side Panel](https://img.shields.io/badge/Chrome-Side%20Panel%20API-4285F4?logo=googlechrome&logoColor=white)
![IBM watsonx](https://img.shields.io/badge/IBM-watsonx%20Orchestrate-0F62FE?logo=ibm&logoColor=white)
![Carbon Design](https://img.shields.io/badge/IBM-Carbon%20Design%20System-161616?logo=ibm&logoColor=white)

---

## Architecture

```
┌──────────────────────────────────────────────┐
│            Chrome Extension (Side Panel)     │
│                                              │
│  React + Vite + Tailwind CSS v4              │
│  IBM Carbon Design System (g100 theme)       │
│                                              │
│  Components:                                 │
│   ├── Header (UI Shell)                      │
│   ├── WelcomeScreen (Clickable Tiles)        │
│   ├── ChatMessage (User/AI bubbles)          │
│   └── ChatInput (Text input + Send button)   │
│                                              │
│  Hooks:                                      │
│   └── useChat (SSE streaming, state mgmt)    │
└──────────────────┬───────────────────────────┘
                   │ POST /chat/stream (SSE)
                   ▼
┌──────────────────────────────────────────────┐
│            FastAPI Proxy Server              │
│                                              │
│  Endpoints:                                  │
│   ├── POST /chat/stream (SSE)                │
│   ├── GET  /health                           │
│   └── GET  /docs (Swagger)                   │
│                                              │
│  Features:                                   │
│   ├── IAM token caching & auto-refresh       │
│   ├── SSE stream parsing & forwarding        │
│   ├── Async flow detection & polling         │
│   └── Thread message polling (up to 10 min)  │
└──────────────────┬───────────────────────────┘
                   │ POST /v1/orchestrate/runs?stream=true
                   │ GET  /v1/orchestrate/threads/{id}/messages
                   ▼
┌──────────────────────────────────────────────┐
│       IBM watsonx Orchestrate API            │
│       (eu-de / us-south / etc.)              │
└──────────────────────────────────────────────┘
```

---

## Features

### Chat
- **Real-time streaming** — Token-by-token display via Server-Sent Events (SSE)
- **Markdown rendering** — Tables, code blocks with syntax highlighting, lists, blockquotes
- **Thread persistence** — Conversations are saved to `chrome.storage.local`
- **Conversation management** — Start new conversations, auto-scroll

### Async Flow Support
- **Flow detection** — Automatically detects when watsonx triggers a long-running flow
- **Background polling** — Polls the thread messages API every 8 seconds for up to 10 minutes
- **Status indicators** — Pulsing dot with elapsed time during flow processing
- **Result delivery** — Flow results appear as a new message bubble when complete

### Design
- **IBM Carbon Design System** — g100 (dark) and g10 (light) themes with official color tokens
- **Dark/light toggle** — Switch themes from the header; preference persists across sessions
- **IBM Plex fonts** — IBM Plex Sans and IBM Plex Mono
- **Carbon patterns** — UI Shell header, DataTable, clickable tiles, inline notifications, form inputs, icon buttons
- **Connection status** — Live indicator dot in the header showing proxy availability
- **Responsive** — Works in Chrome's side panel (narrow) and standalone (dev mode)

---

## Project Structure

```
wxo-extension/                    # Chrome Extension (Frontend)
├── sidepanel.html                # Side panel entry point
├── options.html                  # Settings page entry point
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── vite.config.js                # Vite build config (multi-page)
├── public/
│   ├── manifest.json             # Chrome Extension Manifest V3
│   ├── background.js             # Service worker (side panel behavior)
│   └── icons/                    # Extension icons (16, 48, 128px)
└── src/
    ├── types.ts                  # Shared TypeScript interfaces
    ├── vite-env.d.ts             # Vite type declarations
    ├── index.css                 # Carbon g100/g10 theme tokens + markdown styles
    ├── sidepanel.tsx             # React mount for side panel
    ├── options.tsx               # Settings page (proxy URL config)
    ├── components/
    │   ├── App.tsx               # Main layout (header + chat + input)
    │   ├── Header.tsx            # Carbon UI Shell header bar + theme toggle
    │   ├── ChatMessage.tsx       # User/AI bubbles, copy, retry, timestamps
    │   ├── ChatInput.tsx         # Text input + send/stop button
    │   └── WelcomeScreen.tsx     # Landing screen with suggestion tiles
    ├── hooks/
    │   ├── useChat.ts            # Chat state, SSE streaming, flow events
    │   ├── useConnectionStatus.ts # Proxy health polling
    │   └── useTheme.ts           # Dark/light theme toggle (g100/g10)
    └── utils/
        ├── markdown.ts           # Marked + highlight.js renderer
        └── storage.ts            # chrome.storage abstraction

proxy-server/                     # FastAPI Proxy Server (Backend)
├── pyproject.toml                # Project metadata & dependencies
├── uv.lock                       # Locked dependency versions
├── .env                          # Environment variables (create this)
└── app/
    ├── __init__.py
    ├── main.py                   # FastAPI app, CORS, lifespan
    ├── config.py                 # Pydantic settings from .env
    ├── auth.py                   # IAM token manager (cache + refresh)
    ├── models.py                 # Request/response Pydantic models
    └── routes/
        ├── __init__.py
        └── chat.py               # /chat/stream endpoint + flow polling
```

---

## Setup

### Prerequisites

- **Node.js** ≥ 18
- **[uv](https://github.com/astral-sh/uv)** ≥ 0.5 (Python package manager)
- **Python** ≥ 3.11 (managed by uv)
- **Google Chrome** ≥ 116 (Side Panel API support)
- **IBM Cloud** account with watsonx Orchestrate instance

### 1. Proxy Server

```bash
cd proxy-server

# Install dependencies with uv
uv sync

# Configure environment
cp .env.example .env        # then edit with your values
```

Create a `.env` file with your IBM credentials:

```env
IBM_API_KEY=your-ibm-cloud-api-key
WXO_API_ENDPOINT=https://api.eu-de.watson-orchestrate.cloud.ibm.com/instances/your-instance-id
WXO_AGENT_ID=your-agent-id
```

| Variable | Description |
|---|---|
| `IBM_API_KEY` | IBM Cloud IAM API key with access to your watsonx instance |
| `WXO_API_ENDPOINT` | Full base URL of your watsonx Orchestrate instance (including `/instances/{id}`) |
| `WXO_AGENT_ID` | The agent/assistant ID to chat with |
| `ALLOWED_ORIGINS` | CORS origins (default: `*`). Set to `chrome-extension://your-extension-id` for production |

Start the server:

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running:

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"wxo-proxy"}
```

API docs available at: http://localhost:8000/docs

### 2. Chrome Extension

```bash
cd wxo-extension

# Install dependencies
npm install

# Development mode (hot reload)
npm run dev
# → Open http://localhost:5173/sidepanel.html in browser

# Production build
npm run build
# → Output in dist/
```

#### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `wxo-extension/dist/` folder
5. Click the extension icon in Chrome toolbar → side panel opens

#### Configure Proxy URL

1. Right-click the extension icon → **Options**
2. Set the proxy URL (default: `http://localhost:8000`)
3. Click **Save**

---

## API Reference

### Proxy Endpoints

#### `POST /chat/stream`

Sends a message to watsonx Orchestrate and returns a streaming SSE response.

**Request:**
```json
{
  "message": "What can you help me with?",
  "thread_id": null
}
```

**SSE Events:**

| Event | Fields | Description |
|---|---|---|
| `start` | `thread_id`, `run_id` | Stream has started |
| `delta` | `text` | Incremental text chunk |
| `status` | `message` | Agent processing status (e.g., "Thinking…") |
| `flow_status` | `message` | Flow polling status (e.g., "Still processing… (120s)") |
| `new_message` | — | Separator before a new message bubble (flow results) |
| `done` | `thread_id` | Stream complete |
| `error` | `message` | Error occurred |

**Example SSE stream:**
```
data: {"event": "start", "thread_id": "abc-123", "run_id": "def-456"}
data: {"event": "delta", "text": "Here are the "}
data: {"event": "delta", "text": "results you requested."}
data: {"event": "done", "thread_id": "abc-123"}
```

#### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "wxo-proxy"
}
```

---

## How It Works

### Normal Messages

1. User types a message in the side panel
2. Extension sends `POST /chat/stream` to the proxy
3. Proxy authenticates with IBM IAM (tokens are cached for ~1 hour)
4. Proxy forwards the message to `POST /v1/orchestrate/runs?stream=true`
5. watsonx returns an NDJSON stream with events: `run.started`, `message.delta`, `run.completed`, `done`
6. Proxy parses events and re-emits simplified SSE to the extension
7. Extension renders text token-by-token with a typing cursor

### Async Flows

Some watsonx operations (e.g., create data export jobs) trigger long-running background flows:

1. watsonx immediately returns a "A new flow has started…" message, then closes the stream
2. Proxy detects the flow indicator text
3. Proxy begins polling `GET /v1/orchestrate/threads/{thread_id}/messages` every 8 seconds
4. Extension shows a pulsing "Processing flow…" indicator
5. When a new assistant message appears on the thread (up to 10 minutes), the proxy emits it as a `new_message` + `delta` event
6. Extension displays the result in a new message bubble

### IAM Token Management

The proxy caches IAM tokens and refreshes them 5 minutes before expiry:

```
POST https://iam.cloud.ibm.com/identity/token
  grant_type=urn:ibm:params:oauth:grant-type:apikey
  &apikey={IBM_API_KEY}
```

Tokens are valid for ~1 hour. The proxy handles refresh transparently.

---

## Tech Stack

### Frontend (Chrome Extension)

| Technology | Version | Purpose |
|---|---|---|
| TypeScript | 5.7 | Type-safe development |
| React | 19 | UI framework |
| Vite | 6 | Build tool with HMR |
| Tailwind CSS | 4 | Utility-first CSS |
| IBM Carbon Design | g100/g10 | Dark & light theme tokens, typography, spacing |
| IBM Plex Sans/Mono | — | Official IBM typeface |
| Marked | 15 | Markdown to HTML |
| highlight.js | 11 | Code syntax highlighting |

### Backend (Proxy Server)

| Technology | Version | Purpose |
|---|---|---|
| Python | ≥ 3.11 | Runtime |
| FastAPI | ≥ 0.115 | Web framework |
| httpx | ≥ 0.28 | Async HTTP client |
| uvicorn | ≥ 0.32 | ASGI server |
| pydantic-settings | ≥ 2.7 | Environment config |
| sse-starlette | ≥ 2.2 | SSE response support |

---

## Development

### Extension Dev Mode

```bash
cd wxo-extension
npm run dev
```

Open `http://localhost:5173/sidepanel.html` — changes hot-reload instantly. Note: `chrome.storage` APIs are not available in dev mode; the extension falls back to localStorage.

To run type checking separately:

```bash
npm run typecheck
```

### Proxy Dev Mode

```bash
cd proxy-server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables auto-restart on file changes. API docs at `http://localhost:8000/docs`.

### Building for Production

```bash
cd wxo-extension
npm run build
```

The `dist/` folder contains the production Chrome extension. Load it as an unpacked extension or package it as a `.crx` file.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Blank side panel | Check browser console (F12). Ensure proxy is running |
| "Proxy error: 401" | IAM token expired or invalid `IBM_API_KEY` — check `.env` |
| "Proxy error: 404" | Verify `WXO_API_ENDPOINT` includes the full instance path |
| "Proxy error: 422" | Check `WXO_AGENT_ID` is correct |
| Extension not loading | Ensure you loaded the `dist/` folder, not the source root |
| Fonts not loading | Extension needs internet access for Google Fonts CDN |
| Flow result never appears | Flow may take >10 min. Check proxy logs for polling status |

---

## License

MIT
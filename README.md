# AI Assistant – Chrome Extension

A Google Chrome extension that lets you chat with an AI directly from your browser sidebar. It connects through a lightweight FastAPI proxy server that handles streaming, powered by **Groq** or **Cerebras** for fast inference.

![Chrome Side Panel](https://img.shields.io/badge/Chrome-Side%20Panel%20API-4285F4?logo=googlechrome&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLM%20Inference-000000?logoColor=white)
![Cerebras](https://img.shields.io/badge/Cerebras-LLM%20Inference-F55036?logoColor=white)

---

## Architecture

```
┌──────────────────────────────────────────────┐
│            Chrome Extension (Side Panel)     │
│                                              │
│  React + Vite + Tailwind CSS v4              │
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
                   │ POST /chat/stream
                   │ { messages: [...], provider: "groq" | "cerebras" }
                   ▼
┌──────────────────────────────────────────────┐
│            FastAPI Proxy Server              │
│                                              │
│  Endpoints:                                  │
│   ├── POST /chat/stream (SSE)                │
│   └── GET  /health                           │
│                                              │
│  Features:                                   │
│   ├── Provider routing (Groq / Cerebras)     │
│   ├── SSE stream parsing & forwarding        │
│   └── Conversation history forwarded         │
└──────────────────┬───────────────────────────┘
                   │ POST /openai/v1/chat/completions
                   │ Authorization: Bearer {API_KEY}
                   ▼
┌──────────────────────────────────────────────┐
│         Groq API  ·  Cerebras API            │
└──────────────────────────────────────────────┘
```

**Key design principle:** Conversation history is owned entirely by the extension. Every request sends the full `messages` array — there is no server-side session or thread concept.

---

## Features

### Chat
- **Real-time streaming** — Token-by-token display via Server-Sent Events (SSE)
- **Conversation history** — Full context sent with every request
- **Markdown rendering** — Tables, code blocks with syntax highlighting, lists, blockquotes
- **Message persistence** — Conversations saved to `chrome.storage.local`
- **Copy & retry** — Copy any message or regenerate the last response

### Inference Providers
- **Groq** — Fast inference via Groq Cloud; supports `llama-3.1-8b-instant` and other Groq-hosted models
- **Cerebras** — Ultra-fast inference via Cerebras Cloud; supports `llama3.1-8b`, and other Cerebras-hosted models
- **Provider selection** — Switch between Groq and Cerebras from the extension's Settings page; the selected provider is sent with every request

### Design
- **Dark/light toggle** — Switch themes from the header; preference persists across sessions
- **Connection status** — Live indicator dot showing proxy availability

### Security
- **DOMPurify** — All markdown output sanitized before rendering (XSS protection)
- **Input validation** — Message roles and content length validated server-side
- **Generic error messages** — Internal API errors logged server-side only, never exposed to the client
- **Restricted CORS** — Credentials disabled; only `Content-Type` header allowed

---

## Project Structure

```
ai-assistant-browser-extension/
├── sidepanel.html                # Side panel entry point
├── options.html                  # Settings page entry point
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── vite.config.js                # Vite build config (multi-page)
├── public/
│   ├── manifest.json             # Chrome Extension Manifest V3
│   ├── background.js             # Service worker (side panel behavior)
│   └── icons/                    # Extension icons
└── src/
    ├── types.ts                  # Shared TypeScript interfaces
    ├── index.css                 # Carbon g100/g10 theme tokens + markdown styles
    ├── sidepanel.tsx             # React mount for side panel
    ├── options.tsx               # Settings page (proxy URL + provider)
    ├── components/
    │   ├── App.tsx               # Main layout (header + chat + input)
    │   ├── Header.tsx            # Carbon UI Shell header bar + theme toggle
    │   ├── ChatMessage.tsx       # User/AI bubbles, copy, retry, timestamps
    │   ├── ChatInput.tsx         # Text input + send/stop button
    │   └── WelcomeScreen.tsx     # Landing screen with suggestion tiles
    ├── hooks/
    │   ├── useChat.ts            # Chat state, SSE streaming, provider selection
    │   ├── useConnectionStatus.ts # Proxy health polling
    │   └── useTheme.ts           # Dark/light theme toggle (g100/g10)
    └── utils/
        ├── markdown.ts           # Marked + highlight.js + DOMPurify renderer
        └── storage.ts            # chrome.storage abstraction

proxy-server/                     # FastAPI Proxy Server (Backend)
├── pyproject.toml                # Project metadata & dependencies
├── uv.lock                       # Locked dependency versions
├── Dockerfile                    # Container image
├── .dockerignore                 # Files excluded from image
├── .env                          # Environment variables (never commit this)
├── .env.example                  # Example configuration
└── app/
    ├── main.py                   # FastAPI app, CORS, lifespan
    ├── config.py                 # Pydantic settings from .env
    ├── models.py                 # Request/response Pydantic models
    └── routes/
        └── chat.py               # /chat/stream endpoint (Groq + Cerebras)
```

---

## Setup

### Prerequisites

- **Node.js** ≥ 18
- **[uv](https://github.com/astral-sh/uv)** ≥ 0.5 (Python package manager)
- **Python** ≥ 3.11 (managed by uv)
- **Google Chrome** ≥ 116 (Side Panel API support)
- **API key** for your chosen provider:
  - Groq — free at [console.groq.com](https://console.groq.com)
  - Cerebras — free at [cloud.cerebras.ai](https://cloud.cerebras.ai)

### 1. Proxy Server

```bash
cd proxy-server

# Install dependencies
uv sync

# Configure environment
cp .env.example .env   # then fill in your values
```

Edit `.env`:

```env
# Provider selection: "groq" or "cerebras"
PROVIDER=groq

# Groq (used when PROVIDER=groq)
GROQ_API_KEY=gsk_your-groq-api-key
GROQ_MODEL=llama-3.1-8b-instant

# Cerebras (used when PROVIDER=cerebras)
CEREBRAS_API_KEY=csk_your-cerebras-api-key
CEREBRAS_MODEL=llama3.1-8b

# Optional — sampling parameters
TEMPERATURE=1.0
TOP_P=1.0
MAX_COMPLETION_TOKENS=8192

ALLOWED_ORIGINS=*
```

| Variable | Default | Description |
|---|---|---|
| `PROVIDER` | `groq` | Inference provider: `groq` or `cerebras` |
| `GROQ_API_KEY` | — | Groq API key (required when using Groq) |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Groq model ID |
| `CEREBRAS_API_KEY` | — | Cerebras API key (required when using Cerebras) |
| `CEREBRAS_MODEL` | `llama3.1-8b` | Cerebras model ID |
| `TEMPERATURE` | `1.0` | Sampling temperature (0.0–2.0) |
| `TOP_P` | `1.0` | Nucleus sampling threshold (0.0–1.0) |
| `MAX_COMPLETION_TOKENS` | `8192` | Max tokens in the response |
| `ALLOWED_ORIGINS` | `*` | CORS origins. Set to your extension origin in production |

Start the server:

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running:

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"ai-assistant-proxy"}
```

Test streaming:

```bash
curl -N -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"provider":"groq"}'
```

### 2. Chrome Extension

```bash
# Install dependencies
npm install

# Production build
npm run build
# → Output in dist/
```

#### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Click the extension icon in the Chrome toolbar → side panel opens

#### Configure Settings

1. Right-click the extension icon → **Options**
2. Select your **inference provider** (Groq or Cerebras)
3. Set the **proxy URL** (default: `http://localhost:8000`)
4. Click **Save**

The selected provider is stored in `chrome.storage.sync` and sent with every chat request, overriding the server's `PROVIDER` default.

---

## API Reference

### `POST /chat/stream`

Sends the conversation history to the selected provider and returns a streaming SSE response.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" },
    { "role": "assistant", "content": "Hi, how can I help?" },
    { "role": "user", "content": "What is the capital of France?" }
  ],
  "provider": "groq"
}
```

The `provider` field is optional. When omitted, the server falls back to the `PROVIDER` value in `.env`.

**SSE Events:**

| Event | Fields | Description |
|---|---|---|
| `start` | — | Stream has started |
| `delta` | `text` | Incremental text chunk |
| `done` | — | Stream complete |
| `error` | `message` | Error occurred |

**Example stream:**
```
data: {"event": "start"}
data: {"event": "delta", "text": "The capital"}
data: {"event": "delta", "text": " of France is Paris."}
data: {"event": "done"}
```

### `GET /health`

```json
{ "status": "ok", "service": "ai-assistant-proxy" }
```

---

## How It Works

1. User types a message in the side panel
2. Extension appends it to the local message history and sends the full `messages` array plus the selected `provider` to `POST /chat/stream`
3. Proxy routes the request to the appropriate API (Groq or Cerebras) using the matching API key and model
4. The provider streams back tokens using the OpenAI-compatible SSE format
5. Proxy parses each chunk and re-emits simplified `delta` events to the extension
6. Extension renders text token-by-token with a typing cursor
7. On completion, the full conversation (including the new assistant reply) is saved to `chrome.storage.local`

---

## Tech Stack

### Frontend (Chrome Extension)

| Technology | Version | Purpose |
|---|---|---|
| TypeScript | 5.7 | Type-safe development |
| React | 19 | UI framework |
| Vite | 6 | Build tool |
| Tailwind CSS | 4 | Utility-first CSS |
| Marked | 15 | Markdown to HTML |
| highlight.js | 11 | Code syntax highlighting |
| DOMPurify | 3 | XSS sanitization |

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
npm run dev
```

Open `http://localhost:5173/sidepanel.html` — changes hot-reload instantly. Note: `chrome.storage` APIs are not available in dev mode.

### Proxy Dev Mode

```bash
cd proxy-server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables auto-restart on file changes. Swagger docs available at `http://localhost:8000/docs`.

### Docker

```bash
cd proxy-server
docker build -t ai-assistant-proxy .
docker run -p 8000:8000 --env-file .env ai-assistant-proxy
```

Or with Podman:

```bash
podman build -t ai-assistant-proxy .
podman run -p 8000:8000 --env-file .env ai-assistant-proxy
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Blank side panel | Check browser console (F12). Ensure proxy is running at the configured URL |
| Red connection dot | Proxy is not reachable — start it with `uv run uvicorn app.main:app` |
| `Failed to get a response` | Check your API key in `.env` is valid and has quota |
| `422 Unprocessable Entity` | Request validation failed, check message format |
| Extension not loading | Ensure you loaded the `dist/` folder, not the source root |
| Fonts not loading | Extension needs internet access for fonts CDN |

---

## License

MIT

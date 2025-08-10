# The Hungry Unicorn – Restaurant Booking System Overview

A full-stack demo that lets guests chat with an AI assistant to:
```
1. check availability, 
2. make a booking, 
3. view, update, cancel a booking, 
and generally talk in natural language. 
It wraps a mock restaurant booking API with a FastAPI + LangChain agent and a clean React/TypeScript UI.
```

**Highlights** 
```
- Two ways to book: natural-language chat or a one-tap action bar with buttons for Check Availability, Book a Table, View / Edit / Cancel. For users who prefer clicks over typing.

- Smart date & time understanding: handles phrases like this weekend, next Friday, 7pm, 19:30, plus party sizes like for two.

- Clickable time chips: when availability is shown, times appear as chips you can tap to prefill a booking instantly.

- Error-aware API calls: inputs are validated/normalized before hitting the API. Friendly messages on failure.

Modular architecture: FastAPI services, LangChain tools, and React flows separated for maintainability
```


## Modular architecture with services, tools, and UI flows separated.
```
/app                         # Backend (FastAPI + LangChain agent)
  ├─ main.py                 # FastAPI app
  ├─ routers/chat.py         # /api/chat endpoint (agent entry point)
  ├─ core    
  │   ├─ config.py               
  ├─ agents/
  │   ├─ agent.py            # get_agent(): builds the agent
  │   └─ tools.py            # LangChain tools (check, create, get, update, cancel)
  ├─ services/
  │   └─ restaurant_api.py   # Thin wrappers over the mock booking API
  └─ utils/
      ├─ dates.py            # resolve_dates(): “this weekend”, “next Friday”, etc.
      ├─ nlp.py              # parse_input(), party-size extraction helpers
      └─ formatting.py       # pretty_time(), pretty_date()

/client (React + TS)
  ├─ components/
  │   ├─ ChatWindow.tsx
  │   ├─ MessageList.tsx, MessageBubble.tsx, ChatInput.tsx
  │   ├─ OptionButtons.tsx
  │   ├─ AvailabilityPicker.tsx, DateTimePartyPicker.tsx
  │   ├─ CustomerForm.tsx, ReferenceForm.tsx
  │   └─ flows/
  │        ├─ AvailabilityFlow.tsx
  │        ├─ CreateFlow.tsx
  │        └─ UpdateFlow.tsx
  ├─ hooks/useChatAgent.ts   # Handles send(), mode changes, chip logic
  └─ utils/time.ts           # humanTime(), extractTimes(), etc.
Agent tools (LangChain): 
    - Check Availability
    - Create Booking
    - Get Booking
    - Update Booking
    - Cancel Booking
```
Each tool calls the service layer and returns user-friendly text.

# Setup & Run
    - Backend
    ```
1. **cd app**
2. **python -m venv .venv**
3. **.venv/Scripts/activate**  for Windows
    **or source .venv/bin/activate** on macOS/Linux
4. **pip install -r requirements.txt**
5. **Create app/.env:**
    **Mock API base** 
    **API_BASE_URL=http://localhost:8547**
    Bearer token used to call the booking endpoints from tools
    **BACKEND_BEARER_TOKEN=MOCK_API_TOKEN**
    **LLM key** (for LangChain ChatOpenAI - used gpt 3-5)
    **OPENAI_API_KEY= OPEN_AI_REAL_KEY_ADDED_HERE**
6. Run:
**python -m app**
```

FastAPI on http://0.0.0.0:8547
```
    - Frontend
1. **cd client**
2. **npm install**
**echo "REACT_APP_API_TOKEN=MOCK_API_TOKEN" > .env** (same token as BACKEND_BEARER_TOKEN)

3, **npm start**

React dev server, http://localhost:3000


## How it works
```
**Natural-language normalization**
On the backend:
```Dates via utils/dates.resolve_dates(), supports “this weekend” (upcoming Sat/Sun), “next Friday”, “this Sunday”, as well as explicit dates using dateparser. Timezone defaults to Europe/London but can be changed.
```

```Times via normalize_time(), accepts 7pm, 7:30 pm, 19, 19:30, normalizes to HH:MM:SS.
```

```Party size via normalize_party_size(), supports “for 4”, “party of 6”, “two people”.
```

```Agent design - 
Tool-first: the agent decides which tool to invoke and passes a simple key: value string (or natural language).
```

```Validation before API: tools sanitize/normalize inputs to avoid 422 errors.
```

```Helpful responses: tools craft human messages (“That exact time isn’t available. On Friday we have 7:00, 7:30… Which time would you like?”).
```

## Button Options Flows:
```
Availability: pick date + party > see times as chips.

Create: pick date/time/party > fill name > agent confirms.

Update: provide reference, pick new date/time/party > agent confirms.

Cancel: provide reference > agent confirms.
```

## Environment Variables 

**Backend** (app/.env)

```API_BASE_URL – default http://localhost:8547

BACKEND_BEARER_TOKEN – token to call booking endpoints

OPENAI_API_KEY – LLM key for LangChain
```

**Frontend** (client/.env)

```REACT_APP_API_TOKEN – token sent as Authorization: Bearer ... to /api/chat
```

## Key API Routes
```POST /api/chat/ – single entry point used by the UI. The agent returns { reply: string }.

The tools call internal booking endpoints like:

POST /api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/AvailabilitySearch

POST /api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/BookingWithStripeToken

GET /api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/Booking/{ref}

PATCH /api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/Booking/{ref}

POST /api/ConsumerApi/v1/Restaurant/TheHungryUnicorn/Booking/{ref}/Cancel
```

## Troubleshooting
**422 Unprocessable Entity**
```Usually means the tool sent unnormalized fields. The normalization layer fixes most cases; if you typed very ambiguous NL (e.g., “move it later”), the agent may not extract a time. Try “change to 8pm”.
```

**No availability chips**
```Chips appear only when the reply contains recognizable times with the buttons options. 
Use the Availability button and date picker.
```

## Why LangChain
```LangChain gives us a battle-tested “agent + tools” pattern out of the box 
(Conversational-React agent used) let us wire domain tools (check availability, create/update/cancel booking) with minimal glue and focus on business logic—validation, date/time normalization, and UX.
```

```Its ConversationBufferMemory covers multi-turn context without us hand-rolling a memory layer. 
This is crucial when users switch from “check weekend” to “book the 7:30 slot” to “actually make it 8 pm”.
```

```LangChain is model-agnostic. Can point the same agent at OpenAI today, Ollama/VLLM tomorrow, 
or add a fallback LLM with a few lines. Tools are plain Python functions, so nothing is framework-locked.
```

```Get structured tool descriptions, easy tracing/logging, timeouts, and retries. 
That’s helpful for production readiness (observability and failure handling) without introducing more dependencies.
```

```If outgrow the simple agent, moving to LangGraph is a low-friction path to stricter control flows 
(e.g., “always check availability > collect customer > then book” with guards and explicit loops).
```

## Limitations & potential improvements
**Product features**

```Opening hours / holiday calendar: prevent invalid times at the source.
Email/SMS confirmations and reminders.
Persistent user profile (name/phone remembered across sessions).
```
**NLP/Reasoning**

```Disambiguation turns: “Did you mean 7:00 PM or 7:30 PM?”
Richer date language (e.g., “in two weeks”, “around 8pm” > 7:30PM / 8:00PM / 8:30PM choices).
```

**Backend**

```Introduce a provider-agnostic LLM layer with automatic fallback 
(e.g., primary OpenAI, secondary Ollama/vLLM) plus retries/backoff. 
If the primary API is rate-limited or down, the assistant switches to the backup to avoid 
outages and keep the chat responsive.
Wire basic request tracing or structured logging such as requiring more information from the customer during a booking.
```

**Frontend**

```Persistent session + transcript export.
Toasts/spinners during async tool calls.
Dark mode / more themes.
```

**Security**
```Enforce HTTPS end-to-end, set strict CORS to the deployed frontend origin(s) only.
Rate limiting & abuse protection # add per-IP/user rate limits on chat and booking endpoints.
Idempotent booking writes, replay protection, and audit logging for “create/update/cancel.”


```

## How this would scale in production
``` The FastAPI layer is stateless, session/memory is agent-side only and can be swapped for a persistent store (Redis/Postgres) to survive restarts and allow multiple replicas behind a load balancer.

Cache AvailabilitySearch per VisitDate+PartySize for short TTL to shed load during peaks.

Add idempotency keys to booking requests to prevent double-charges/double-bookings on retries.

If downstream booking becomes slow, enqueue “book” jobs and notify the user asynchronously when confirmed.

Structured logs (request IDs), metrics (success/error latency per tool), and traces around tool calls.

Alerting on elevated 5xx, tool timeouts, or LLM failure rates.

Add an LLM fallback chain (primary + secondary vendor + local model) with short timeouts.

Pin model versions and keep tool descriptors strict to avoid drift.
```

## Security considerations
```Tokens are loaded from environment (.env locally, secret manager in prod). Never committed.

Backend verifies Bearer tokens, rejects missing/invalid headers.

Normalized and validate VisitDate/VisitTime/PartySize server-side before hitting downstream APIs, reject invalid ranges and past dates.

Use Pydantic/FastAPI validation and structured error responses.

Only collect minimal customer fields required to book.
```

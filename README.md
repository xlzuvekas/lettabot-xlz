# LettaBot 👾

Your personal AI assistant that remembers everything across **Telegram, Slack, WhatsApp, and Signal**. Powered by [Letta Code](https://github.com/letta-ai/letta-code).

<img width="750" alt="lettabot-preview" src="https://github.com/user-attachments/assets/9f01b845-d5b0-447b-927d-ae15f9ec7511" />

## Features

- **Multi-Channel** - Chat seamlessly across Telegram, Slack, WhatsApp, and Signal
- **Unified Memory** - Single agent remembers everything from all channels
- **Persistent Memory** - Agent remembers conversations across sessions (days/weeks/months)
- **Local Tool Execution** - Agent can read files, search code, run commands on your machine
- **Heartbeat** - Periodic check-ins where the agent reviews tasks
- **Cron Jobs** - Agent can create its own scheduled tasks
- **Streaming Responses** - Real-time message updates as the agent thinks

## Quick Start

### Prerequisites

- Node.js 18+
- A Letta API key from [app.letta.com](https://app.letta.com)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

### Install from Source

```bash
# Clone the repository
git clone https://github.com/letta-ai/lettabot.git
cd lettabot

# Install dependencies
npm install

# Build
npm run build

# Link the CLI globally (optional)
npm link
```

### Onboard

Run the interactive onboarding wizard:

```bash
lettabot onboard
```

This will guide you through:
1. Setting up your Letta API key
2. Configuring Telegram (and optionally Slack)
3. Enabling heartbeat and cron jobs
4. Installing skills

### Run the Server

```bash
lettabot server
```

Or in development mode (auto-reload):

```bash
npm run dev
```

That's it! Message your bot on Telegram.

## CLI Commands

| Command | Description |
|---------|-------------|
| `lettabot onboard` | Interactive setup wizard |
| `lettabot server` | Start the bot server |
| `lettabot configure` | View and edit configuration |
| `lettabot skills` | Configure which skills are enabled |
| `lettabot skills status` | Show skills status |
| `lettabot help` | Show help |

## Multi-Channel Architecture

LettaBot uses a **single agent with a single conversation** across all channels:

```
Telegram ──┐
           ├──→ ONE AGENT ──→ ONE CONVERSATION
Slack ─────┤    (memory)      (chat history)
WhatsApp ──┘
```

- Start a conversation on Telegram
- Continue it on Slack
- Pick it up on WhatsApp
- The agent remembers everything!

## Channel Setup

| Channel | Guide | Requirements |
|---------|-------|--------------|
| Telegram | [Setup Guide](docs/getting-started.md) | Bot token from @BotFather |
| Slack | [Setup Guide](docs/slack-setup.md) | Slack app with Socket Mode |
| WhatsApp | [Setup Guide](docs/whatsapp-setup.md) | Phone with WhatsApp |
| Signal | [Setup Guide](docs/signal-setup.md) | signal-cli + phone number |

At least one channel is required. Telegram is the easiest to start with.

## Configuration

### Basic (.env)

```bash
# Required: Letta API Key
LETTA_API_KEY=your_letta_api_key

# Telegram (easiest to start)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Slack (optional)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token

# WhatsApp (optional)
WHATSAPP_ENABLED=true

# Signal (optional)
SIGNAL_PHONE_NUMBER=+1XXXXXXXXXX

# Cron jobs (optional)
CRON_ENABLED=true

# Heartbeat - periodic check-ins (optional)
HEARTBEAT_INTERVAL_MIN=30
# HEARTBEAT_TARGET=telegram:123456789  # defaults to last messaged
```

### Full Configuration Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `LETTA_API_KEY` | Yes | API key from app.letta.com |
| `TELEGRAM_BOT_TOKEN` | * | Bot token from @BotFather |
| `TELEGRAM_ALLOWED_USERS` | No | Comma-separated Telegram user IDs |
| `SLACK_BOT_TOKEN` | * | Slack bot token (xoxb-...) |
| `SLACK_APP_TOKEN` | * | Slack app token (xapp-...) |
| `SLACK_ALLOWED_USERS` | No | Comma-separated Slack user IDs |
| `WHATSAPP_ENABLED` | No | Set to `true` to enable WhatsApp |
| `WHATSAPP_SESSION_PATH` | No | Path to store WhatsApp session |
| `WHATSAPP_ALLOWED_USERS` | No | Comma-separated phone numbers (+1...) |
| `SIGNAL_PHONE_NUMBER` | * | Phone number registered with signal-cli |
| `SIGNAL_CLI_PATH` | No | Path to signal-cli binary |
| `SIGNAL_DM_POLICY` | No | pairing/allowlist/open (default: pairing) |
| `WORKING_DIR` | No | Agent workspace (default: `/tmp/lettabot`) |
| `CRON_ENABLED` | No | Enable scheduled tasks |
| `HEARTBEAT_INTERVAL_MIN` | No | Heartbeat interval in minutes (e.g., `30`) |
| `HEARTBEAT_TARGET` | No | Where to deliver (e.g., `telegram:123456789`) |

\* At least one channel must be configured

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and help |
| `/new` | New conversation (keeps agent memory) |
| `/reset` | Fresh agent (clears all memory) |
| `/status` | Show current session info |
| `/skills` | List installed skills |

## Skills

LettaBot comes with 40+ builtin skills and supports installing more from [ClawdHub](https://clawdhub.com).

### Builtin Skills

Skills are copied to `{WORKING_DIR}/.skills/` on server startup (where Letta Code discovers them):

| Category | Skills |
|----------|--------|
| **Productivity** | 1password, apple-notes, apple-reminders, bear-notes, notion, obsidian, things-mac, trello |
| **Communication** | bird (Twitter), himalaya (email), imsg (iMessage), wacli (WhatsApp) |
| **Google** | google (Gmail, Calendar, Drive, Sheets, Docs), goplaces |
| **Media** | camsnap, gifgrep, nano-pdf, openai-image-gen, openai-whisper, summarize, video-frames |
| **Smart Home** | blucli, eightctl, openhue, sonoscli, spotify-player |
| **Dev Tools** | gemini, github, mcporter, oracle, peekaboo, tmux |
| **Utilities** | blogwatcher, cron, weather |

### Install from ClawdHub

```bash
# Search for skills
npm run skill:search weather

# Install a skill
npm run skill:install gog          # Google Workspace (Gmail, Calendar, Drive)
npm run skill:install bird         # Twitter/X
npm run skill:install obsidian     # Obsidian notes
npm run skill:install sonoscli     # Sonos speakers

# List installed skills  
npm run skill:list
```

Browse all skills: https://clawdhub.com

### Install from skills.sh

LettaBot is also compatible with [skills.sh](https://skills.sh) - the open agent skills ecosystem with 29K+ installs.

```bash
# Interactive search
npm run skills:find

# Install popular skill packs
npm run skills:add vercel-labs/agent-skills    # React/Next.js best practices
npm run skills:add anthropics/skills           # Frontend design, docs, PDFs
npm run skills:add expo/skills                 # React Native/Expo
npm run skills:add supabase/agent-skills       # Supabase/Postgres

# Or use npx directly
npx skills add coreyhaines31/marketingskills --global --yes
```

Browse all skills: https://skills.sh

### Configuring Skills

Skills installed via ClawdHub or skills.sh are not automatically available to LettaBot. You need to configure which skills to enable:

```bash
lettabot skills
```

This shows an interactive checklist of all available skills (from ClawdHub, skills.sh, and builtin). Select which skills to enable for your agent - checked skills will be available, unchecked skills will be removed.

**Workflow:**
1. Install skills via ClawdHub or skills.sh (see above)
2. Run `lettabot skills` to configure which ones to enable
3. Restart the server (or the agent will pick them up on next interaction)

## Heartbeat & Cron Jobs

### Heartbeat

LettaBot can periodically check in with you, reviewing a `HEARTBEAT.md` file for tasks:

```bash
# Enable heartbeat (every 30 minutes)
HEARTBEAT_INTERVAL_MIN=30

# Optional: specify delivery target (defaults to last messaged chat)
HEARTBEAT_TARGET=telegram:123456789
```

How it works:
1. Every N minutes, the system reads `HEARTBEAT.md` and sends its contents to the agent
2. The agent reviews the tasks and decides what to do
3. If nothing to do → agent calls `ignore()` tool → **response not delivered to you** (no spam!)
4. If there's something to report → agent's response is delivered to your chat

### The `ignore()` Tool

The agent has an `ignore()` tool for skipping responses:

```python
ignore(reason="Nothing to report")  # Skips delivery
```

This is useful for:
- Heartbeat check-ins with nothing to report
- Messages not directed at the agent
- Any situation where no response is needed

Setup the tool:
```bash
npm run tools:setup  # Upserts ignore() tool to Letta API
```

Edit `HEARTBEAT.md` in your working directory to add tasks you want to be reminded about.

### Cron Jobs

The agent can create its own scheduled tasks:

```bash
# Enable cron service
CRON_ENABLED=true
```

The agent uses the `lettabot-cron` CLI to manage jobs:

```bash
# Create a daily morning briefing
lettabot-cron create -n "Morning" -s "0 8 * * *" -m "Good morning! What's on the agenda?"

# List all jobs
lettabot-cron list

# Delete a job
lettabot-cron delete <job-id>
```

Jobs are stored in `cron-jobs.json` and auto-reload when changed. Responses are delivered to the last messaged chat (or specify `--deliver telegram:123456789`).

## Security

### Network Architecture

**LettaBot uses outbound connections only** - no public URL or gateway required:

| Channel | Connection Type | Exposed Ports |
|---------|-----------------|---------------|
| Telegram | Long-polling (outbound HTTP) | None |
| Slack | Socket Mode (outbound WebSocket) | None |
| WhatsApp | Outbound WebSocket via Baileys | None |
| Signal | Local daemon on 127.0.0.1 | None (localhost only) |

This is safer than webhook-based architectures that require exposing a public HTTP server.

### Tool Execution

LettaBot can execute tools on your machine. By default, it's restricted to **read-only** operations:
- `Read`, `Glob`, `Grep` - File exploration
- `web_search` - Internet queries
- `conversation_search` - Search past messages

### Restricting Access

Set allowed users per channel in `.env`:

```bash
TELEGRAM_ALLOWED_USERS=123456789,987654321
SLACK_ALLOWED_USERS=U01234567,U98765432
WHATSAPP_ALLOWED_USERS=+15551234567
SIGNAL_ALLOWED_USERS=+15551234567
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LettaBot Core                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Telegram │  │  Slack   │  │ WhatsApp │  │  Signal  │   │
│  │ (grammY) │  │  (Bolt)  │  │ (Baileys)│  │(signal-cli)│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └─────────────┼─────────────┼─────────────┘          │
│                        ▼                                    │
│              ┌─────────────────┐                           │
│              │   Letta Agent   │ ◄── Single agent,         │
│              │    (Memory)     │     single conversation   │
│              └────────┬────────┘                           │
└───────────────────────┼─────────────────────────────────────┘
                        ▼
               Letta Code SDK → CLI → Local Tools
                        │
                        ▼
               Letta Server (Memory + LLM)
```

## Development

```bash
# Run in development mode (uses Letta Cloud)
npm run dev

# Build for production
npm run build
npm start

# Run setup wizard
npm run setup
```

### Local Letta Server

To use a local Letta server instead of Letta Cloud:

```bash
# Point to local server
LETTA_BASE_URL=http://localhost:8283 npm run dev

# With a specific agent ID (useful if agent already exists)
LETTA_BASE_URL=http://localhost:8283 LETTA_AGENT_ID=agent-xxx npm run dev
```

The `LETTA_AGENT_ID` env var overrides the stored agent ID, useful for testing with different agents or servers.

## Troubleshooting

### WhatsApp

**Session errors / "Bad MAC" messages**
These are normal Signal Protocol renegotiation messages. They're noisy but harmless - WhatsApp will still work.

**Messages going to wrong chat**
If using selfChatMode and messages go to the wrong place, clear the session and re-link:
```bash
rm -rf ./data/whatsapp-session
npm run dev  # Scan QR again
```

**Competing with another WhatsApp client**
If you have clawdbot/moltbot running, it will compete for WhatsApp. Stop it first:
```bash
launchctl unload ~/Library/LaunchAgents/com.clawdbot.gateway.plist
```

### Signal

**Port 8090 already in use**
Change the port in `.env`:
```bash
SIGNAL_HTTP_PORT=8091
```

**Daemon won't start**
Make sure signal-cli is in your PATH or set the full path:
```bash
SIGNAL_CLI_PATH=/opt/homebrew/bin/signal-cli
```

### General

**Agent not responding**
Check if the agent ID is correct in `lettabot-agent.json`. If corrupted, delete it to create a fresh agent:
```bash
rm lettabot-agent.json
npm run dev
```

**Messages queuing up / slow responses**
Messages are processed one at a time to prevent SDK issues. If many messages arrive at once, they'll queue.

## Documentation

- [Slack Setup](docs/slack-setup.md)
- [WhatsApp Setup](docs/whatsapp-setup.md)
- [Signal Setup](docs/signal-setup.md)
- [Architecture](ARCHITECTURE.md)
- [Implementation Plan](PLAN.md)

## Acknowledgments

Some builtin skills are adapted from [ClawdBot](https://github.com/anthropics/clawdbot) (MIT License, Copyright © 2025 Peter Steinberger).

## License

Apache-2.0

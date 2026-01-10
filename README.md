# MoneyTab

## Table of Contents

- [MoneyTab](#moneytab)
  - [Table of Contents](#table-of-contents)
  - [Summary](#summary)
- [Development](#development)
  - [Standalone (simplest)](#standalone-simplest)
  - [With Telegram](#with-telegram)
    - [Pre-requisites](#pre-requisites)
    - [Setup](#setup)
  - [With S3](#with-s3)
    - [Setup](#setup-1)
  - [With QStash](#with-qstash)
    - [Setup](#setup-2)
- [Architecture Overview](#architecture-overview)
  - [Conceptual Overview](#conceptual-overview)
  - [Directory Structure](#directory-structure)
  - [Maybe Helpful Links](#maybe-helpful-links)

## Summary

MoneyTab is an app for shared finances. It is primarily aimed to be used as a Telegram Mini App (TMA) thus minimazing onboarding friction and leveraging existing social connections. Its core functionality is around splitting bills and sharing recurring expenses with contacts and groups.

# Development

MoneyTab uses [pnpm](https://pnpm.io/) as the package manager. Run the following command to install dependencies:

```bash
pnpm install
```

Some setup scripts will require running standalone `.ts` files, using [bun](https://bun.sh/docs/installation) is recommended for this.

MoneyTab can be run in isolation without external services, and outside of telegram, the sections below go through the basic setup and the optional services.

## Standalone (simplest)

To simplify development, the app can be run locally without additional configuration and accessed via a web browser. Some features will not be available (see the sections below for these).

```bash
# Database Setup (run once)
mkdir /data
bun run ./scripts/db_migrate.ts  # Choose dev & main DB
bun run ./scripts/db_migrate.ts  # Choose dev & monitor DB

# Env Variables (run once)
cp .env.example .env

# Run the app
pnpm run dev
```

## With Telegram

Configuring Telegram will enable the following functionality:

- Accessing the Telegram Mini App (TMA)
- Authentication through TMA
- Notifications through Telegram

### Pre-requisites

- Setup a [Telegram Bot](https://core.telegram.org/bots#how-do-i-create-a-bot) through [BotFather](https://t.me/botfather) and save the `BOT_TOKEN`
- Setup a local tunnel to port 3000 (e.g. with [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/#use-trycloudflare)) and save the `TUNNEL_URL` (this should be an `https` URL)

```bash
cloudflared tunnel --url http://localhost:3000
```

- Optional: Create a new web app for the bot through [BotFather](https://t.me/botfather). Use `/newapp` command, and assign the `TUNNEL_URL/webapp` as the URL.

### Setup

- Configure environment variables inside `.env` file:

  ```
  NEXT_PUBLIC_BASE_URL=https://your-tunnel-url

  BOT_TOKEN=your-bot-token
  NEXT_PUBLIC_BOT_ID=your-bot-id
  NEXT_PUBLIC_BOT_USERNAME=your-bot-username
  NEXT_PUBLIC_BOT_NAME=your-bot-name
  NEXT_PUBLIC_BOT_APP_NAME=your-bot-app-name

  WEBHOOK_SECRET=random string e.g. openssl rand -hex 12

  NOTIFY_DISABLED=false
  MOCK_AUTH=false
  ```

- Run bot setup script (configures the webhook)

  ```bash
  bun run ./scripts/bot_setup.ts
  ```

- Run the app
  ```bash
  pnpm run dev
  ```

## With S3

Configuring S3 will enable:

- File uploads (e.g. receipts)
- Avatar uploads

### Setup

- Create a publicly accessible S3 bucket and associated ACCESS and SECRET keys.
- Configure all `S3_` prefixed environment variables inside `.env` file

## With QStash

Configuring QStash will enable:

- Asynchrounous delivery of notifications
- Asynchrounous avatar uploads

### Setup

- Create a [QStash](https://console.upstash.com/login) account and get the API key.
- Configure all `QSTASH_` prefixed environment variables inside `.env` file

# Architecture Overview

## Conceptual Overview

- The app uses Next.js
  - Frontend routing is done through the `pages/` directory
  - API routes are located in `pages/api/` and `app/api/` directories
  - Data fetching for the frontend is done through [trpc](https://trpc.io/)
  - Server is run in a node.js environment
- **Asynchronous tasks** (e.g. notifications) are managed through a message queue (currently [QStash](https://upstash.com/)). Messages are delivered to a `webhook` endpoint
- **Error Monitoring and Analytics** are both handled without external services
  - Uses a separate database
  - Frontend events are sent to the `/api/t` endpoint
  - Backend uses a [MonitoringService](./src/server/monitor/monitor.ts) which inserts errors & events into the database directly
- **Authentication** uses either Telegram Init Data or a JWT cookie
  - When TMA is opened inside Telegram, signed user data is included in the hash fragment of the URL. With each request, this will be sent to the server (inside `api-key` header), verified and used for authentication
  - Outside of Telegram, a JWT cookie is used, which is issued on login with Telegram
  - Once server authenticated, the user objected is added to the request context and can be accessed inside of any handler
- **SQLite Database** is used for both the main app and the monitoring service
  - [drizzle](https://orm.drizzle.team/) is used as the ORM and for managing migrations
  - [turso](https://turso.tech/) is used in staging & production for hosting the database
- **Telegram** update handling is done with [Grammy](https://grammy.dev/) following its [composer pattern](https://grammy.dev/advanced/structuring#example-structure)
- **Pages & Components**
  - Primitive UI components are located in `src/components/ui/`. These are taken from [shadcn-ui](https://ui.shadcn.com/) but adapted for TMA guidelines & styles.
  - Domain specific components are located in `src/components/`
  - Most pages rely on a context provider which takes care of data fetching and state management.

## Directory Structure

```
migrations/          # Database migrations
scripts/             # Standalone scripts for database (e.g. migrations) and bot setup
test/                # Tests spanning multiple components
src/                 # Main source code
  ├── @types/        # Miscellaneous types (e.g. i18n)
  ├── app/api/       # API routes
  ├── pages/         # Frontend pages & APIs
  │   ├── api/       # API routes
  │   └── webapp/    # Webapp related pages
  ├── components/    # All components
  │   ├── ui/        # Primitive UI components
  │   ├── pages/     # A directory for each page, each with a context provider and page UI components
  │   └── platform/  # Platform provider (e.g. Telegram or Web)
  └── server/        # Server code
      ├── monitor/   # Monitoring service & database
      ├── api/       # TRPC
      │   ├── handlers/  # TRPC handlers for each API route
      │   └── routers/   # TRPC routers, grouping handlers by domain
      ├── bot/       # Handling of messages & commands from Telegram
      ├── db/        # Database schema, client and operations
      ├── notifier/  # Service for sending notifications
      ├── queue/     # Services for sending and receiving messages from the queue
      └── validator/ # Validation functions
```

## Maybe Helpful Links

- [Telegram Web App](https://core.telegram.org/bots/webapps)
  - [Telegram Answer Inline Query](https://core.telegram.org/bots/api#answerinlinequery)
  - [Web App initialisation & types](https://core.telegram.org/bots/webapps#initializing-web-apps)
  - [WebApp Typescript old](https://github.com/prKassad/telegram-webapps-types/blob/master/dist/index.d.ts)
- [Lucide Icons](https://lucide.dev/)
- [Currencies Original Source](https://gist.github.com/ksafranski/2973986)

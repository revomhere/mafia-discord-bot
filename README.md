# Mafia Discord Bot

This project is a Discord bot for hosting and assisting with Mafia game sessions. It manages game
flow (day/night cycles, roles, votes, and actions) and provides an assistant interface for the host.
Rules are not for sport mafia.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/revomhere/mafia-discord-bot.git
cd mafia-discord-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` (or `.env.dev` for development) file with your Discord bot token and any required
configuration.  
Example:

```env
PRIVATE_TOKEN=your_bot_private_token
APP_ID=your_bot_app_id

GUILD_ID=guild_id_where_bot_will_work

LOG_GUILD_ID=guild_id_where_log_messages_will_appear
LOG_CHANNEL_ID=chanenl_id_where_log_messages_will_appear
```

### 4. Run the bot

- Development (currently with some mocked data. uses `.env.dev`):

```bash
npm run dev
```

- Production:

```bash
npm run start
```

## 🛠 Tech Stack

- [Node.js](https://nodejs.org/)
- [Discord.js](https://discord.js.org/)
- [TypeScript](https://www.typescriptlang.org/)

## 📖 Notes

This project is still in development and may not be fully stable. Contributions, feedback, and ideas
are welcome! Made for personal use.

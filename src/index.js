// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🌟 Nova Community Bot v2.0 - Main Entry Point
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./database/mongoose');
const logger = require('./utils/logger');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');

// ─── Create Client ─────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
});

// ─── Collections ──────────────────────────────────────
client.commands = new Collection();
client.slashCommands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();
client.musicQueues = new Map();
client.tickets = new Collection();

// ─── Banner ───────────────────────────────────────────
const banner = `
${chalk.hex('#7B2FBE')('╔══════════════════════════════════════════════╗')}
${chalk.hex('#7B2FBE')('║')}  ${chalk.bold.white('🌟 Nova Community Bot v2.0')}                    ${chalk.hex('#7B2FBE')('║')}
${chalk.hex('#7B2FBE')('║')}  ${chalk.gray('نـوفـا كوميونتي | Nova Community')}             ${chalk.hex('#7B2FBE')('║')}
${chalk.hex('#7B2FBE')('╚══════════════════════════════════════════════╝')}
`;

console.log(banner);

// ─── Initialize ───────────────────────────────────────
async function init() {
  try {
    // Connect to Database
    logger.info('Connecting to MongoDB...');
    await connectDB();
    logger.success('MongoDB connected successfully!');

    // Load Commands
    logger.info('Loading commands...');
    await loadCommands(client);
    logger.success(`Loaded ${client.commands.size} prefix commands & ${client.slashCommands.size} slash commands`);

    // Load Events
    logger.info('Loading events...');
    await loadEvents(client);
    logger.success('Events loaded successfully!');

    // Login
    logger.info('Logging in to Discord...');
    await client.login(process.env.DISCORD_TOKEN);

  } catch (error) {
    logger.error('Failed to initialize bot:', error);
    process.exit(1);
  }
}

// ─── Start Dashboard ──────────────────────────────────
const { startDashboard } = require('../dashboard/server');
startDashboard(client);

// ─── Error Handling ───────────────────────────────────
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

init();

module.exports = { client };

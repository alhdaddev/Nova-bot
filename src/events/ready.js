const { ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const chalk = require('chalk');

const statuses = [
  { type: ActivityType.Watching, name: 'نـوفـا كوميونتي 🌟' },
  { type: ActivityType.Listening, name: '/help | !help' },
  { type: ActivityType.Playing, name: 'Nova Community Bot v2.0' },
  { type: ActivityType.Watching, name: '{members} عضو في السيرفر' },
];

let statusIndex = 0;

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.success(`Logged in as ${chalk.cyan(client.user.tag)}`);
    logger.info(`Serving ${chalk.yellow(client.guilds.cache.size)} guild(s) | ${chalk.yellow(client.users.cache.size)} users`);

    // Set initial status
    updateStatus(client);

    // Rotate status every 30 seconds
    setInterval(() => updateStatus(client), 30000);

    // Log info
    console.log('\n' + chalk.hex('#7B2FBE')('━'.repeat(50)));
    console.log(chalk.bold.white('  🌟 Nova Community Bot is Online!'));
    console.log(chalk.gray(`  Guilds: ${client.guilds.cache.size}`));
    console.log(chalk.gray(`  Commands: ${client.commands.size} prefix | ${client.slashCommands.size} slash`));
    console.log(chalk.gray(`  Dashboard: http://localhost:${process.env.DASHBOARD_PORT || 3000}`));
    console.log(chalk.hex('#7B2FBE')('━'.repeat(50)) + '\n');
  },
};

function updateStatus(client) {
  const status = statuses[statusIndex % statuses.length];
  const name = status.name.replace('{members}', client.guilds.cache.reduce((a, g) => a + g.memberCount, 0));
  
  client.user.setPresence({
    status: 'online',
    activities: [{ type: status.type, name }],
  });
  
  statusIndex++;
}

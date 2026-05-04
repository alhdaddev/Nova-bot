const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

    for (const file of commandFiles) {
      try {
        const command = require(path.join(categoryPath, file));

        // Prefix Command
        if (command.name) {
          client.commands.set(command.name, command);
          if (command.aliases) {
            command.aliases.forEach(alias => client.aliases.set(alias, command.name));
          }
        }

        // Slash Command
        if (command.data) {
          client.slashCommands.set(command.data.name, command);
        }

      } catch (error) {
        logger.error(`Failed to load command ${file}:`, error.message);
      }
    }
  }
}

module.exports = { loadCommands };

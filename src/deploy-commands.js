require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const categories = fs.readdirSync(commandsPath);

for (const category of categories) {
  const categoryPath = path.join(commandsPath, category);
  if (!fs.statSync(categoryPath).isDirectory()) continue;
  
  const commandFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js') && !f.startsWith('_'));
  
  for (const file of commandFiles) {
    try {
      const command = require(path.join(categoryPath, file));
      if (command.data) {
        commands.push(command.data.toJSON());
        console.log(chalk.green(`✓`), chalk.white(command.data.name));
      }
    } catch (e) {
      console.log(chalk.red(`✗`), file, e.message);
    }
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(chalk.hex('#7B2FBE')(`\n🚀 Deploying ${commands.length} slash commands...\n`));

    // Deploy to specific guild (faster, for testing)
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(chalk.green(`\n✅ Deployed to guild ${process.env.GUILD_ID}`));
    } else {
      // Deploy globally (takes up to 1 hour)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(chalk.green(`\n✅ Deployed globally!`));
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error);
  }
})();

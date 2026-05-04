const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    
    // ─── Slash Commands ────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;

      // Cooldown check
      if (!client.cooldowns.has(command.data.name)) {
        client.cooldowns.set(command.data.name, new Map());
      }

      const now = Date.now();
      const timestamps = client.cooldowns.get(command.data.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;

      if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor('#FFB800')
                .setDescription(`⏱️ انتظر **${timeLeft}** ثانية قبل استخدام هذا الأمر!`),
            ],
            ephemeral: true,
          });
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      // Permission check
      if (command.userPermissions) {
        const missingPerms = command.userPermissions.filter(
          perm => !interaction.member.permissions.has(perm)
        );
        if (missingPerms.length > 0) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor('#FF4444')
                .setDescription(`❌ ليس لديك صلاحية: \`${missingPerms.join(', ')}\``),
            ],
            ephemeral: true,
          });
        }
      }

      try {
        logger.command('/', command.data.name, interaction.user.tag, interaction.guild?.name || 'DM');
        await command.execute(interaction, [], client);
      } catch (error) {
        logger.error(`Error executing /${command.data.name}:`, error);
        const reply = { 
          embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ حدث خطأ!')],
          ephemeral: true 
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
    }

    // ─── Button Interactions ───────────────────────────
    if (interaction.isButton()) {
      const { handleButton } = require('../systems/tickets/ticketSystem');
      const { handleGiveawayButton } = require('../systems/giveaway/giveawaySystem');

      if (interaction.customId.startsWith('ticket_')) {
        await handleButton(interaction, client).catch(() => {});
      } else if (interaction.customId.startsWith('giveaway_')) {
        await handleGiveawayButton(interaction, client).catch(() => {});
      }
    }

    // ─── Select Menu Interactions ──────────────────────
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_subject') {
        const { handleSubjectSelect } = require('../systems/tickets/ticketSystem');
        await handleSubjectSelect(interaction, client).catch(() => {});
      }
    }
  },
};

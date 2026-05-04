const { EmbedBuilder } = require('discord.js');
const { getGuild, getUser } = require('../database/models');
const { addXP } = require('../systems/leveling/xpSystem');
const { checkAutomod } = require('../systems/moderation/automod');
const logger = require('../utils/logger');
const ms = require('ms');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // ─── Get Guild Config ──────────────────────────────
    let guildConfig;
    try {
      guildConfig = await getGuild(message.guild.id);
    } catch {
      guildConfig = { prefix: process.env.PREFIX || '!' };
    }

    const prefix = guildConfig.prefix || process.env.PREFIX || '!';

    // ─── Automod ───────────────────────────────────────
    if (guildConfig.automod) {
      const deleted = await checkAutomod(message, guildConfig, client);
      if (deleted) return;
    }

    // ─── XP System ────────────────────────────────────
    if (guildConfig.leveling !== false) {
      await addXP(message, client, guildConfig);
    }

    // ─── Prefix Command Handler ────────────────────────
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Check aliases
    const aliasTarget = client.aliases.get(commandName);
    const command = client.commands.get(commandName) || client.commands.get(aliasTarget);

    if (!command) return;

    // ─── Cooldown Check ───────────────────────────────
    if (!client.cooldowns.has(command.name)) {
      client.cooldowns.set(command.name, new Map());
    }

    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(process.env.WARNING_COLOR || '#FFB800')
              .setDescription(`⏱️ انتظر **${timeLeft}** ثانية قبل استخدام هذا الأمر مجدداً!`),
          ],
        });
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // ─── Permission Check ──────────────────────────────
    if (command.userPermissions) {
      const missingPerms = command.userPermissions.filter(
        perm => !message.member.permissions.has(perm)
      );
      if (missingPerms.length > 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(process.env.ERROR_COLOR || '#FF4444')
              .setDescription(`❌ ليس لديك صلاحية: \`${missingPerms.join(', ')}\``),
          ],
        });
      }
    }

    // ─── Owner Only ───────────────────────────────────
    if (command.ownerOnly && message.author.id !== process.env.OWNER_ID) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(process.env.ERROR_COLOR || '#FF4444')
            .setDescription('❌ هذا الأمر مخصص للمطور فقط!'),
        ],
      });
    }

    // ─── Execute ──────────────────────────────────────
    try {
      logger.command(prefix, command.name, message.author.tag, message.guild.name);
      await command.execute(message, args, client, guildConfig);
    } catch (error) {
      logger.error(`Error executing ${command.name}:`, error);
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(process.env.ERROR_COLOR || '#FF4444')
            .setDescription('❌ حدث خطأ أثناء تنفيذ الأمر!'),
        ],
      }).catch(() => {});
    }
  },
};

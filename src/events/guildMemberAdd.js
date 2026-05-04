// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  guildMemberAdd Event
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getGuild } = require('../database/models');
const logger = require('../utils/logger');
const moment = require('moment');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      const guildConfig = await getGuild(member.guild.id);

      // ─── Auto Roles ──────────────────────────────────
      if (guildConfig.autoRoles && guildConfig.autoRoles.length > 0) {
        for (const roleId of guildConfig.autoRoles) {
          const role = member.guild.roles.cache.get(roleId);
          if (role) await member.roles.add(role).catch(() => {});
        }
      }

      // ─── Welcome Message ──────────────────────────────
      if (!guildConfig.welcomeMsg) return;
      
      const channelId = guildConfig.welcomeChannel || process.env.WELCOME_CHANNEL_ID;
      if (!channelId) return;
      
      const channel = member.guild.channels.cache.get(channelId);
      if (!channel) return;

      const msg = (guildConfig.welcomeMessage || 'مرحباً {user} في {server}! 🎉')
        .replace('{user}', `<@${member.user.id}>`)
        .replace('{username}', member.user.username)
        .replace('{server}', member.guild.name)
        .replace('{count}', member.guild.memberCount)
        .replace('{tag}', member.user.tag);

      const embed = new EmbedBuilder()
        .setColor(process.env.EMBED_COLOR || '#7B2FBE')
        .setTitle('🌟 عضو جديد!')
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: '📅 انضم في', value: moment().format('DD/MM/YYYY - HH:mm'), inline: true },
          { name: '👥 عدد الأعضاء', value: `${member.guild.memberCount}`, inline: true },
          { name: '🏷️ الحساب', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: `${member.guild.name}`, iconURL: member.guild.iconURL() })
        .setTimestamp();

      await channel.send({ embeds: [embed] });

    } catch (error) {
      logger.error('Error in guildMemberAdd:', error.message);
    }
  },
};

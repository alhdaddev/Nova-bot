const { EmbedBuilder } = require('discord.js');
const { getGuild } = require('../database/models');
const logger = require('../utils/logger');
const moment = require('moment');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    try {
      const guildConfig = await getGuild(member.guild.id);
      if (!guildConfig.leaveMsg) return;
      
      const channelId = guildConfig.leaveChannel || process.env.LEAVE_CHANNEL_ID;
      if (!channelId) return;

      const channel = member.guild.channels.cache.get(channelId);
      if (!channel) return;

      const msg = (guildConfig.leaveMessage || 'وداعاً {username}!')
        .replace('{user}', `<@${member.user.id}>`)
        .replace('{username}', member.user.username)
        .replace('{server}', member.guild.name)
        .replace('{count}', member.guild.memberCount);

      const embed = new EmbedBuilder()
        .setColor('#FF4444')
        .setTitle('👋 مغادرة عضو')
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👥 عدد الأعضاء الآن', value: `${member.guild.memberCount}`, inline: true },
          { name: '📅 انضم', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'غير معروف', inline: true }
        )
        .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
        .setTimestamp();

      await channel.send({ embeds: [embed] });

    } catch (error) {
      logger.error('Error in guildMemberRemove:', error.message);
    }
  },
};

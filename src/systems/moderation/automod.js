const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

// Spam tracking
const spamMap = new Map();

// Bad words list (customize as needed)
const badWords = ['badword1', 'badword2']; // Add your own

// Link patterns
const linkPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
const discordInvitePattern = /discord\.(gg|io|me|li)\/.+/gi;

async function checkAutomod(message, guildConfig, client) {
  // Skip if admin/moderator
  if (message.member?.permissions.has('Administrator')) return false;

  // ─── Anti Invite Links ────────────────────────────
  if (guildConfig.antiLinks) {
    if (discordInvitePattern.test(message.content)) {
      await message.delete().catch(() => {});
      const warn = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF4444')
            .setDescription(`🚫 ${message.author} ممنوع نشر روابط الدعوة!`),
        ],
      });
      setTimeout(() => warn.delete().catch(() => {}), 5000);
      return true;
    }
  }

  // ─── Anti Spam ────────────────────────────────────
  if (guildConfig.antiSpam) {
    const key = `${message.author.id}-${message.guild.id}`;
    const now = Date.now();

    if (!spamMap.has(key)) {
      spamMap.set(key, { count: 1, lastMessage: now, messages: [message.id] });
    } else {
      const userData = spamMap.get(key);
      if (now - userData.lastMessage < 5000) {
        userData.count++;
        userData.messages.push(message.id);

        if (userData.count >= 5) {
          // Delete spam messages
          try {
            await message.channel.bulkDelete(
              userData.messages.filter(id => id !== message.id).slice(-10)
            );
            await message.delete().catch(() => {});
          } catch {}

          const warn = await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor('#FF4444')
                .setDescription(`🚫 ${message.author} توقف عن السبام!`),
            ],
          });
          setTimeout(() => warn.delete().catch(() => {}), 5000);

          spamMap.set(key, { count: 0, lastMessage: now, messages: [] });
          return true;
        }

        spamMap.set(key, { ...userData, lastMessage: now });
      } else {
        spamMap.set(key, { count: 1, lastMessage: now, messages: [message.id] });
      }
    }
  }

  return false;
}

// Clean spam map periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of spamMap.entries()) {
    if (now - data.lastMessage > 10000) spamMap.delete(key);
  }
}, 30000);

module.exports = { checkAutomod };

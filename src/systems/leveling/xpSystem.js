const { EmbedBuilder } = require('discord.js');
const { getUser, getGuild } = require('../../database/models');
const logger = require('../../utils/logger');

// XP cooldowns per user (in memory)
const xpCooldowns = new Map();

// Calculate XP needed for next level
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.3, level));
}

// Get level from total XP
function getLevelFromXP(totalXp) {
  let level = 0;
  let xp = totalXp;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
  }
  return { level, currentXp: xp, neededXp: xpForLevel(level) };
}

// Add XP to user
async function addXP(message, client, guildConfig) {
  const userId = message.author.id;
  const guildId = message.guild.id;
  const key = `${userId}-${guildId}`;

  // 1 minute cooldown per user
  if (xpCooldowns.has(key)) {
    const lastMsg = xpCooldowns.get(key);
    if (Date.now() - lastMsg < 60000) return;
  }

  xpCooldowns.set(key, Date.now());

  // Random XP between 10-25
  const xpGained = Math.floor(Math.random() * 16) + 10;

  try {
    const userData = await getUser(userId, guildId);
    const oldLevel = userData.level;

    userData.xp = (userData.xp || 0) + xpGained;
    userData.totalXp = (userData.totalXp || 0) + xpGained;
    userData.messages = (userData.messages || 0) + 1;

    // Level up check
    const neededXp = xpForLevel(userData.level);
    if (userData.xp >= neededXp) {
      userData.xp -= neededXp;
      userData.level += 1;

      // Announce level up
      await announceLevelUp(message, client, userData, guildConfig);

      // Check for level roles
      await checkLevelRoles(message.member, userData.level, guildConfig);
    }

    await userData.save();
  } catch (error) {
    // Silent fail - XP system shouldn't break bot
  }
}

async function announceLevelUp(message, client, userData, guildConfig) {
  try {
    const channelId = guildConfig.levelUpChannel;
    const channel = channelId 
      ? message.guild.channels.cache.get(channelId) || message.channel 
      : message.channel;

    const embed = new EmbedBuilder()
      .setColor(process.env.EMBED_COLOR || '#7B2FBE')
      .setTitle('🎉 ترقية مستوى!')
      .setDescription(`تهانينا ${message.author}! وصلت إلى **المستوى ${userData.level}** 🌟`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'استمر في التحدث للوصول لمستويات أعلى!' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch {}
}

async function checkLevelRoles(member, level, guildConfig) {
  if (!guildConfig.levelRoles || !guildConfig.levelRoles.length) return;
  
  try {
    for (const levelRole of guildConfig.levelRoles) {
      if (level >= levelRole.level) {
        const role = member.guild.roles.cache.get(levelRole.roleId);
        if (role && !member.roles.cache.has(levelRole.roleId)) {
          await member.roles.add(role);
        }
      }
    }
  } catch {}
}

// Get leaderboard
async function getLeaderboard(guildId, limit = 10) {
  const { User } = require('../../database/models');
  return await User.find({ guildId })
    .sort({ totalXp: -1 })
    .limit(limit)
    .select('userId level totalXp xp messages');
}

module.exports = { addXP, xpForLevel, getLevelFromXP, getLeaderboard };

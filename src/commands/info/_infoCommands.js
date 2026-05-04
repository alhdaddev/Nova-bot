const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getUser, getGuild } = require('../../database/models');
const { getLevelFromXP, getLeaderboard, xpForLevel } = require('../../systems/leveling/xpSystem');
const moment = require('moment');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  USERINFO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const userinfo = {
  name: 'userinfo',
  aliases: ['ui', 'whois', 'معلومات'],
  description: 'معلومات عن عضو',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('عرض معلومات عضو')
    .addUserOption(o => o.setName('member').setDescription('العضو').setRequired(false)),

  async execute(msgOrInt, args, client, guildConfig) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const target = isSlash
      ? (msgOrInt.options.getMember('member') || msgOrInt.member)
      : (msgOrInt.mentions.members.first() || msgOrInt.member);

    const user = target.user;
    let userData;
    try { userData = await getUser(user.id, target.guild.id); } catch { userData = { level: 0, xp: 0, totalXp: 0, messages: 0, warnings: [] }; }

    const roles = target.roles.cache
      .filter(r => r.id !== target.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}>`)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setColor(target.displayHexColor || process.env.EMBED_COLOR || '#7B2FBE')
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
        { name: '🤖 بوت؟', value: user.bot ? 'نعم' : 'لا', inline: true },
        { name: '📅 تاريخ إنشاء الحساب', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false },
        { name: '📅 تاريخ الانضمام', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:F>\n<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: false },
        { name: '🎭 الرتب', value: roles.length ? roles.join(' ') : 'لا يوجد', inline: false },
        { name: '⭐ المستوى', value: `${userData.level}`, inline: true },
        { name: '📊 XP', value: `${userData.totalXp}`, inline: true },
        { name: '💬 الرسائل', value: `${userData.messages}`, inline: true },
        { name: '⚠️ التحذيرات', value: `${userData.warnings?.length || 0}`, inline: true },
      )
      .setFooter({ text: `Nova Community | ${target.guild.name}` })
      .setTimestamp();

    isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SERVERINFO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const serverinfo = {
  name: 'serverinfo',
  aliases: ['si', 'server', 'السيرفر'],
  description: 'معلومات السيرفر',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('عرض معلومات السيرفر'),

  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const guild = isSlash ? msgOrInt.guild : msgOrInt.guild;

    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === 0).size;
    const voiceChannels = channels.filter(c => c.type === 2).size;
    const categories = channels.filter(c => c.type === 4).size;

    const members = guild.members.cache;
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;

    const boosts = guild.premiumSubscriptionCount;
    const boostLevel = guild.premiumTier;

    const embed = new EmbedBuilder()
      .setColor(process.env.EMBED_COLOR || '#7B2FBE')
      .setTitle(`🏰 ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .setImage(guild.bannerURL({ size: 1024 }))
      .addFields(
        { name: '🆔 ID', value: `\`${guild.id}\``, inline: true },
        { name: '👑 المالك', value: `<@${guild.ownerId}>`, inline: true },
        { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👥 الأعضاء', value: `👤 ${humans} | 🤖 ${bots} | 📊 ${guild.memberCount}`, inline: false },
        { name: '💬 القنوات', value: `📝 ${textChannels} | 🔊 ${voiceChannels} | 📁 ${categories}`, inline: false },
        { name: '🎭 الرتب', value: `${guild.roles.cache.size}`, inline: true },
        { name: '😀 الإيموجي', value: `${guild.emojis.cache.size}`, inline: true },
        { name: '🚀 البوستات', value: `${boosts} (Level ${boostLevel})`, inline: true },
        { name: '🔒 مستوى التحقق', value: `${guild.verificationLevel}`, inline: true },
      )
      .setFooter({ text: 'Nova Community Bot' })
      .setTimestamp();

    isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RANK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const rank = {
  name: 'rank',
  aliases: ['level', 'xp', 'مستوى'],
  description: 'عرض مستواك',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('عرض مستوى عضو')
    .addUserOption(o => o.setName('member').setDescription('العضو').setRequired(false)),

  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const target = isSlash
      ? (msgOrInt.options.getMember('member') || msgOrInt.member)
      : (msgOrInt.mentions.members.first() || msgOrInt.member);

    if (isSlash) await msgOrInt.deferReply();

    let userData;
    try { userData = await getUser(target.user.id, target.guild.id); } catch { userData = { level: 0, xp: 0, totalXp: 0, messages: 0 }; }

    const neededXp = xpForLevel(userData.level);
    const progress = Math.round((userData.xp / neededXp) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    const embed = new EmbedBuilder()
      .setColor(process.env.EMBED_COLOR || '#7B2FBE')
      .setTitle(`⭐ مستوى ${target.user.username}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .setDescription([
        `> **المستوى:** \`${userData.level}\``,
        `> **XP:** \`${userData.xp} / ${neededXp}\``,
        `> **إجمالي XP:** \`${userData.totalXp}\``,
        `> **الرسائل:** \`${userData.messages}\``,
        '',
        `\`[${bar}]\` ${Math.round((userData.xp / neededXp) * 100)}%`,
      ].join('\n'))
      .setFooter({ text: `Nova Community | المستوى التالي يتطلب ${neededXp - userData.xp} XP` });

    isSlash ? msgOrInt.editReply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LEADERBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const leaderboard = {
  name: 'leaderboard',
  aliases: ['lb', 'top', 'متصدرين'],
  description: 'لوحة المتصدرين',
  cooldown: 15,
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('عرض لوحة المتصدرين'),

  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    if (isSlash) await msgOrInt.deferReply();

    const guildId = isSlash ? msgOrInt.guild.id : msgOrInt.guild.id;
    
    let topUsers;
    try {
      topUsers = await getLeaderboard(guildId, 10);
    } catch {
      const err = { embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ لا تتوفر بيانات!')] };
      return isSlash ? msgOrInt.editReply(err) : msgOrInt.reply(err);
    }

    const medals = ['🥇', '🥈', '🥉'];
    const descriptions = await Promise.all(topUsers.map(async (u, i) => {
      let username = `<@${u.userId}>`;
      try {
        const member = await msgOrInt.guild.members.fetch(u.userId);
        username = member.user.username;
      } catch {}
      const medal = medals[i] || `\`${i + 1}\``;
      return `${medal} **${username}** — Level ${u.level} | ${u.totalXp} XP`;
    }));

    const embed = new EmbedBuilder()
      .setColor(process.env.EMBED_COLOR || '#7B2FBE')
      .setTitle('🏆 لوحة المتصدرين')
      .setDescription(descriptions.join('\n') || 'لا يوجد بيانات بعد!')
      .setThumbnail(msgOrInt.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Nova Community | أكثر الأعضاء نشاطاً' })
      .setTimestamp();

    isSlash ? msgOrInt.editReply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AVATAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const avatar = {
  name: 'avatar',
  aliases: ['av', 'pfp', 'صورة'],
  description: 'صورة عضو',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('عرض صورة عضو')
    .addUserOption(o => o.setName('member').setDescription('العضو').setRequired(false)),

  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const target = isSlash
      ? (msgOrInt.options.getUser('member') || msgOrInt.user)
      : (msgOrInt.mentions.users.first() || msgOrInt.author);

    const embed = new EmbedBuilder()
      .setColor(process.env.EMBED_COLOR || '#7B2FBE')
      .setTitle(`🖼️ صورة ${target.username}`)
      .setImage(target.displayAvatarURL({ dynamic: true, size: 4096 }))
      .addFields(
        { name: 'PNG', value: `[رابط](${target.displayAvatarURL({ format: 'png', size: 4096 })})`, inline: true },
        { name: 'JPG', value: `[رابط](${target.displayAvatarURL({ format: 'jpg', size: 4096 })})`, inline: true },
        { name: 'WEBP', value: `[رابط](${target.displayAvatarURL({ format: 'webp', size: 4096 })})`, inline: true },
      );

    isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ping = {
  name: 'ping',
  aliases: ['بينج'],
  description: 'سرعة البوت',
  cooldown: 5,
  data: new SlashCommandBuilder().setName('ping').setDescription('عرض سرعة استجابة البوت'),

  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const ws = client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(ws < 100 ? '#00D26A' : ws < 200 ? '#FFB800' : '#FF4444')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 Websocket', value: `\`${ws}ms\``, inline: true },
        { name: '⚡ API Latency', value: `\`${Date.now() - (isSlash ? msgOrInt.createdTimestamp : msgOrInt.createdTimestamp)}ms\``, inline: true },
      )
      .setFooter({ text: 'Nova Community Bot' });

    isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  },
};

module.exports = { userinfo, serverinfo, rank, leaderboard, avatar, ping };

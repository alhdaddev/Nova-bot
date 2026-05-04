const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { getUser, getGuild, Case, getNextCaseId } = require('../../database/models');
const ms = require('ms');
const logger = require('../../utils/logger');

// ─── Utility ──────────────────────────────────────────
async function logCase(type, targetId, modId, reason, guildId, duration = null) {
  try {
    const caseId = await getNextCaseId(guildId);
    const newCase = new Case({ caseId, guildId, type, userId: targetId, moderatorId: modId, reason, duration });
    await newCase.save();
    return caseId;
  } catch { return null; }
}

function modEmbed(type, target, moderator, reason, caseId, extra = {}) {
  const colors = { ban: '#FF0000', kick: '#FF6600', mute: '#FFB800', warn: '#FFD700', unmute: '#00D26A', unban: '#00D26A' };
  const icons = { ban: '🔨', kick: '👢', mute: '🔇', warn: '⚠️', unmute: '🔊', unban: '✅' };
  return new EmbedBuilder()
    .setColor(colors[type] || '#7B2FBE')
    .setTitle(`${icons[type]} ${type.toUpperCase()} | Case #${caseId}`)
    .addFields(
      { name: '👤 العضو', value: `${target} \`${target.tag || target.user?.tag}\``, inline: true },
      { name: '🛡️ المشرف', value: `${moderator}`, inline: true },
      { name: '📋 السبب', value: reason || 'لا يوجد سبب', inline: false },
      ...(extra.duration ? [{ name: '⏱️ المدة', value: extra.duration, inline: true }] : []),
    )
    .setThumbnail(target.displayAvatarURL?.({ dynamic: true }) || target.user?.displayAvatarURL?.({ dynamic: true }))
    .setTimestamp();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BAN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ban = {
  name: 'ban',
  aliases: ['حظر'],
  description: 'حظر عضو',
  usage: 'ban @عضو [السبب]',
  userPermissions: ['BanMembers'],
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو من السيرفر')
    .addUserOption(o => o.setName('member').setDescription('العضو').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(msgOrInt, args, client, guildConfig) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const member = isSlash ? msgOrInt.options.getMember('member') : msgOrInt.mentions.members.first();
    const reason = isSlash ? msgOrInt.options.getString('reason') || 'لا يوجد سبب' : args.slice(1).join(' ') || 'لا يوجد سبب';
    const moderator = isSlash ? msgOrInt.member : msgOrInt.member;

    if (!member) {
      const err = new EmbedBuilder().setColor('#FF4444').setDescription('❌ حدد عضواً!');
      return isSlash ? msgOrInt.reply({ embeds: [err], ephemeral: true }) : msgOrInt.reply({ embeds: [err] });
    }

    if (!member.bannable) {
      const err = new EmbedBuilder().setColor('#FF4444').setDescription('❌ لا أستطيع حظر هذا العضو!');
      return isSlash ? msgOrInt.reply({ embeds: [err], ephemeral: true }) : msgOrInt.reply({ embeds: [err] });
    }

    try {
      await member.send({ embeds: [new EmbedBuilder().setColor('#FF0000').setDescription(`🔨 تم حظرك من **${member.guild.name}**\n**السبب:** ${reason}`)] }).catch(() => {});
      await member.ban({ reason });
      const caseId = await logCase('ban', member.user.id, moderator.user.id, reason, member.guild.id);
      const embed = modEmbed('ban', member.user, moderator.user, reason, caseId);
      isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
    } catch (e) {
      const err = new EmbedBuilder().setColor('#FF4444').setDescription(`❌ خطأ: ${e.message}`);
      isSlash ? msgOrInt.reply({ embeds: [err], ephemeral: true }) : msgOrInt.reply({ embeds: [err] });
    }
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  KICK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const kick = {
  name: 'kick',
  aliases: ['طرد'],
  description: 'طرد عضو',
  userPermissions: ['KickMembers'],
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد عضو من السيرفر')
    .addUserOption(o => o.setName('member').setDescription('العضو').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(msgOrInt, args, client, guildConfig) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const member = isSlash ? msgOrInt.options.getMember('member') : msgOrInt.mentions.members.first();
    const reason = isSlash ? msgOrInt.options.getString('reason') || 'لا يوجد سبب' : args.slice(1).join(' ') || 'لا يوجد سبب';

    if (!member) {
      return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ حدد عضواً!')], ephemeral: isSlash });
    }
    if (!member.kickable) {
      return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ لا أستطيع طرد هذا العضو!')], ephemeral: isSlash });
    }

    await member.send({ embeds: [new EmbedBuilder().setColor('#FF6600').setDescription(`👢 تم طردك من **${member.guild.name}**\n**السبب:** ${reason}`)] }).catch(() => {});
    await member.kick(reason);
    const caseId = await logCase('kick', member.user.id, (isSlash ? msgOrInt.user : msgOrInt.author).id, reason, member.guild.id);
    msgOrInt.reply({ embeds: [modEmbed('kick', member.user, isSlash ? msgOrInt.user : msgOrInt.author, reason, caseId)] });
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MUTE (Timeout)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const mute = {
  name: 'mute',
  aliases: ['كتم', 'timeout'],
  description: 'كتم عضو',
  userPermissions: ['ModerateMembers'],
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('كتم عضو مؤقتاً')
    .addUserOption(o => o.setName('member').setDescription('العضو').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('المدة (مثال: 10m, 1h, 1d)').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(msgOrInt, args, client, guildConfig) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const member = isSlash ? msgOrInt.options.getMember('member') : msgOrInt.mentions.members.first();
    const durationStr = isSlash ? msgOrInt.options.getString('duration') : args[1];
    const reason = isSlash ? msgOrInt.options.getString('reason') || 'لا يوجد سبب' : args.slice(2).join(' ') || 'لا يوجد سبب';

    if (!member || !durationStr) {
      return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ استخدام: `mute @عضو 10m [السبب]`')], ephemeral: isSlash });
    }

    const duration = ms(durationStr);
    if (!duration || duration > 2419200000) { // Max 28 days
      return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ مدة غير صحيحة! (max: 28d)')], ephemeral: isSlash });
    }

    try {
      await member.timeout(duration, reason);
      const caseId = await logCase('mute', member.user.id, (isSlash ? msgOrInt.user : msgOrInt.author).id, reason, member.guild.id, durationStr);
      msgOrInt.reply({ embeds: [modEmbed('mute', member.user, isSlash ? msgOrInt.user : msgOrInt.author, reason, caseId, { duration: durationStr })] });
    } catch (e) {
      msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription(`❌ خطأ: ${e.message}`)], ephemeral: isSlash });
    }
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WARN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const warn = {
  name: 'warn',
  aliases: ['تحذير'],
  description: 'تحذير عضو',
  userPermissions: ['ModerateMembers'],
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('تحذير عضو')
    .addUserOption(o => o.setName('member').setDescription('العضو').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('السبب').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(msgOrInt, args, client, guildConfig) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const member = isSlash ? msgOrInt.options.getMember('member') : msgOrInt.mentions.members.first();
    const reason = isSlash ? msgOrInt.options.getString('reason') : args.slice(1).join(' ') || 'لا يوجد سبب';
    const moderator = isSlash ? msgOrInt.user : msgOrInt.author;

    if (!member) return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ حدد عضواً!')], ephemeral: isSlash });

    try {
      const userData = await getUser(member.user.id, member.guild.id);
      const warnId = `W${Date.now().toString(36).toUpperCase()}`;
      userData.warnings.push({ reason, moderator: moderator.tag, id: warnId });
      await userData.save();

      const caseId = await logCase('warn', member.user.id, moderator.id, reason, member.guild.id);

      await member.send({ embeds: [new EmbedBuilder().setColor('#FFD700').setDescription(`⚠️ تلقيت تحذيراً في **${member.guild.name}**\n**السبب:** ${reason}\n**عدد تحذيراتك:** ${userData.warnings.length}`)] }).catch(() => {});

      msgOrInt.reply({ embeds: [modEmbed('warn', member.user, moderator, reason, caseId).addFields({ name: '⚠️ إجمالي التحذيرات', value: `${userData.warnings.length}`, inline: true })] });

      // Auto action on max warnings
      const maxWarns = guildConfig?.maxWarnings || 3;
      if (userData.warnings.length >= maxWarns) {
        const action = guildConfig?.warnAction || 'kick';
        if (action === 'kick' && member.kickable) await member.kick('تجاوز الحد الأقصى من التحذيرات');
        if (action === 'ban' && member.bannable) await member.ban({ reason: 'تجاوز الحد الأقصى من التحذيرات' });
        if (action === 'mute') await member.timeout(3600000, 'تجاوز الحد الأقصى من التحذيرات');
      }
    } catch (e) {
      msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription(`❌ خطأ: ${e.message}`)], ephemeral: isSlash });
    }
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PURGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const purge = {
  name: 'purge',
  aliases: ['clear', 'حذف'],
  description: 'حذف رسائل',
  userPermissions: ['ManageMessages'],
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('حذف رسائل من القناة')
    .addIntegerOption(o => o.setName('amount').setDescription('عدد الرسائل (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('member').setDescription('حذف رسائل عضو معين').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(msgOrInt, args, client, guildConfig) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const amount = isSlash ? msgOrInt.options.getInteger('amount') : parseInt(args[0]);
    const targetMember = isSlash ? msgOrInt.options.getMember('member') : msgOrInt.mentions.members.first();

    if (!amount || amount < 1 || amount > 100) {
      return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ حدد عدداً من 1-100!')], ephemeral: isSlash });
    }

    try {
      if (isSlash) await msgOrInt.deferReply({ ephemeral: true });

      let messages = await msgOrInt.channel.messages.fetch({ limit: amount + 1 });
      
      if (targetMember) {
        messages = messages.filter(m => m.author.id === targetMember.user.id);
      }

      // Filter out messages older than 14 days
      messages = messages.filter(m => Date.now() - m.createdTimestamp < 1209600000);

      const deleted = await msgOrInt.channel.bulkDelete(messages, true);

      const embed = new EmbedBuilder()
        .setColor('#00D26A')
        .setDescription(`🗑️ تم حذف **${deleted.size}** رسالة${targetMember ? ` من ${targetMember}` : ''}!`);

      if (isSlash) {
        await msgOrInt.editReply({ embeds: [embed] });
      } else {
        const reply = await msgOrInt.channel.send({ embeds: [embed] });
        setTimeout(() => reply.delete().catch(() => {}), 3000);
        msgOrInt.delete().catch(() => {});
      }
    } catch (e) {
      const err = { embeds: [new EmbedBuilder().setColor('#FF4444').setDescription(`❌ خطأ: ${e.message}`)], ephemeral: isSlash };
      isSlash ? msgOrInt.editReply(err) : msgOrInt.reply(err);
    }
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LOCK / UNLOCK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const lock = {
  name: 'lock',
  aliases: ['قفل'],
  userPermissions: ['ManageChannels'],
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('قفل القناة الحالية')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const channel = msgOrInt.channel;
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: false });
    const embed = new EmbedBuilder().setColor('#FF4444').setDescription('🔒 تم قفل القناة!');
    isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  },
};

const unlock = {
  name: 'unlock',
  aliases: ['فتح'],
  userPermissions: ['ManageChannels'],
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('فتح القناة الحالية')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const channel = msgOrInt.channel;
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: null });
    const embed = new EmbedBuilder().setColor('#00D26A').setDescription('🔓 تم فتح القناة!');
    isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  },
};

// Export all moderation commands
module.exports = { ban, kick, mute, warn, purge, lock, unlock };

// Since the handler expects one command per file, we export all but also make them loadable
// The handler will use the `name` property to register them
// We export the main object and also attach all commands as named exports for multi-command files

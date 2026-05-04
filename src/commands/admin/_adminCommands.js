const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, ChannelType } = require('discord.js');
const { getGuild } = require('../../database/models');
const { createTicketPanel } = require('../../systems/tickets/ticketSystem');
const { startGiveaway } = require('../../systems/giveaway/giveawaySystem');
const ms = require('ms');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const setup = {
  name: 'setup',
  aliases: ['إعداد'],
  description: 'إعداد البوت',
  userPermissions: ['Administrator'],
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('إعداد إعدادات البوت')
    .addSubcommand(sub => sub.setName('welcome').setDescription('إعداد قناة الترحيب')
      .addChannelOption(o => o.setName('channel').setDescription('القناة').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addStringOption(o => o.setName('message').setDescription('رسالة الترحيب').setRequired(false))
    )
    .addSubcommand(sub => sub.setName('leave').setDescription('إعداد قناة الوداع')
      .addChannelOption(o => o.setName('channel').setDescription('القناة').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub => sub.setName('logs').setDescription('إعداد قناة السجلات')
      .addChannelOption(o => o.setName('channel').setDescription('القناة').setRequired(true).addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub => sub.setName('prefix').setDescription('تغيير البريفكس')
      .addStringOption(o => o.setName('prefix').setDescription('البريفكس الجديد').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('autorole').setDescription('إعداد رتبة تلقائية')
      .addRoleOption(o => o.setName('role').setDescription('الرتبة').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(msgOrInt, args, client, guildConfig) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const guild = isSlash ? msgOrInt.guild : msgOrInt.guild;
    
    let config;
    try { config = await getGuild(guild.id); } catch { return msgOrInt.reply({ content: '❌ خطأ في قاعدة البيانات!', ephemeral: true }); }

    if (isSlash) {
      const sub = msgOrInt.options.getSubcommand();

      if (sub === 'welcome') {
        const channel = msgOrInt.options.getChannel('channel');
        const message = msgOrInt.options.getString('message');
        config.welcomeChannel = channel.id;
        if (message) config.welcomeMessage = message;
        await config.save();
        return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#00D26A').setDescription(`✅ تم تعيين قناة الترحيب: ${channel}`)], ephemeral: true });
      }

      if (sub === 'leave') {
        const channel = msgOrInt.options.getChannel('channel');
        config.leaveChannel = channel.id;
        await config.save();
        return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#00D26A').setDescription(`✅ تم تعيين قناة الوداع: ${channel}`)], ephemeral: true });
      }

      if (sub === 'logs') {
        const channel = msgOrInt.options.getChannel('channel');
        config.logChannel = channel.id;
        await config.save();
        return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#00D26A').setDescription(`✅ تم تعيين قناة السجلات: ${channel}`)], ephemeral: true });
      }

      if (sub === 'prefix') {
        const newPrefix = msgOrInt.options.getString('prefix');
        config.prefix = newPrefix;
        await config.save();
        return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#00D26A').setDescription(`✅ تم تغيير البريفكس إلى: \`${newPrefix}\``)], ephemeral: true });
      }

      if (sub === 'autorole') {
        const role = msgOrInt.options.getRole('role');
        if (!config.autoRoles) config.autoRoles = [];
        if (!config.autoRoles.includes(role.id)) {
          config.autoRoles.push(role.id);
          await config.save();
        }
        return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#00D26A').setDescription(`✅ تمت إضافة ${role} كرتبة تلقائية`)], ephemeral: true });
      }
    } else {
      // Prefix usage: !setup prefix !
      const subCmd = args[0];
      if (subCmd === 'prefix' && args[1]) {
        config.prefix = args[1];
        await config.save();
        return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#00D26A').setDescription(`✅ البريفكس الجديد: \`${args[1]}\``)] });
      }
      return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setDescription('استخدم `/setup` للإعداد الكامل!')] });
    }
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GIVEAWAY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const giveaway = {
  name: 'giveaway',
  aliases: ['هدية', 'gw'],
  description: 'بدء هدية',
  userPermissions: ['ManageGuild'],
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('إدارة الهدايا')
    .addSubcommand(sub => sub.setName('start').setDescription('بدء هدية جديدة')
      .addStringOption(o => o.setName('prize').setDescription('الجائزة').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('المدة (مثال: 1h, 1d, 30m)').setRequired(true))
      .addIntegerOption(o => o.setName('winners').setDescription('عدد الفائزين').setRequired(false).setMinValue(1).setMaxValue(10))
      .addChannelOption(o => o.setName('channel').setDescription('القناة').setRequired(false))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();

    if (isSlash) {
      const sub = msgOrInt.options.getSubcommand();
      
      if (sub === 'start') {
        const prize = msgOrInt.options.getString('prize');
        const durationStr = msgOrInt.options.getString('duration');
        const winners = msgOrInt.options.getInteger('winners') || 1;
        const channel = msgOrInt.options.getChannel('channel') || msgOrInt.channel;

        const duration = ms(durationStr);
        if (!duration) return msgOrInt.reply({ content: '❌ مدة غير صحيحة!', ephemeral: true });

        await msgOrInt.reply({ content: '✅ جاري إنشاء الهدية...', ephemeral: true });
        await startGiveaway(channel, { prize, winners, duration, hostId: msgOrInt.user.id });
      }
    } else {
      // !giveaway [duration] [winners] [prize]
      if (args.length < 3) return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ استخدام: `!giveaway 1h 1 الجائزة`')] });
      const duration = ms(args[0]);
      const winners = parseInt(args[1]) || 1;
      const prize = args.slice(2).join(' ');
      if (!duration) return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ مدة غير صحيحة!')] });
      await startGiveaway(msgOrInt.channel, { prize, winners, duration, hostId: msgOrInt.author.id });
      msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#00D26A').setDescription('✅ تم إنشاء الهدية!')] });
    }
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TICKET PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ticketpanel = {
  name: 'ticketpanel',
  aliases: ['ticket-panel', 'tp'],
  description: 'إرسال لوحة التذاكر',
  userPermissions: ['Administrator'],
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('إرسال لوحة التذاكر في القناة الحالية')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(msgOrInt, args, client, guildConfig) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const channel = isSlash ? msgOrInt.channel : msgOrInt.channel;
    
    let config;
    try { config = await getGuild(channel.guild.id); } catch { config = {}; }
    
    await createTicketPanel(channel, config);
    isSlash 
      ? msgOrInt.reply({ content: '✅ تم إرسال لوحة التذاكر!', ephemeral: true })
      : msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#00D26A').setDescription('✅ تم إرسال لوحة التذاكر!')] });
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ANNOUNCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const announce = {
  name: 'announce',
  aliases: ['إعلان', 'ann'],
  description: 'إرسال إعلان',
  userPermissions: ['ManageGuild'],
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('إرسال إعلان')
    .addStringOption(o => o.setName('message').setDescription('نص الإعلان').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('القناة').setRequired(false))
    .addStringOption(o => o.setName('ping').setDescription('منشن (مثال: @everyone)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    
    if (isSlash) {
      const message = msgOrInt.options.getString('message');
      const channel = msgOrInt.options.getChannel('channel') || msgOrInt.channel;
      const ping = msgOrInt.options.getString('ping') || '';

      const embed = new EmbedBuilder()
        .setColor(process.env.EMBED_COLOR || '#7B2FBE')
        .setTitle('📢 إعلان')
        .setDescription(message)
        .setFooter({ text: `بواسطة ${msgOrInt.user.tag}`, iconURL: msgOrInt.user.displayAvatarURL() })
        .setTimestamp();

      await channel.send({ content: ping, embeds: [embed] });
      await msgOrInt.reply({ content: `✅ تم إرسال الإعلان في ${channel}!`, ephemeral: true });
    } else {
      if (!args.length) return msgOrInt.reply({ embeds: [new EmbedBuilder().setColor('#FF4444').setDescription('❌ اكتب نص الإعلان!')] });
      const embed = new EmbedBuilder()
        .setColor(process.env.EMBED_COLOR || '#7B2FBE')
        .setTitle('📢 إعلان')
        .setDescription(args.join(' '))
        .setFooter({ text: `بواسطة ${msgOrInt.author.tag}` })
        .setTimestamp();
      await msgOrInt.channel.send({ embeds: [embed] });
      msgOrInt.delete().catch(() => {});
    }
  },
};

module.exports = { setup, giveaway, ticketpanel, announce };

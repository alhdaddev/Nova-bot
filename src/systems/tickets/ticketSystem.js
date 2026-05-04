const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
} = require('discord.js');
const { Ticket, getGuild } = require('../../database/models');
const logger = require('../../utils/logger');

// Create ticket panel
async function createTicketPanel(channel, guildConfig) {
  const embed = new EmbedBuilder()
    .setColor(process.env.EMBED_COLOR || '#7B2FBE')
    .setTitle('🎫 نظام التذاكر | Nova Community')
    .setDescription([
      '**مرحباً بك في نظام الدعم!**',
      '',
      '> افتح تذكرة للحصول على المساعدة من فريق الإدارة',
      '> سيتم الرد عليك في أقرب وقت ممكن',
      '',
      '**📋 أنواع الدعم:**',
      '🔴 `دعم عام` - مشاكل عامة',
      '🔵 `شكاوى` - الإبلاغ عن مشكلة',
      '🟢 `اقتراحات` - اقتراح تحسينات',
      '🟡 `شراكة` - طلب شراكة',
    ].join('\n'))
    .setFooter({ text: 'Nova Community Bot | نـوفـا كوميونتي' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_create')
      .setLabel('فتح تذكرة')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// Handle button interactions
async function handleButton(interaction, client) {
  const { customId } = interaction;

  if (customId === 'ticket_create') {
    await showSubjectMenu(interaction);
  } else if (customId === 'ticket_close') {
    await closeTicket(interaction, client);
  } else if (customId === 'ticket_delete') {
    await deleteTicket(interaction, client);
  } else if (customId === 'ticket_claim') {
    await claimTicket(interaction, client);
  } else if (customId === 'ticket_transcript') {
    await createTranscript(interaction, client);
  }
}

// Show subject selection menu
async function showSubjectMenu(interaction) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_subject')
    .setPlaceholder('اختر نوع الدعم')
    .addOptions([
      { label: 'دعم عام', description: 'مشكلة عامة', value: 'general', emoji: '🔴' },
      { label: 'شكوى', description: 'الإبلاغ عن مشكلة', value: 'report', emoji: '🔵' },
      { label: 'اقتراح', description: 'اقتراح تحسين', value: 'suggestion', emoji: '🟢' },
      { label: 'شراكة', description: 'طلب شراكة', value: 'partnership', emoji: '🟡' },
    ]);

  const row = new ActionRowBuilder().addComponents(menu);
  await interaction.reply({ 
    content: '**اختر نوع التذكرة:**', 
    components: [row], 
    ephemeral: true 
  });
}

// Handle subject selection
async function handleSubjectSelect(interaction, client) {
  const subject = interaction.values[0];
  const subjects = {
    general: 'دعم عام',
    report: 'شكوى',
    suggestion: 'اقتراح',
    partnership: 'شراكة',
  };

  await interaction.update({ content: '⏳ جاري إنشاء التذكرة...', components: [] });

  try {
    // Check if user already has open ticket
    const existingTicket = await Ticket.findOne({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      status: 'open',
    });

    if (existingTicket) {
      return interaction.editReply({
        content: `❌ لديك تذكرة مفتوحة بالفعل! <#${existingTicket.channelId}>`,
      });
    }

    const guildConfig = await getGuild(interaction.guild.id);
    const ticketCount = await Ticket.countDocuments({ guildId: interaction.guild.id });
    const ticketId = `ticket-${String(ticketCount + 1).padStart(4, '0')}`;

    // Create channel
    const categoryId = guildConfig.ticketCategory || null;
    const channel = await interaction.guild.channels.create({
      name: ticketId,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          id: interaction.guild.roles.cache.find(r => r.permissions.has(PermissionFlagsBits.ManageMessages))?.id || interaction.guild.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
      ],
      topic: `تذكرة ${interaction.user.tag} | ${subjects[subject]}`,
    });

    // Save to DB
    const ticket = new Ticket({
      ticketId,
      guildId: interaction.guild.id,
      channelId: channel.id,
      userId: interaction.user.id,
      subject: subjects[subject],
    });
    await ticket.save();

    // Send ticket embed
    const embed = new EmbedBuilder()
      .setColor(process.env.EMBED_COLOR || '#7B2FBE')
      .setTitle(`🎫 ${ticketId} - ${subjects[subject]}`)
      .setDescription([
        `**مرحباً ${interaction.user}!**`,
        '',
        guildConfig.ticketMessage || 'الرجاء شرح مشكلتك بالتفصيل وسيتم مساعدتك قريباً.',
        '',
        `📋 **الموضوع:** ${subjects[subject]}`,
        `👤 **المستخدم:** ${interaction.user.tag}`,
        `📅 **التاريخ:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Nova Community | نظام التذاكر' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_claim').setLabel('استلام').setEmoji('✋').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ticket_close').setLabel('إغلاق').setEmoji('🔒').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_transcript').setLabel('نسخ المحادثة').setEmoji('📄').setStyle(ButtonStyle.Secondary),
    );

    await channel.send({
      content: `${interaction.user} | <@&${interaction.guild.roles.cache.find(r => r.name === 'Admin' || r.name === 'إدارة')?.id || ''}>`,
      embeds: [embed],
      components: [buttons],
    });

    await interaction.editReply({ content: `✅ تم إنشاء تذكرتك! ${channel}` });

  } catch (error) {
    logger.error('Error creating ticket:', error);
    await interaction.editReply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة!' });
  }
}

// Close ticket
async function closeTicket(interaction, client) {
  await interaction.deferReply();

  try {
    const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: 'open' });
    if (!ticket) return interaction.editReply({ content: '❌ هذه ليست قناة تذكرة مفتوحة!' });

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await ticket.save();

    const embed = new EmbedBuilder()
      .setColor('#FF4444')
      .setTitle('🔒 تم إغلاق التذكرة')
      .setDescription(`تم إغلاق التذكرة بواسطة ${interaction.user}`)
      .setTimestamp();

    const deleteBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_delete').setLabel('حذف القناة').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );

    await interaction.channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: false,
    });

    await interaction.editReply({ embeds: [embed], components: [deleteBtn] });

  } catch (error) {
    logger.error('Error closing ticket:', error);
    await interaction.editReply({ content: '❌ حدث خطأ!' });
  }
}

// Delete ticket
async function deleteTicket(interaction, client) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: '❌ ليس لديك صلاحية لحذف التذكرة!', ephemeral: true });
  }

  await interaction.reply({ content: '🗑️ جاري حذف القناة...' });
  
  await Ticket.findOneAndUpdate({ channelId: interaction.channel.id }, { status: 'deleted' });
  
  setTimeout(() => {
    interaction.channel.delete().catch(() => {});
  }, 3000);
}

// Claim ticket
async function claimTicket(interaction, client) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: '❌ ليس لديك صلاحية لاستلام التذكرة!', ephemeral: true });
  }

  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) return interaction.reply({ content: '❌ لم يتم العثور على التذكرة!', ephemeral: true });

  if (ticket.claimedBy) {
    return interaction.reply({ content: `❌ هذه التذكرة تم استلامها مسبقاً بواسطة <@${ticket.claimedBy}>!`, ephemeral: true });
  }

  ticket.claimedBy = interaction.user.id;
  await ticket.save();

  const embed = new EmbedBuilder()
    .setColor('#00D26A')
    .setDescription(`✋ تم استلام التذكرة بواسطة ${interaction.user}`);

  await interaction.reply({ embeds: [embed] });
}

// Create transcript
async function createTranscript(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const sortedMessages = [...messages.values()].reverse();

    const transcript = sortedMessages
      .filter(m => !m.author.bot)
      .map(m => `[${new Date(m.createdTimestamp).toLocaleString('ar')}] ${m.author.tag}: ${m.content}`)
      .join('\n');

    const buffer = Buffer.from(transcript, 'utf-8');
    const { AttachmentBuilder } = require('discord.js');
    const attachment = new AttachmentBuilder(buffer, { name: `${interaction.channel.name}-transcript.txt` });

    await interaction.editReply({
      content: '📄 تم إنشاء نسخة المحادثة:',
      files: [attachment],
    });

  } catch (error) {
    await interaction.editReply({ content: '❌ حدث خطأ أثناء إنشاء النسخة!' });
  }
}

module.exports = {
  createTicketPanel,
  handleButton,
  handleSubjectSelect,
  claimTicket,
  createTranscript,
};

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Giveaway } = require('../../database/models');
const logger = require('../../utils/logger');

// Start a giveaway
async function startGiveaway(channel, options) {
  const { prize, winners, duration, hostId } = options;
  const endsAt = new Date(Date.now() + duration);

  const embed = new EmbedBuilder()
    .setColor(process.env.EMBED_COLOR || '#7B2FBE')
    .setTitle(`🎉 ${prize}`)
    .setDescription([
      `**اضغط على الزر للمشاركة!**`,
      '',
      `👑 **الجوائز:** ${winners} فائز`,
      `⏰ **ينتهي:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>`,
      `🎯 **المشاركون:** 0`,
      '',
      `👤 **مُنظَّم بواسطة:** <@${hostId}>`,
    ].join('\n'))
    .setFooter({ text: 'Nova Community | نظام الهدايا' })
    .setTimestamp(endsAt);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_join')
      .setLabel('شارك! 🎉')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('giveaway_participants')
      .setLabel('المشاركون')
      .setStyle(ButtonStyle.Secondary),
  );

  const message = await channel.send({ embeds: [embed], components: [row] });

  // Save to DB
  const giveaway = new Giveaway({
    messageId: message.id,
    channelId: channel.id,
    guildId: channel.guild.id,
    hostId,
    prize,
    winners,
    endsAt,
  });
  await giveaway.save();

  // Schedule end
  setTimeout(() => endGiveaway(message.id, channel.client), duration);

  return message;
}

// End giveaway
async function endGiveaway(messageId, client) {
  try {
    const giveaway = await Giveaway.findOne({ messageId });
    if (!giveaway || giveaway.ended) return;

    giveaway.ended = true;

    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(messageId);

    if (giveaway.participants.length === 0) {
      giveaway.save();
      const embed = new EmbedBuilder()
        .setColor('#FF4444')
        .setTitle(`🎉 ${giveaway.prize}`)
        .setDescription('**لا يوجد فائز** - لم يشارك أحد!')
        .setFooter({ text: 'Nova Community | انتهت الهدية' });

      return message.edit({ embeds: [embed], components: [] });
    }

    // Pick winners
    const shuffled = [...giveaway.participants].sort(() => Math.random() - 0.5);
    const winnerIds = shuffled.slice(0, giveaway.winners);
    giveaway.winnerIds = winnerIds;
    await giveaway.save();

    const winnersText = winnerIds.map(id => `<@${id}>`).join(', ');

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`🎉 ${giveaway.prize} - انتهت!`)
      .setDescription([
        `**🏆 الفائزون:** ${winnersText}`,
        '',
        `👥 **عدد المشاركين:** ${giveaway.participants.length}`,
        `👤 **مُنظَّم بواسطة:** <@${giveaway.hostId}>`,
      ].join('\n'))
      .setFooter({ text: 'Nova Community | انتهت الهدية' })
      .setTimestamp();

    await message.edit({ embeds: [embed], components: [] });
    await channel.send({
      content: `🎉 تهانينا ${winnersText}! فزتم بـ **${giveaway.prize}**!`,
    });

  } catch (error) {
    logger.error('Error ending giveaway:', error);
  }
}

// Handle giveaway button
async function handleGiveawayButton(interaction, client) {
  if (interaction.customId === 'giveaway_join') {
    const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });
    if (!giveaway || giveaway.ended) {
      return interaction.reply({ content: '❌ هذه الهدية انتهت!', ephemeral: true });
    }

    if (giveaway.participants.includes(interaction.user.id)) {
      // Remove from giveaway
      giveaway.participants = giveaway.participants.filter(id => id !== interaction.user.id);
      await giveaway.save();
      await updateGiveawayEmbed(interaction.message, giveaway);
      return interaction.reply({ content: '✅ تم إلغاء مشاركتك في الهدية!', ephemeral: true });
    }

    giveaway.participants.push(interaction.user.id);
    await giveaway.save();
    await updateGiveawayEmbed(interaction.message, giveaway);
    return interaction.reply({ content: '🎉 تم تسجيلك في الهدية! حظاً موفقاً!', ephemeral: true });
  }

  if (interaction.customId === 'giveaway_participants') {
    const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });
    if (!giveaway) return interaction.reply({ content: '❌ الهدية غير موجودة!', ephemeral: true });

    const count = giveaway.participants.length;
    return interaction.reply({
      content: `👥 عدد المشاركين: **${count}**`,
      ephemeral: true,
    });
  }
}

async function updateGiveawayEmbed(message, giveaway) {
  try {
    const embed = EmbedBuilder.from(message.embeds[0]);
    const desc = embed.data.description.replace(/🎯 \*\*المشاركون:\*\* \d+/, `🎯 **المشاركون:** ${giveaway.participants.length}`);
    embed.setDescription(desc);
    await message.edit({ embeds: [embed] });
  } catch {}
}

module.exports = { startGiveaway, endGiveaway, handleGiveawayButton };

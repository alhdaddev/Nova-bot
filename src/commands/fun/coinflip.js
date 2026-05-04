const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
module.exports = {
  name: 'coinflip', aliases: ['عملة'], cooldown: 3,
  data: new SlashCommandBuilder().setName('coinflip').setDescription('رمي عملة'),
  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const result = Math.random() < 0.5 ? '🦅 صورة' : '👑 كتابة';
    const embed = new EmbedBuilder().setColor('#FFD700').setTitle('🪙 رمي عملة!').setDescription(`النتيجة: **${result}**`);
    isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  }
};

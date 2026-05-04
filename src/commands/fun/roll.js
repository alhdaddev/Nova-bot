const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
module.exports = {
  name: 'roll', aliases: ['نرد'], cooldown: 3,
  data: new SlashCommandBuilder().setName('roll').setDescription('رمي نرد').addIntegerOption(o=>o.setName('max').setDescription('أكبر رقم').setRequired(false)),
  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const max = isSlash ? (msgOrInt.options.getInteger('max')||6) : (parseInt(args[0])||6);
    const result = Math.floor(Math.random() * max) + 1;
    const embed = new EmbedBuilder().setColor('#00D26A').setTitle('🎲 رمي النرد!').setDescription(`النتيجة: **${result}** (1-${max})`);
    isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  }
};

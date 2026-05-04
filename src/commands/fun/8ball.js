const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const answers = ['نعم بالتأكيد! ✅','لا أعتقد ذلك ❌','ربما 🤔','بالتأكيد لا! ❌','نعم! ✅','لست متأكداً 🤷','الأمور تبدو جيدة ✨','لا تعتمد عليه ❌'];
module.exports = {
  name: '8ball', cooldown: 3,
  data: new SlashCommandBuilder().setName('8ball').setDescription('الكرة السحرية').addStringOption(o=>o.setName('question').setDescription('سؤالك').setRequired(true)),
  async execute(msgOrInt, args, client) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    const q = isSlash ? msgOrInt.options.getString('question') : args.join(' ');
    const ans = answers[Math.floor(Math.random() * answers.length)];
    const embed = new EmbedBuilder().setColor('#7B2FBE').setTitle('🎱 الكرة السحرية').addFields({name:'❓ السؤال',value:q||'؟'},{name:'🎱 الجواب',value:ans});
    isSlash ? msgOrInt.reply({ embeds: [embed] }) : msgOrInt.reply({ embeds: [embed] });
  }
};

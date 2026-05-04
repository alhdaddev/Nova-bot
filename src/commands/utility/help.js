const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder } = require('discord.js');

const categories = {
  moderation: { name: 'الإشراف', emoji: '🛡️', color: '#FF4444' },
  admin: { name: 'الإدارة', emoji: '⚙️', color: '#FFB800' },
  fun: { name: 'الترفيه', emoji: '🎮', color: '#00D26A' },
  utility: { name: 'الأدوات', emoji: '🔧', color: '#5865F2' },
  info: { name: 'المعلومات', emoji: '📊', color: '#7B2FBE' },
  music: { name: 'الموسيقى', emoji: '🎵', color: '#00B0D7' },
};

const commandsList = {
  moderation: [
    { name: 'ban', desc: 'حظر عضو من السيرفر' },
    { name: 'kick', desc: 'طرد عضو من السيرفر' },
    { name: 'mute', desc: 'كتم عضو مؤقتاً' },
    { name: 'unmute', desc: 'رفع الكتم عن عضو' },
    { name: 'warn', desc: 'تحذير عضو' },
    { name: 'warnings', desc: 'عرض تحذيرات عضو' },
    { name: 'clearwarn', desc: 'حذف تحذيرات عضو' },
    { name: 'slowmode', desc: 'تفعيل الوضع البطيء' },
    { name: 'purge', desc: 'حذف رسائل متعددة' },
    { name: 'lock', desc: 'قفل قناة' },
    { name: 'unlock', desc: 'فتح قناة' },
  ],
  admin: [
    { name: 'setup', desc: 'إعداد البوت' },
    { name: 'prefix', desc: 'تغيير البريفكس' },
    { name: 'setwelcome', desc: 'إعداد رسالة الترحيب' },
    { name: 'setleave', desc: 'إعداد رسالة الوداع' },
    { name: 'autorole', desc: 'إعداد الرتبة التلقائية' },
    { name: 'levelrole', desc: 'إعداد رتب المستويات' },
    { name: 'ticket', desc: 'إعداد نظام التذاكر' },
    { name: 'giveaway', desc: 'بدء هدية' },
    { name: 'announce', desc: 'إرسال إعلان' },
    { name: 'embed', desc: 'إنشاء إيمبد مخصص' },
  ],
  fun: [
    { name: 'meme', desc: 'صورة ميم عشوائية' },
    { name: 'joke', desc: 'نكتة عشوائية' },
    { name: 'coinflip', desc: 'رمي عملة' },
    { name: 'roll', desc: 'رمي نرد' },
    { name: '8ball', desc: 'سؤال الكرة السحرية' },
    { name: 'hug', desc: 'عناق شخص' },
    { name: 'slap', desc: 'صفعة لشخص' },
    { name: 'battle', desc: 'معركة بين شخصين' },
  ],
  utility: [
    { name: 'ping', desc: 'سرعة استجابة البوت' },
    { name: 'uptime', desc: 'مدة تشغيل البوت' },
    { name: 'remind', desc: 'ضبط تذكير' },
    { name: 'translate', desc: 'ترجمة نص' },
    { name: 'poll', desc: 'إنشاء استطلاع' },
    { name: 'afk', desc: 'تفعيل وضع AFK' },
    { name: 'snipe', desc: 'عرض آخر رسالة محذوفة' },
  ],
  info: [
    { name: 'userinfo', desc: 'معلومات عضو' },
    { name: 'serverinfo', desc: 'معلومات السيرفر' },
    { name: 'roleinfo', desc: 'معلومات رتبة' },
    { name: 'avatar', desc: 'صورة عضو' },
    { name: 'rank', desc: 'مستواك في السيرفر' },
    { name: 'leaderboard', desc: 'لوحة المتصدرين' },
    { name: 'stats', desc: 'إحصائيات السيرفر' },
    { name: 'botinfo', desc: 'معلومات البوت' },
  ],
  music: [
    { name: 'play', desc: 'تشغيل موسيقى' },
    { name: 'skip', desc: 'تخطي الأغنية' },
    { name: 'stop', desc: 'إيقاف الموسيقى' },
    { name: 'queue', desc: 'قائمة الأغاني' },
    { name: 'volume', desc: 'تغيير الصوت' },
    { name: 'pause', desc: 'إيقاف مؤقت' },
    { name: 'resume', desc: 'استئناف التشغيل' },
  ],
};

function buildMainEmbed(prefix, client) {
  return new EmbedBuilder()
    .setColor(process.env.EMBED_COLOR || '#7B2FBE')
    .setAuthor({ name: 'Nova Community Bot', iconURL: client.user.displayAvatarURL() })
    .setTitle('🌟 قائمة الأوامر')
    .setDescription([
      `> مرحباً! أنا بوت **نـوفـا كوميونتي** المتكامل`,
      `> البريفكس: \`${prefix}\` | السلاش: \`/\``,
      '',
      Object.entries(categories).map(([key, cat]) => 
        `${cat.emoji} **${cat.name}** — \`${commandsList[key]?.length || 0}\` أمر`
      ).join('\n'),
      '',
      '> اختر فئة من القائمة أدناه لعرض أوامرها',
    ].join('\n'))
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: `Nova Community | ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} عضو`, iconURL: client.user.displayAvatarURL() })
    .setTimestamp();
}

function buildCategoryEmbed(categoryKey, prefix, client) {
  const cat = categories[categoryKey];
  const cmds = commandsList[categoryKey] || [];
  
  return new EmbedBuilder()
    .setColor(cat.color)
    .setTitle(`${cat.emoji} أوامر ${cat.name}`)
    .setDescription(cmds.map(c => `\`${prefix}${c.name}\` — ${c.desc}`).join('\n'))
    .setFooter({ text: `${cmds.length} أمر في هذه الفئة` });
}

module.exports = {
  name: 'help',
  aliases: ['h', 'commands', 'أوامر'],
  description: 'عرض قائمة الأوامر',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('عرض قائمة أوامر البوت')
    .addStringOption(opt =>
      opt.setName('category').setDescription('الفئة').setRequired(false)
        .addChoices(
          { name: 'الإشراف', value: 'moderation' },
          { name: 'الإدارة', value: 'admin' },
          { name: 'الترفيه', value: 'fun' },
          { name: 'الأدوات', value: 'utility' },
          { name: 'المعلومات', value: 'info' },
          { name: 'الموسيقى', value: 'music' },
        )
    ),

  async execute(messageOrInteraction, args, client, guildConfig) {
    const isSlash = !messageOrInteraction.channel?.send || messageOrInteraction.isChatInputCommand?.();
    const prefix = guildConfig?.prefix || process.env.PREFIX || '!';

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('اختر فئة...')
      .addOptions(
        Object.entries(categories).map(([key, cat]) => ({
          label: cat.name,
          description: `${commandsList[key]?.length || 0} أمر`,
          value: key,
          emoji: cat.emoji,
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const embed = buildMainEmbed(prefix, client);

    if (isSlash) {
      const category = messageOrInteraction.options?.getString('category');
      if (category) {
        return messageOrInteraction.reply({ embeds: [buildCategoryEmbed(category, prefix, client)] });
      }
      await messageOrInteraction.reply({ embeds: [embed], components: [row] });
    } else {
      const category = args[0];
      if (category && categories[category]) {
        return messageOrInteraction.reply({ embeds: [buildCategoryEmbed(category, prefix, client)] });
      }
      const sent = await messageOrInteraction.reply({ embeds: [embed], components: [row] });

      // Handle select menu
      const collector = sent.createMessageComponentCollector({ time: 60000 });
      collector.on('collect', async i => {
        if (i.user.id !== messageOrInteraction.author.id) {
          return i.reply({ content: '❌ هذه القائمة ليست لك!', ephemeral: true });
        }
        const cat = i.values[0];
        await i.update({ embeds: [buildCategoryEmbed(cat, prefix, client)], components: [row] });
      });
      collector.on('end', () => sent.edit({ components: [] }).catch(() => {}));
    }
  },
};

# 🌟 Nova Community Bot v2.0

بوت ديسكورد متكامل واحترافي لسيرفر **نـوفـا كوميونتي | Nova Community**

---

## ✨ المميزات

| الميزة | الوصف |
|--------|--------|
| 🛡️ نظام إشراف | Ban, Kick, Mute, Warn, Purge, Lock/Unlock مع سجل حالات |
| ⭐ نظام مستويات | XP تلقائي، ترقية مستوى، رتب مستويات، لوحة متصدرين |
| 🎫 نظام تذاكر | تذاكر تفاعلية، استلام، إغلاق، نسخ محادثة |
| 🎉 نظام هدايا | هدايا بأزرار، فائزون عشوائيون، تجديد الهدية |
| 👋 ترحيب / وداع | رسائل مخصصة، رتب تلقائية عند الانضمام |
| 🤖 Automod | حماية من السبام، روابط الدعوة، رسائل متكررة |
| 🌐 Dashboard | لوحة تحكم ويب كاملة بتسجيل دخول Discord |
| ⚡ Slash + Prefix | يدعم أوامر السلاش `/` والبريفكس `!` |

---

## 🚀 التثبيت المحلي

### المتطلبات
- Node.js v18+
- MongoDB (Atlas أو محلي)
- بوت Discord

### الخطوات

```bash
# 1. استنساخ المشروع
git clone https://github.com/your-repo/nova-bot.git
cd nova-bot

# 2. تثبيت المكتبات
npm install

# 3. إعداد البيئة
cp .env.example .env
# عدّل ملف .env بقيمك

# 4. نشر أوامر السلاش
npm run deploy-commands

# 5. تشغيل البوت
npm start
```

---

## ⚙️ ملف .env

```env
DISCORD_TOKEN=        # توكن البوت من Discord Developer Portal
CLIENT_ID=            # ID التطبيق
CLIENT_SECRET=        # سيكريت التطبيق (للداشبورد)
GUILD_ID=             # ID السيرفر (للتطوير السريع)
OWNER_ID=             # Discord ID الخاص بك

MONGODB_URI=          # رابط MongoDB Atlas

DASHBOARD_URL=http://localhost:3000
SESSION_SECRET=       # كلمة سرية عشوائية
```

---

## 🚂 الرفع على Railway

### الخطوات:

1. **أنشئ مشروعاً جديداً** على [railway.app](https://railway.app)

2. **اربط GitHub** أو ارفع الملفات مباشرة

3. **أضف المتغيرات** في Settings → Variables:
   ```
   DISCORD_TOKEN
   CLIENT_ID
   CLIENT_SECRET
   GUILD_ID
   OWNER_ID
   MONGODB_URI
   SESSION_SECRET
   DASHBOARD_URL=https://your-app.railway.app
   ```

4. **Railway سيشغل** `node src/index.js` تلقائياً

5. **أضف Domain** في Settings → Networking لتشغيل الداشبورد

6. **في Discord Developer Portal**:
   - أضف Redirect URI: `https://your-app.railway.app/auth/callback`

---

## 📋 الأوامر

### 🛡️ الإشراف
| الأمر | الوصف |
|-------|--------|
| `!ban @عضو [سبب]` | حظر عضو |
| `!kick @عضو [سبب]` | طرد عضو |
| `!mute @عضو 10m [سبب]` | كتم عضو |
| `!warn @عضو [سبب]` | تحذير عضو |
| `!purge 10` | حذف 10 رسائل |
| `!lock / !unlock` | قفل/فتح قناة |

### ⭐ المستويات
| الأمر | الوصف |
|-------|--------|
| `!rank` | عرض مستواك |
| `!leaderboard` | لوحة المتصدرين |

### ⚙️ الإدارة
| الأمر | الوصف |
|-------|--------|
| `/setup welcome #قناة` | إعداد ترحيب |
| `/setup prefix !` | تغيير البريفكس |
| `/ticketpanel` | إرسال لوحة التذاكر |
| `/giveaway start [جائزة] [مدة] [فائزين]` | بدء هدية |
| `/announce [نص]` | إعلان |

### 📊 المعلومات
| الأمر | الوصف |
|-------|--------|
| `!userinfo @عضو` | معلومات عضو |
| `!serverinfo` | معلومات السيرفر |
| `!avatar @عضو` | صورة عضو |
| `!ping` | سرعة البوت |

---

## 🌐 لوحة التحكم

افتح المتصفح على `http://localhost:3000` (أو رابط Railway) للوصول إلى:

- 📊 إحصائيات السيرفر الحية
- ⚙️ تعديل كل الإعدادات (بريفكس، قنوات، رسائل)
- 🛡️ ضبط نظام الإشراف والـ Automod
- ⭐ إعداد نظام المستويات
- 🏆 عرض لوحة المتصدرين

---

## 📁 هيكل المشروع

```
nova-bot/
├── src/
│   ├── commands/
│   │   ├── admin/       ← أوامر الإدارة
│   │   ├── moderation/  ← أوامر الإشراف
│   │   ├── info/        ← أوامر المعلومات
│   │   ├── fun/         ← أوامر الترفيه
│   │   └── utility/     ← أوامر الأدوات
│   ├── events/          ← أحداث Discord
│   ├── systems/
│   │   ├── leveling/    ← نظام XP
│   │   ├── tickets/     ← نظام تذاكر
│   │   ├── giveaway/    ← نظام هدايا
│   │   └── moderation/  ← Automod
│   ├── database/        ← MongoDB models
│   ├── handlers/        ← command/event loaders
│   ├── utils/           ← logger وأدوات مساعدة
│   └── index.js         ← نقطة البداية
├── dashboard/
│   ├── server.js        ← Express server
│   ├── views/           ← EJS templates
│   └── public/          ← CSS, JS, Images
├── .env.example
├── railway.json
├── nixpacks.toml
└── package.json
```

---

## 🔧 إضافة أوامر جديدة

```js
// src/commands/category/myCommand.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'mycommand',          // اسم أمر البريفكس
  aliases: ['mc'],            // اختصارات
  description: 'وصف الأمر',
  cooldown: 5,                // ثواني
  userPermissions: [],        // صلاحيات مطلوبة
  
  // Slash Command
  data: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('وصف الأمر'),

  async execute(msgOrInt, args, client, guildConfig) {
    const isSlash = msgOrInt.isChatInputCommand?.();
    // ... منطق الأمر
    isSlash ? msgOrInt.reply('مرحبا!') : msgOrInt.reply('مرحبا!');
  }
};
```

ثم شغّل: `npm run deploy-commands`

---

صُنع بـ ❤️ لـ **نـوفـا كوميونتي | Nova Community**

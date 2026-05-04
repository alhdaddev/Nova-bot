const mongoose = require('mongoose');
const { Schema } = mongoose;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  User / Member Model
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const userSchema = new Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  // Leveling
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 },
  // Economy
  coins: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  // Moderation
  warnings: [{
    reason: String,
    moderator: String,
    date: { type: Date, default: Date.now },
    id: String,
  }],
  muted: { type: Boolean, default: false },
  muteExpires: { type: Date, default: null },
  // Stats
  messages: { type: Number, default: 0 },
  voiceTime: { type: Number, default: 0 },
  // Daily
  lastDaily: { type: Date, default: null },
  dailyStreak: { type: Number, default: 0 },
  // Other
  bio: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Guild Config Model
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const guildSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  language: { type: String, default: 'ar' },
  // Channels
  welcomeChannel: { type: String, default: null },
  leaveChannel: { type: String, default: null },
  logChannel: { type: String, default: null },
  ticketLogChannel: { type: String, default: null },
  levelUpChannel: { type: String, default: null },
  // Roles
  mutedRole: { type: String, default: null },
  verifiedRole: { type: String, default: null },
  autoRoles: [String],
  levelRoles: [{
    level: Number,
    roleId: String,
  }],
  // Features
  leveling: { type: Boolean, default: true },
  welcomeMsg: { type: Boolean, default: true },
  leaveMsg: { type: Boolean, default: true },
  automod: { type: Boolean, default: false },
  antiSpam: { type: Boolean, default: false },
  antiLinks: { type: Boolean, default: false },
  antiRaid: { type: Boolean, default: false },
  // Welcome/Leave Messages
  welcomeMessage: { type: String, default: 'مرحباً {user} في {server}! 🎉' },
  leaveMessage: { type: String, default: 'وداعاً {user}، نتمنى أن تعود قريباً!' },
  // Ticket
  ticketCategory: { type: String, default: null },
  ticketMessage: { type: String, default: 'مرحباً! الرجاء شرح مشكلتك وسيتم مساعدتك قريباً.' },
  // Moderation
  maxWarnings: { type: Number, default: 3 },
  warnAction: { type: String, default: 'kick' }, // kick, ban, mute
  // Stats
  totalMembers: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Ticket Model
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ticketSchema = new Schema({
  ticketId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  subject: { type: String, default: 'تذكرة دعم' },
  status: { type: String, default: 'open', enum: ['open', 'closed', 'deleted'] },
  claimedBy: { type: String, default: null },
  messages: [{
    author: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Case / Moderation Log Model  
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const caseSchema = new Schema({
  caseId: { type: Number, required: true },
  guildId: { type: String, required: true },
  type: { type: String, required: true }, // warn, mute, kick, ban, unban, unmute
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, default: 'لا يوجد سبب' },
  duration: { type: String, default: null },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Giveaway Model
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const giveawaySchema = new Schema({
  messageId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  hostId: { type: String, required: true },
  prize: { type: String, required: true },
  winners: { type: Number, default: 1 },
  participants: [String],
  ended: { type: Boolean, default: false },
  winnerIds: [String],
  endsAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Exports
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const User = mongoose.model('User', userSchema);
const Guild = mongoose.model('Guild', guildSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);
const Case = mongoose.model('Case', caseSchema);
const Giveaway = mongoose.model('Giveaway', giveawaySchema);

// Helper: get or create user
async function getUser(userId, guildId) {
  return await User.findOneAndUpdate(
    { userId, guildId },
    { $setOnInsert: { userId, guildId } },
    { upsert: true, new: true }
  );
}

// Helper: get or create guild config
async function getGuild(guildId) {
  return await Guild.findOneAndUpdate(
    { guildId },
    { $setOnInsert: { guildId } },
    { upsert: true, new: true }
  );
}

// Helper: get next case ID
async function getNextCaseId(guildId) {
  const lastCase = await Case.findOne({ guildId }).sort({ caseId: -1 });
  return lastCase ? lastCase.caseId + 1 : 1;
}

module.exports = { User, Guild, Ticket, Case, Giveaway, getUser, getGuild, getNextCaseId };

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const { getGuild, getUser } = require('../src/database/models');
const logger = require('../src/utils/logger');

const app = express();
let botClient = null;

// ─── Passport Setup ───────────────────────────────────
passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: `${process.env.DASHBOARD_URL}/auth/callback`,
  scope: ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ─── Middleware ───────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'nova-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 604800000 }, // 7 days
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── Auth Middleware ──────────────────────────────────
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (!req.isAuthenticated()) return res.redirect('/login');
  const guild = req.user.guilds?.find(g => g.id === req.params.guildId);
  if (!guild) return res.redirect('/dashboard');
  const hasAdmin = (BigInt(guild.permissions) & BigInt(0x8)) === BigInt(0x8);
  if (!hasAdmin) return res.status(403).render('error', { message: 'ليس لديك صلاحية إدارة هذا السيرفر', user: req.user });
  next();
}

// ─── Routes ───────────────────────────────────────────

// Home
app.get('/', (req, res) => {
  res.render('index', { 
    user: req.user,
    client: botClient,
    guildCount: botClient?.guilds.cache.size || 0,
    userCount: botClient?.guilds.cache.reduce((a, g) => a + g.memberCount, 0) || 0,
    commandCount: (botClient?.commands.size || 0) + (botClient?.slashCommands.size || 0),
  });
});

// Login
app.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  res.render('login', { user: null });
});

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/callback', passport.authenticate('discord', {
  failureRedirect: '/login',
}), (req, res) => res.redirect('/dashboard'));

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

// Dashboard - guild list
app.get('/dashboard', isAuthenticated, (req, res) => {
  const userGuilds = req.user.guilds || [];
  const managedGuilds = userGuilds.filter(g => (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8));
  const botGuilds = managedGuilds.map(g => ({
    ...g,
    hasBot: botClient?.guilds.cache.has(g.id),
    icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
  }));
  res.render('dashboard', { user: req.user, guilds: botGuilds });
});

// Guild Dashboard
app.get('/dashboard/:guildId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const guild = botClient?.guilds.cache.get(req.params.guildId);
    if (!guild) return res.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${req.params.guildId}`);
    
    const config = await getGuild(req.params.guildId);
    
    res.render('guild', {
      user: req.user,
      guild: {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
        channels: guild.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name })),
        roles: guild.roles.cache.filter(r => r.id !== guild.id).map(r => ({ id: r.id, name: r.name, color: r.hexColor })),
      },
      config,
    });
  } catch (e) {
    logger.error('Dashboard guild error:', e);
    res.render('error', { message: 'حدث خطأ', user: req.user });
  }
});

// Save guild config
app.post('/dashboard/:guildId/save', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const config = await getGuild(req.params.guildId);
    const { prefix, welcomeChannel, leaveChannel, logChannel, welcomeMessage, leaveMessage, leveling, automod, antiSpam, antiLinks, maxWarnings, warnAction } = req.body;
    
    if (prefix) config.prefix = prefix;
    if (welcomeChannel) config.welcomeChannel = welcomeChannel;
    if (leaveChannel) config.leaveChannel = leaveChannel;
    if (logChannel) config.logChannel = logChannel;
    if (welcomeMessage) config.welcomeMessage = welcomeMessage;
    if (leaveMessage) config.leaveMessage = leaveMessage;
    config.leveling = leveling === 'on';
    config.automod = automod === 'on';
    config.antiSpam = antiSpam === 'on';
    config.antiLinks = antiLinks === 'on';
    if (maxWarnings) config.maxWarnings = parseInt(maxWarnings);
    if (warnAction) config.warnAction = warnAction;
    
    await config.save();
    res.json({ success: true, message: 'تم الحفظ بنجاح!' });
  } catch (e) {
    res.json({ success: false, message: 'حدث خطأ أثناء الحفظ!' });
  }
});

// API Routes
app.get('/api/stats', (req, res) => {
  res.json({
    guilds: botClient?.guilds.cache.size || 0,
    users: botClient?.guilds.cache.reduce((a, g) => a + g.memberCount, 0) || 0,
    commands: (botClient?.commands.size || 0) + (botClient?.slashCommands.size || 0),
    ping: botClient?.ws.ping || 0,
    uptime: process.uptime(),
  });
});

app.get('/api/guild/:guildId/members', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { User } = require('../src/database/models');
    const topUsers = await User.find({ guildId: req.params.guildId })
      .sort({ totalXp: -1 }).limit(20).select('userId level totalXp messages');
    res.json({ success: true, data: topUsers });
  } catch (e) {
    res.json({ success: false, data: [] });
  }
});

// ─── Start Function ───────────────────────────────────
function startDashboard(client) {
  botClient = client;
  const port = process.env.PORT || process.env.DASHBOARD_PORT || 3000;
  app.listen(port, () => {
    logger.success(`Dashboard running at http://localhost:${port}`);
  });
}

module.exports = { startDashboard };

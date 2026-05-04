const chalk = require('chalk');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const fs = require('fs');
const path = require('path');

// Create logs directory
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

const winstonLogger = createLogger({
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    new transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
});

const logger = {
  info: (msg, ...args) => {
    console.log(chalk.hex('#5865F2')('[INFO]'), chalk.white(msg), ...args);
    winstonLogger.info(msg);
  },
  success: (msg, ...args) => {
    console.log(chalk.hex('#00D26A')('[SUCCESS]'), chalk.white(msg), ...args);
    winstonLogger.info(`SUCCESS: ${msg}`);
  },
  warn: (msg, ...args) => {
    console.log(chalk.hex('#FFB800')('[WARN]'), chalk.white(msg), ...args);
    winstonLogger.warn(msg);
  },
  error: (msg, ...args) => {
    console.log(chalk.hex('#FF4444')('[ERROR]'), chalk.white(msg), ...args);
    winstonLogger.error(msg);
  },
  debug: (msg, ...args) => {
    if (process.env.DEBUG === 'true') {
      console.log(chalk.hex('#7B2FBE')('[DEBUG]'), chalk.gray(msg), ...args);
    }
    winstonLogger.debug(msg);
  },
  command: (prefix, name, user, guild) => {
    console.log(
      chalk.hex('#7B2FBE')('[CMD]'),
      chalk.cyan(`${prefix}${name}`),
      chalk.gray('by'),
      chalk.yellow(user),
      chalk.gray('in'),
      chalk.green(guild)
    );
  },
};

module.exports = logger;

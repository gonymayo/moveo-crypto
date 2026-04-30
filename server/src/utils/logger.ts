import winston from 'winston';

const { combine, timestamp, colorize, printf, json } = winston.format;

// Human-readable format used in development terminals.
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    const extras = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${extras}`;
  }),
);

// Structured JSON format used in production (Render logs, Datadog, etc.).
const prodFormat = combine(timestamp(), json());

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
});

export default logger;

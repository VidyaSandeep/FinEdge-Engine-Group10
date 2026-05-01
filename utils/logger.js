import pino from 'pino';
import pretty from 'pino-pretty';
import { env } from '../config/env.js';

const stream =
    env.NODE_ENV === 'development' && process.stdout.isTTY
        ? pretty({
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        })
        : process.stdout;

export const logger = pino(
    {
        level: env.LOG_LEVEL,
    },
    stream
);
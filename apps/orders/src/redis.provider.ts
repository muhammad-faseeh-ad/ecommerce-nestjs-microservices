import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: (): Redis => {
    return new Redis({
      host: 'redis',
      port: 6379,
    });
  },
};

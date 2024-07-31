import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_MQ_URI],
        queue: 'auth-queue',
      },
    },
  );
  // const app = await NestFactory.create(ProductsModule);
  await app.listen();
}
bootstrap();

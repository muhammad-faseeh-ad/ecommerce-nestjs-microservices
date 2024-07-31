import { NestFactory } from '@nestjs/core';
import { OrdersModule } from './orders.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_MQ_URI],
        queue: 'orders-queue',
      },
    },
  );
  await app.listen();
}
bootstrap();

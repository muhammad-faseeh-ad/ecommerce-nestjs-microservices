import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ProductsModule } from './products.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductsModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_MQ_URI],
        queue: 'products-queue',
      },
    },
  );

  await app.listen();
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: { host: 'auth', port: 3002 },
    },
  );
  // const app = await NestFactory.create(ProductsModule);
  await app.listen();
}
bootstrap();

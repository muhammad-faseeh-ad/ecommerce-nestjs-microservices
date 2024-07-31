import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  ClientProviderOptions,
  ClientsModule,
  Transport,
} from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'shared/strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';

function createClientOptions(
  name: string,
  queue: string,
): ClientProviderOptions {
  return {
    name,
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBIT_MQ_URI],
      queue,
    },
  };
}

const microservicesClients = [
  createClientOptions('PRODUCTS', 'products-queue'),
  createClientOptions('AUTH', 'auth-queue'),
  createClientOptions('ORDERS', 'orders-queue'),
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: 3000 },
    }),
    ClientsModule.register(microservicesClients),
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}

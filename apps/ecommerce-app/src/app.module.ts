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
  host: string,
  port: number,
): ClientProviderOptions {
  return {
    name,
    transport: Transport.TCP,
    options: { host, port },
  };
}

const microservicesClients = [
  createClientOptions('PRODUCTS', 'product', 3001),
  createClientOptions('AUTH', 'auth', 3002),
  createClientOptions('ORDERS', 'orders', 3003),
];

@Module({
  imports: [
    ConfigModule.forRoot(),
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

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'shared/strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: 3000 },
    }),
    ClientsModule.register([
      {
        name: 'PRODUCTS',
        transport: Transport.TCP,
        options: { host: 'products', port: 3001 },
      },
      {
        name: 'AUTH',
        transport: Transport.TCP,
        options: { host: 'auth', port: 3002 },
      },
      {
        name: 'ORDERS',
        transport: Transport.TCP,
        options: { host: 'orders', port: 3003 },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}

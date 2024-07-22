import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'shared/strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: 'no secret',
      signOptions: { expiresIn: 3000 },
    }),
    ClientsModule.register([
      {
        name: 'PRODUCTS',
        transport: Transport.TCP,
        options: { port: 3001 },
      },
      {
        name: 'AUTH',
        transport: Transport.TCP,
        options: { port: 3002 },
      },
      {
        name: 'ORDERS',
        transport: Transport.TCP,
        options: { port: 3003 },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}

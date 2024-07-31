import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'shared/strategies/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { CartSchema } from './schemas/cart.schema';
import { ItemSchema } from './schemas/item.schema';
import { OrderSchema } from './schemas/order.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserSchema } from './schemas/user.schema';
import { ProductSchema } from './schemas/product.schema';
import { ConfigModule } from '@nestjs/config';
import { OrderRepository } from './order.repository';
import { RedisProvider } from './redis.provider';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'PRODUCTSMS',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_MQ_URI],
          queue: 'products-queue',
        },
      },
    ]),
    MongooseModule.forRoot(process.env.DB_URI),
    MongooseModule.forFeature([
      { name: 'Cart', schema: CartSchema },
      { name: 'Item', schema: ItemSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Product', schema: ProductSchema },
    ]),
    JwtModule.register({
      secret: 'no secret',
      signOptions: { expiresIn: 300 },
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, JwtStrategy, OrderRepository, RedisProvider],
})
export class OrdersModule {}

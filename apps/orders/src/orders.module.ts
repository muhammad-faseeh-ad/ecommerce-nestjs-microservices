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

const username = encodeURIComponent('fasseeh111');
const password = encodeURIComponent('1JeDAVbJzCvAKG2x');

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCTSMS',
        transport: Transport.TCP,
        options: { port: 3001 },
      },
    ]),
    MongooseModule.forRoot(
      `mongodb+srv://${username}:${password}@cluster0.p1gygz9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
    ),
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
  providers: [OrdersService, JwtStrategy],
})
export class OrdersModule {}

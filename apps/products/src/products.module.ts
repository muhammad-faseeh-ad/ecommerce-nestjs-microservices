import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSchema } from './schemas/product.schema';

const username = encodeURIComponent('fasseeh111');
const password = encodeURIComponent('1JeDAVbJzCvAKG2x');

@Module({
  imports: [
    MongooseModule.forRoot(
      `mongodb+srv://${username}:${password}@cluster0.p1gygz9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
    ),
    MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}

import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  Req,
  NotFoundException,
  Put,
  Get,
} from '@nestjs/common';
import { AppService } from './app.service';
import { CreateProductDto } from 'shared/dtos/create-product-dto';
import { FilterProductDto } from 'shared/dtos/filter-product-dto';
import { Observable } from 'rxjs';
import { CreateUserDto } from 'shared/dtos/create-user-dtos';
import { JwtAuthGuard } from 'shared/guards/jwt.guard';
import { ItemDto } from 'shared/dtos/item.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  //Auth
  @Post('auth/register')
  async register(@Body() createUserDTO: CreateUserDto) {
    return this.appService.register(createUserDTO);
  }

  @Post('auth/login')
  async login(
    @Body() { username, password },
  ): Promise<Observable<{ access_token: string }>> {
    const user = { username, password };
    return this.appService.login(user);
  }

  //@UseGuards(JwtAuthGuard)
  @Get('store/products')
  async getProds(
    @Query()
    filters: FilterProductDto,
  ): Promise<Observable<any[]>> {
    return this.appService.getProducts(filters);
  }

  @Post('store/products')
  async addProduct(
    @Body()
    product: CreateProductDto,
  ): Promise<Observable<any>> {
    return this.appService.addProduct(product);
  }

  @Get('store/products/:id')
  async getProductById(
    @Param('id')
    id: string,
  ): Promise<Observable<any>> {
    return this.appService.getProduct(id);
  }

  @Put('store/products/:id')
  async updateProductPut(
    @Body()
    product: Partial<CreateProductDto>,

    @Param('id')
    id: string,
  ): Promise<Observable<any>> {
    return this.appService.updateProduct(id, product);
  }

  @Patch('store/products/:id')
  async updateProduct(
    @Body()
    product: CreateProductDto,

    @Param('id')
    id: string,
  ): Promise<Observable<any>> {
    return this.appService.updateProduct(id, product);
  }

  @Delete('store/products/:id')
  async deleteProduct(
    @Param('id')
    id: string,
  ): Promise<Observable<any>> {
    return this.appService.deleteProduct(id);
  }

  //Carts

  @Get('store/cart')
  @UseGuards(JwtAuthGuard)
  async getUserCart(
    @Req()
    req,
  ) {
    return await this.appService.getUserCart(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('store/cart')
  async addItemToCart(
    @Request()
    req,
    @Body()
    item: ItemDto,
  ) {
    const userId = req.user.userId;
    const data = { userId, item };
    return await this.appService.addItemToCart(data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('store/cart/removeItem')
  async removeItemFromCart(
    @Request()
    req,
    @Body()
    { productId },
  ) {
    const userId = req.user.userId;
    const data = { userId, productId };
    const cart = await this.appService.removeItemFromCart(data);
    if (!cart) throw new NotFoundException('Item does not exist');
    return cart;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('store/cart')
  async deleteCart(
    @Req()
    req,
  ) {
    const cart = await this.appService.deleteCart(req.user.userId);
    if (!cart) throw new NotFoundException('Cart does not exist');
    return cart;
  }

  //ORDERS
  @Post('store/order')
  @UseGuards(JwtAuthGuard)
  createOrder(@Request() req) {
    return this.appService.createOrder(req.user.userId);
  }

  @Post('store/order/cancel/:id')
  @UseGuards(JwtAuthGuard)
  cancelOrder(@Request() req, @Param('id') id: string) {
    return this.appService.cancelOrder(req.user.userId, id);
  }
}

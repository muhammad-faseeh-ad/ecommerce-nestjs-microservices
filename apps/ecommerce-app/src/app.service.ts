import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Product } from 'apps/products/src/schemas/product.schema';
import { catchError, Observable, throwError } from 'rxjs';
import { CreateProductDto } from 'shared/dtos/create-product-dto';
import { CreateUserDto } from 'shared/dtos/create-user-dtos';
import { FilterProductDto } from 'shared/dtos/filter-product-dto';

@Injectable()
export class AppService {
  constructor(
    @Inject('PRODUCTS') private productsClient: ClientProxy,
    @Inject('AUTH') private authClient: ClientProxy,
    @Inject('ORDERS') private orderClient: ClientProxy,
  ) {}

  //USERS
  async register(createUserDTO: CreateUserDto) {
    return this.authClient.send({ cmd: 'register' }, createUserDTO);
  }

  async login(user): Promise<Observable<{ access_token: string }>> {
    return this.authClient.send({ cmd: 'login' }, user).pipe(
      catchError((err) => {
        let status = HttpStatus.UNAUTHORIZED;
        let message = 'Invalid credentials';

        if (err instanceof RpcException) {
          const errorResponse = err.getError();
          if (typeof errorResponse === 'string') {
            message = errorResponse;
          } else if (
            typeof errorResponse === 'object' &&
            errorResponse !== null
          ) {
            status = this.getHttpStatusFromRpcCode(errorResponse['code']);
            message = errorResponse['message'] || 'Internal server error';
          }
        }

        return throwError(() => new HttpException(message, status));
      }),
    );
  }

  private getHttpStatusFromRpcCode(rpcCode: number): HttpStatus {
    switch (rpcCode) {
      case 5: // NotFound
        return HttpStatus.NOT_FOUND;
      case 7: // PermissionDenied
        return HttpStatus.FORBIDDEN;
      case 16: // Unauthenticated
        return HttpStatus.UNAUTHORIZED;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
  //PRODUCTS
  async getProducts(
    filterProductDto: FilterProductDto,
  ): Promise<Observable<Product[]>> {
    return this.productsClient.send({ cmd: 'getProducts' }, filterProductDto);
  }

  async getProduct(id: string): Promise<Observable<Product>> {
    return this.productsClient.send({ cmd: 'getProduct' }, id);
  }

  async addProduct(product: CreateProductDto): Promise<Observable<Product>> {
    return this.productsClient.send({ cmd: 'addProduct' }, product);
  }

  async updateProduct(
    id: string,
    product: Partial<CreateProductDto>,
  ): Promise<Observable<Product>> {
    const payload = { id, product };
    return this.productsClient.send({ cmd: 'updateProduct' }, payload);
  }

  async deleteProduct(id: string): Promise<Observable<Product>> {
    return this.productsClient.send({ cmd: 'deleteProduct' }, id);
  }

  //CART
  async getUserCart(userId: any) {
    return this.orderClient.send({ cmd: 'getCart' }, userId);
  }

  async addItemToCart(data: any) {
    return await this.orderClient.send({ cmd: 'addItem' }, data);
  }

  async removeItemFromCart(data: any) {
    const cart = this.orderClient.send({ cmd: 'removeItem' }, data);
    if (!cart) throw new HttpException('Item does not exist', 404);
    return cart;
  }

  async deleteCart(data: any) {
    const cart = this.orderClient.send({ cmd: 'deleteCart' }, data);
    if (!cart) throw new HttpException('Cart does not exist', 404);
    return cart;
  }

  //ORDER
  async createOrder(userId: string) {
    return this.orderClient.send({ cmd: 'createOrder' }, userId);
  }

  async cancelOrder(userId: string, id: string) {
    const data = { userId, id };
    return this.orderClient.send({ cmd: 'cancelOrder' }, data);
  }

  async findOrder(userId: string, id: string) {
    const data = { userId, id };
    return this.orderClient.send({ cmd: 'findOrder' }, data);
  }
}

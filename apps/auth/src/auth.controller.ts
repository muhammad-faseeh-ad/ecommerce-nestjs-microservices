import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorators';
import { Role } from 'shared/enums/role.enum';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { LocalAuthGuard } from './guards/local.guard';
import { RpcContext } from './interfaces/context.interface';
import { CreateUserDto } from 'shared/dtos/create-user-dtos';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'register' })
  async register(createUserDTO: CreateUserDto) {
    const user = await this.authService.addUser(createUserDTO);
    return user;
  }

  @MessagePattern({ cmd: 'login' })
  async login(data: any): Promise<any> {
    const localAuthGuard = new LocalAuthGuard(this.authService);
    const context: RpcContext = { user: undefined };
    const executionContext = {
      switchToRpc: () => ({
        getData: () => data,
        getContext: () => context,
      }),
    };

    const canActivate = await localAuthGuard.canActivate(
      executionContext as any,
    );
    if (!canActivate) {
      throw new RpcException('Unauthorized');
    }

    const user = context.user;
    return this.authService.login(user);
  }

  @MessagePattern({ cmd: 'getProfile' })
  @UseGuards(RolesGuard)
  @Roles(Role.User)
  @Get('/user')
  getProfile(req) {
    return req.user;
  }

  @MessagePattern({ cmd: 'getDashboard' })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Get('/admin')
  getDashboard(req) {
    return req.user;
  }
}

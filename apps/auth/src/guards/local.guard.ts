import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { RpcException } from '@nestjs/microservices';
import { AuthService } from '../auth.service';
import { RpcContext } from '../interfaces/context.interface';

@Injectable()
export class LocalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const data = context.switchToRpc().getData();
    const { username, password } = data;

    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new RpcException('Unauthorized');
    }

    const rpcContext: RpcContext = context.switchToRpc().getContext();
    rpcContext.user = user; // Attaching user to the context
    return true;
  }
}

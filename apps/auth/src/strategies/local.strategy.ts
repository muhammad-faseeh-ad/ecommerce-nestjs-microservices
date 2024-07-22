import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    console.log('local strategy::');
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      console.log('local strategy::', user);
      throw new RpcException('unauthorized local strategy');
    }
    return user;
  }
}

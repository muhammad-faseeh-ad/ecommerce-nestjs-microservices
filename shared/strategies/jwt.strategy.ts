import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'no secret',
    });
  }
  
  async validate(payload: any) {
    //console.log(payload);
    // const user = await this.userService.findUser(payload.username)
    // return user;
    return { userId: payload.sub, username: payload.username, roles: payload.roles };
  }
}
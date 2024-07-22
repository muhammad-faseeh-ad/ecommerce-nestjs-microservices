import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from 'shared/strategies/jwt.strategy';

const username = encodeURIComponent('fasseeh111');
const password = encodeURIComponent('1JeDAVbJzCvAKG2x');

@Module({
  imports: [
    MongooseModule.forRoot(
      `mongodb+srv://${username}:${password}@cluster0.p1gygz9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
    ),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'no secret',
      signOptions: { expiresIn: 300 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}

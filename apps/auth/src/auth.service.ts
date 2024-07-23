import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from 'shared/dtos/create-user-dtos';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private UserModel: mongoose.Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async addUser(user: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(user.password, salt);
    user.password = password;
    return (await this.UserModel.create(user)).save();
  }

  async findUser(username: string): Promise<User> {
    const user = await this.UserModel.findOne({ email: username });
    return user;
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.findUser(username);

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (user && isPasswordMatch) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      username: user.username,
      sub: user._id,
      roles: user.roles,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

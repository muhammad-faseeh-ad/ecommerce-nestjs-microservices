import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from 'shared/enums/role.enum';

describe(' Test suite', () => {
  let authService: AuthService;
  let model: Model<User>;
  let jwtService: JwtService;

  const mockUserModel = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUser = {
    _id: '6686515e3e747da7322d4a39',
    username: 'ecom test user',
    email: 'ecom1@gmail.com',
    password: '$2b$10$./x9pZEwvaKTYHdK5UlpjusIFfJAljjprak4VcQodjzktQE4/TgwK',
    roles: ['admin', 'user'],
    createdAt: new Date('2024-07-04T07:38:06.765Z'),
    updatedAt: new Date('2024-07-04T07:38:06.969Z'),
    __v: 0,
  };

  const mockToken = 'jwtToken';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    model = module.get<Model<User>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('addUser', () => {
    it('should add a user', async () => {
      const createUserDto = {
        username: 'user 1',
        email: 'email@gmail.com',
        password: 'qwerty123',
        roles: [Role.Admin, Role.User],
      };
      const originalPassword = createUserDto.password;

      jest.spyOn(bcrypt, 'genSalt').mockImplementation(async () => 'salt');

      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => {
        return 'hashedPassword';
      });

      jest.spyOn(model, 'create').mockImplementation(
        () =>
          ({
            save: jest.fn().mockResolvedValue(mockUser),
          }) as any,
      );

      const result = await authService.addUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(model.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(originalPassword, 'salt');
    });
  });

  describe('findUser', () => {
    it('should return the user', async () => {
      const email = 'email@gmail.com';

      jest.spyOn(model, 'findOne').mockResolvedValue(mockUser);
      const result = await authService.findUser(email);

      expect(result).toEqual(mockUser);
      expect(model.findOne).toHaveBeenCalledWith({ email: email });
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const username = 'email@gmail.com';
      const password = 'qwerty123';

      jest.spyOn(model, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      await authService.validateUser(username, password);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: username });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });
  });

  describe('login', () => {
    it('should return jwttoken if login is successful', async () => {
      const mockPayload = {
        username: 'email@gmail.com',
        sub: '6686515e3e747da7322d4a39',
        roles: [Role.Admin, Role.User],
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue('jwtToken');

      const result = await authService.login(mockPayload);

      expect(result.access_token).toEqual(mockToken);
      expect(result).toHaveProperty('access_token');
    });
  });
});

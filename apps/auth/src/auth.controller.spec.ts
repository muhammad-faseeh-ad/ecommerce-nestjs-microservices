import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'shared/enums/role.enum';
import { LocalAuthGuard } from './guards/local.guard';
import { RpcException } from '@nestjs/microservices';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let localAuthGuard: LocalAuthGuard;

  const mockAuthService = {
    getHello: jest.fn().mockReturnValue('Hello World! From AuthMS'),
    addUser: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        JwtService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    localAuthGuard = new LocalAuthGuard(authService);
  });

  describe('root', () => {
    it('should return "Hello World! From AuthMS"', () => {
      expect(authController.getHello()).toBe('Hello World! From AuthMS');
    });
  });

  describe('addUser', () => {
    it('should add a user', async () => {
      const createUserDto = {
        username: 'user 1',
        email: 'email@gmail.com',
        password: 'qwerty123',
        roles: [Role.Admin, Role.User],
      };

      jest.spyOn(authService, 'addUser').mockImplementation(() => {
        return mockUser as any;
      });

      const result = await authController.register(createUserDto);

      expect(result).toEqual(mockUser);
      expect(authService.addUser).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should return user data on successful login', async () => {
      const data = { username: 'ecom1@gmail.com', password: 'qwerty123' };

      jest.spyOn(localAuthGuard, 'canActivate').mockResolvedValue(true);
      jest
        .spyOn(authService, 'validateUser')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(authService, 'login')
        .mockResolvedValue({ access_token: mockToken });

      const result = await authController.login(data);

      expect(result).toEqual({ access_token: mockToken });
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw RpcException if authentication fails', async () => {
      const data = { username: 'test', password: 'wrong' };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      jest.spyOn(localAuthGuard, 'canActivate').mockImplementation(() => {
        throw new RpcException('Unauthorized');
      });

      await expect(authController.login(data)).rejects.toThrow(RpcException);
    });
  });
});

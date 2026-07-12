import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock; refreshToken: jest.Mock; register: jest.Mock };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      refreshToken: jest.fn(),
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates refresh requests to the auth service', async () => {
    authService.refreshToken.mockResolvedValue({ accessToken: 'new-access-token' });

    const result = await controller.refresh({ refreshToken: 'token' });

    expect(result).toEqual({ accessToken: 'new-access-token' });
    expect(authService.refreshToken).toHaveBeenCalledWith('token');
  });
});

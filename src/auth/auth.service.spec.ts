import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DRIZZLE } from '../database/database.module';

describe('AuthService', () => {
  let service: AuthService;
  let db: any;
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  beforeEach(async () => {
    db = {
      query: {
        users: {
          findFirst: jest.fn(),
        },
      },
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DRIZZLE, useValue: db },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('returns access and refresh tokens on login', async () => {
    db.query.users.findFirst.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: '$2b$10$abcdefghijklmnopqrstuv',
    });

    jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

    const result = await service.login({ email: 'user@example.com', password: 'password123' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: 1, email: 'user@example.com' },
      { expiresIn: '15m' },
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: 1, email: 'user@example.com', type: 'refresh' },
      { expiresIn: '7d' },
    );
  });

  it('issues a new access token from a valid refresh token', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 1, email: 'user@example.com', type: 'refresh' });
    jwtService.signAsync.mockResolvedValue('new-access-token');

    const result = await service.refreshToken('valid-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: 1, email: 'user@example.com' },
      { expiresIn: '15m' },
    );
  });

  it('rejects invalid refresh tokens', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(service.refreshToken('bad-token')).rejects.toThrow(UnauthorizedException);
  });
});

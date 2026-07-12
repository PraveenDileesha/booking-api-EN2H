import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private async signAccessToken(payload: { sub: string; email: string }) {
    return this.jwtService.signAsync(payload, { expiresIn: '15m' });
  }

  private async signRefreshToken(payload: { sub: string; email: string }) {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    return this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        { expiresIn: '7d', secret },
    );
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.db.query.users.findFirst({
        where: eq(schema.users.email, dto.email),
    });
    
    if (existingUser) {
        throw new ConflictException('A user with this email already exists');
    }
    
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    try {
        const [newUser] = await this.db
        .insert(schema.users)
        .values({
            email: dto.email,
            password: hashedPassword,
        })
        .returning();
        
        const { password, ...safeUser } = newUser;
        return safeUser;
    } catch (err: any) {
        const code = err?.cause?.code ?? err?.code;
        if (code === '23505') {
            throw new ConflictException('A user with this email already exists');
        }
        throw err;
    }
  }
  

  async login(dto: LoginDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, dto.email),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: await this.signAccessToken(payload),
      refreshToken: await this.signRefreshToken(payload),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
        const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
        const payload = await this.jwtService.verifyAsync(refreshToken, { secret });
        
        if (payload.type !== 'refresh') {
            throw new UnauthorizedException('Invalid refresh token');
        }
        
        const accessToken = await this.signAccessToken({
            sub: payload.sub,
            email: payload.email,
        });
        return { accessToken };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log('VERIFY ERROR:', message);
        throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
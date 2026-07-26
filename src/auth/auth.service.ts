import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async sendVerificationCode(email: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3분 유효

    await this.prisma.emailVerification.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        isVerified: false,
      },
      create: {
        email,
        code,
        expiresAt,
        isVerified: false,
      },
    });

    await this.mailService.sendVerificationCode(email, code);

    return { message: '인증번호가 이메일로 발송되었습니다.' };
  }

  async verifyCode(email: string, code: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { email },
    });

    if (!verification) {
      throw new NotFoundException('인증 요청 내역이 없습니다. 먼저 인증번호를 발송해 주세요.');
    }

    if (verification.code !== code) {
      throw new BadRequestException('인증번호가 일치하지 않습니다.');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('인증번호가 만료되었습니다. 다시 발송해 주세요.');
    }

    await this.prisma.emailVerification.update({
      where: { email },
      data: { isVerified: true },
    });

    return { message: '이메일 인증이 완료되었습니다.' };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const verification = await this.prisma.emailVerification.findUnique({
      where: { email: dto.email },
    });

    if (!verification || !verification.isVerified) {
      throw new BadRequestException('이메일 인증이 완료되지 않았습니다.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    await this.prisma.emailVerification.delete({
      where: { email: dto.email },
    });

    return this.toPublicUser(user);
  }

  async checkEmail(email: string) {
    const existing = await this.usersService.findByEmail(email);
    return { isAvailable: !existing };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens(stored.user);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    return { message: '로그아웃되었습니다.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('현재 비밀번호가 올바르지 않습니다.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: '비밀번호가 변경되었습니다. 다시 로그인해 주세요.' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.toPublicUser(user);
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomBytes(40).toString('hex');
    const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';
    const expiresAt = this.parseExpiry(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private parseExpiry(expiry: string): Date {
    const match = expiry.match(/^(\d+)([dhms])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

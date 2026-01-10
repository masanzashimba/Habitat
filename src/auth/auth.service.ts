import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma.service';
import { AUTH_CONSTANTS } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
    private refreshTokenService: RefreshTokenService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async register(
    dto: CreateUserDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const user = await this.userService.createUser(dto);
    const { accessToken, refreshToken } = await this.generateTokenPair(
      user.id,
      user.email,
      userAgent,
      ipAddress,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    await this.checkAccountLock(user.id);

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    await this.resetFailedLoginAttempts(user.id);

    const { accessToken, refreshToken } = await this.generateTokenPair(
      user.id,
      user.email,
      userAgent,
      ipAddress,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      {
        expiresIn: AUTH_CONSTANTS.RESET_PASSWORD_TOKEN_EXPIRY,
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );

    const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    await this.mailService.sendResetPassword(user.email, resetLink);

    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Token invalide');
      }

      await this.userService.updateUser(payload.sub, { password: newPassword });

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordChangedAt: new Date() },
      });

      await this.refreshTokenService.revokeAllUserTokens(payload.sub);

      return { message: 'Mot de passe réinitialisé avec succès' };
    } catch (e) {
      throw new BadRequestException('Token invalide ou expiré');
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    await this.userService.updateUser(userId, { password: newPassword });

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordChangedAt: new Date() },
    });

    await this.refreshTokenService.revokeAllUserTokens(userId);

    return { message: 'Mot de passe modifié avec succès' };
  }

  async generateTokenPair(
    userId: string,
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = await this.refreshTokenService.createRefreshToken(
      userId,
      userAgent,
      ipAddress,
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(
    oldRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const { userId } = await this.refreshTokenService.validateRefreshToken(
      oldRefreshToken,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const newRefreshToken = await this.refreshTokenService.rotateRefreshToken(
      oldRefreshToken,
      userAgent,
      ipAddress,
    );

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      },
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    } else {
      await this.refreshTokenService.revokeAllUserTokens(userId);
    }
    return { message: 'Déconnexion réussie' };
  }

  private async checkAccountLock(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true },
    });

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60),
      );
      throw new UnauthorizedException(
        `Compte verrouillé. Réessayez dans ${remainingMinutes} minute(s)`,
      );
    }
  }

  private async handleFailedLogin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    const attempts = (user?.failedLoginAttempts || 0) + 1;

    if (attempts >= AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(
        lockUntil.getMinutes() + AUTH_CONSTANTS.LOCK_DURATION_MINUTES,
      );

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: lockUntil,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: attempts },
      });
    }
  }

  private async resetFailedLoginAttempts(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}

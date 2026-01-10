import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async createRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return token;
  }

  async validateRefreshToken(token: string): Promise<{ userId: string }> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    if (refreshToken.isRevoked) {
      await this.revokeTokenFamily(refreshToken.userId, refreshToken.id);
      throw new UnauthorizedException(
        'Token révoqué - possible réutilisation détectée',
      );
    }

    if (new Date() > refreshToken.expiresAt) {
      throw new UnauthorizedException('Token de rafraîchissement expiré');
    }

    return { userId: refreshToken.userId };
  }

  async rotateRefreshToken(
    oldToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const { userId } = await this.validateRefreshToken(oldToken);

    const newToken = await this.createRefreshToken(userId, userAgent, ipAddress);

    await this.prisma.refreshToken.update({
      where: { token: oldToken },
      data: {
        isRevoked: true,
        replacedBy: newToken,
        revokedAt: new Date(),
      },
    });

    return newToken;
  }

  async revokeToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async revokeTokenFamily(userId: string, tokenId: string): Promise<void> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) return;

    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        createdAt: {
          gte: token.createdAt,
        },
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}

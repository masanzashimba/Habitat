import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AUTH_CONSTANTS } from './constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean = false,
  ) {
    // Access token avec durée courte
    res.cookie(AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE_NAME, accessToken, {
      ...AUTH_CONSTANTS.COOKIE_OPTIONS,
    });

    // Refresh token avec durée adaptée selon rememberMe
    const refreshCookieOptions = rememberMe
      ? AUTH_CONSTANTS.REFRESH_COOKIE_OPTIONS
      : { ...AUTH_CONSTANTS.COOKIE_OPTIONS, maxAge: undefined }; // Session cookie si pas rememberMe

    res.cookie(
      AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      refreshCookieOptions,
    );
  }

  private clearCookies(res: Response) {
    res.clearCookie(
      AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE_NAME,
      AUTH_CONSTANTS.COOKIE_OPTIONS,
    );
    res.clearCookie(
      AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME,
      AUTH_CONSTANTS.COOKIE_OPTIONS,
    );
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.register(
      dto,
      userAgent,
      ipAddress,
    );

    this.setCookies(res, accessToken, refreshToken);

    return { user };
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto & { rememberMe?: boolean },
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.login(
      dto,
      userAgent,
      ipAddress,
    );

    this.setCookies(res, accessToken, refreshToken, dto.rememberMe);

    return { user };
  }
  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const oldRefreshToken = req.cookies?.refresh_token;

    const { accessToken, refreshToken } =
      await this.authService.refreshAccessToken(
        oldRefreshToken,
        userAgent,
        ipAddress,
      );

    this.setCookies(res, accessToken, refreshToken);

    return { message: 'Tokens renouvelés avec succès' };
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser('userId') userId: string) {
    const user = await this.authService.getFullProfile(userId);
    return {
      success: true,
      data: user,
      message: 'Profil récupéré avec succès',
    };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(
      dto.token,
      dto.newPassword,
    );
    this.clearCookies(res);
    return result;
  }

  @UseGuards(JwtAccessGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    this.clearCookies(res);
    return result;
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('userId') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    await this.authService.logout(userId, refreshToken);
    this.clearCookies(res);
    return { message: 'Déconnexion réussie' };
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    this.clearCookies(res);
    return { message: 'Déconnexion de tous les appareils réussie' };
  }
}

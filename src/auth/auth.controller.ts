import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtCookieGuard } from './jwt-cookie.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user } = await this.authService.validateUser(dto);

    const payload = { sub: user.id, email: user.email };
    const token = this.authService.generateToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // nécessaire pour Chrome si sameSite: 'none'
      sameSite: 'none',
      maxAge: 1000 * 60 * 60,
    });

    return { user }; // on ne renvoie pas le token ici
  }

  @UseGuards(JwtCookieGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtCookieGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { message: 'Déconnecté avec succès' };
  }
}

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.userService.createUser(dto);
    const token = this.generateToken({ sub: user.id, email: user.email });
    return { user, token };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user)
      throw new UnauthorizedException('Email ou mot de passe invalide');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch)
      throw new UnauthorizedException('Email ou mot de passe invalide');

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
    });

    return { user, token };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException('Utilisateur non trouvé');

    const resetToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '15m', secret: process.env.JWT_SECRET },
    );

    const resetLink = `${resetToken}`;

    await this.mailService.sendResetPassword(user.email, resetLink);

    return { message: 'Lien de réinitialisation envoyé par email' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      await this.userService.updateUser(payload.sub, { password: newPassword });

      return { message: 'Mot de passe réinitialisé avec succès' };
    } catch (e) {
      throw new BadRequestException('Token invalide ou expiré');
    }
  }

  async validateUser(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user)
      throw new UnauthorizedException('Email ou mot de passe invalide');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch)
      throw new UnauthorizedException('Email ou mot de passe invalide');

    return { user };
  }

  generateToken(payload: any) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h',
    });
  }
}

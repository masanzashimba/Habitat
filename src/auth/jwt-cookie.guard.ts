// jwt-cookie.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.token;
    if (!token) return false;

    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      req.user = payload;
      return true;
    } catch (e) {
      return false;
    }
  }
}

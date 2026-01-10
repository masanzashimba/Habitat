import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Token de rafraîchissement expiré. Veuillez vous reconnecter',
        );
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token de rafraîchissement invalide');
      }
      throw err || new UnauthorizedException('Non autorisé');
    }
    return user;
  }
}

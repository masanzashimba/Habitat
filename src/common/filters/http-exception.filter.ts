import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[];
    let error: string;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || exception.message;
      error = responseObj.error || HttpStatus[status];
    } else {
      message = exceptionResponse as string;
      error = HttpStatus[status];
    }

    // Messages personnalisés selon le code d'erreur
    const customMessages: Record<number, string> = {
      400: 'Requête invalide. Vérifiez les données envoyées.',
      401: 'Non autorisé. Veuillez vous connecter.',
      403: "Accès interdit. Vous n'avez pas les permissions nécessaires.",
      404: 'Ressource non trouvée.',
      409: 'Conflit. Cette ressource existe déjà ou est en conflit avec une autre.',
      422: 'Données non valides. Vérifiez les informations fournies.',
      429: 'Trop de requêtes. Veuillez réessayer plus tard.',
      500: 'Erreur serveur. Veuillez réessayer plus tard.',
      503: 'Service temporairement indisponible.',
    };

    // Utiliser le message personnalisé si disponible
    const finalMessage = Array.isArray(message)
      ? message[0]
      : message || customMessages[status] || 'Une erreur est survenue';

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message: finalMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

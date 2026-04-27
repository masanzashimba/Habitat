import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/properties',
})
export class PropertyGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Optionnel: Vérifier le token JWT si nécessaire
      const token = client.handshake.auth.token;
      if (token) {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_ACCESS_SECRET,
        });
        client.data.userId = payload.userId;
      }
      console.log(`Client connected to properties: ${client.id}`);
    } catch (error) {
      console.log('Connection without valid token');
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected from properties: ${client.id}`);
  }

  // Émettre une mise à jour de like à tous les clients
  broadcastLikeUpdate(propertyId: string, likesCount: number, userId: string) {
    this.server.emit('likeUpdate', {
      propertyId,
      likesCount,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Émettre une mise à jour de like à un utilisateur spécifique
  sendLikeUpdateToUser(
    userId: string,
    propertyId: string,
    liked: boolean,
    likesCount: number,
  ) {
    // Trouver tous les sockets de cet utilisateur
    const userSockets = Array.from(this.server.sockets.sockets.values()).filter(
      (socket) => socket.data.userId === userId,
    );

    userSockets.forEach((socket) => {
      socket.emit('userLikeUpdate', {
        propertyId,
        liked,
        likesCount,
        timestamp: new Date().toISOString(),
      });
    });
  }
}

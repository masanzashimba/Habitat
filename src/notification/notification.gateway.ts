import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extraire le token depuis les headers ou query params
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Vérifier le token JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      const userId = payload.userId;

      // Stocker la connexion
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.add(client.id);
      }

      // Joindre le client à sa room personnelle
      client.join(`user:${userId}`);

      // Stocker l'userId dans le socket pour un accès facile
      client.data.userId = userId;

      this.logger.log(
        `Client ${client.id} connected for user ${userId}. Total connections: ${userSocketSet?.size || 0}`,
      );

      // Envoyer un message de confirmation
      client.emit('connected', {
        message: 'Successfully connected to notification service',
        userId,
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      const userSocketSet = this.userSockets.get(userId);

      if (userSocketSet) {
        userSocketSet.delete(client.id);

        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }

        this.logger.log(
          `Client ${client.id} disconnected for user ${userId}. Remaining connections: ${userSocketSet.size}`,
        );
      }
    }
  }

  /**
   * Envoie une notification à un utilisateur spécifique
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user ${userId}`);
  }

  /**
   * Envoie une notification à plusieurs utilisateurs
   */
  sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  /**
   * Broadcast une notification à tous les utilisateurs connectés
   */
  broadcastNotification(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log('Notification broadcasted to all users');
  }

  /**
   * Envoie une notification de mise à jour du compteur
   */
  sendUnreadCountUpdate(userId: string, unreadCount: number) {
    this.server.to(`user:${userId}`).emit('unreadCount', { unreadCount });
    this.logger.log(`Unread count (${unreadCount}) sent to user ${userId}`);
  }

  /**
   * Marque une notification comme lue
   */
  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userId = client.data.userId;
    this.logger.log(
      `User ${userId} marked notification ${data.notificationId} as read`,
    );

    // Émettre un événement de confirmation
    client.emit('notificationRead', {
      notificationId: data.notificationId,
      success: true,
    });
  }

  /**
   * Marque toutes les notifications comme lues
   */
  @SubscribeMessage('markAllAsRead')
  handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    this.logger.log(`User ${userId} marked all notifications as read`);

    client.emit('allNotificationsRead', { success: true });
  }

  /**
   * Obtenir le nombre d'utilisateurs connectés
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Vérifier si un utilisateur est connecté
   */
  isUserConnected(userId: string): boolean {
    const userSocketSet = this.userSockets.get(userId);
    return userSocketSet ? userSocketSet.size > 0 : false;
  }

  /**
   * Obtenir le nombre de connexions d'un utilisateur
   */
  getUserConnectionsCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}

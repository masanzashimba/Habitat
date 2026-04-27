import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from '../prisma.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const { userId, title, message, type, data } = createNotificationDto;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data || null,
      },
    });

    // 🔥 Envoyer la notification en temps réel via WebSocket
    this.notificationGateway.sendNotificationToUser(userId, notification);

    // 🔥 Mettre à jour le compteur de notifications non lues
    const unreadCount = await this.getUnreadCount(userId);
    this.notificationGateway.sendUnreadCountUpdate(userId, unreadCount);

    return notification;
  }

  async findAll(userId: string, userRole: string) {
    // Admin can see all notifications, others only their own
    const where = userRole === 'admin' ? {} : { userId };

    return this.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Check access rights
    if (userRole !== 'admin' && notification.userId !== userId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string, userRole: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Check access rights
    if (userRole !== 'admin' && notification.userId !== userId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    // 🔥 Mettre à jour le compteur en temps réel
    const unreadCount = await this.getUnreadCount(notification.userId);
    this.notificationGateway.sendUnreadCountUpdate(
      notification.userId,
      unreadCount,
    );

    return updated;
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // 🔥 Mettre à jour le compteur en temps réel (0 car toutes sont lues)
    this.notificationGateway.sendUnreadCountUpdate(userId, 0);

    return result;
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    userId: string,
    userRole: string,
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Check access rights
    if (userRole !== 'admin' && notification.userId !== userId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    return this.prisma.notification.update({
      where: { id },
      data: updateNotificationDto,
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Check access rights
    if (userRole !== 'admin' && notification.userId !== userId) {
      throw new ForbiddenException('Access denied to delete this notification');
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  // Helper method to create notifications for specific events
  async createBookingNotification(
    userId: string,
    bookingId: string,
    type: 'new' | 'validated' | 'rejected' | 'cancelled',
    propertyTitle: string,
    additionalData?: any,
  ) {
    const titles = {
      new: 'Nouvelle demande de réservation',
      validated: 'Réservation confirmée',
      rejected: 'Réservation rejetée',
      cancelled: 'Réservation annulée',
    };

    const messages = {
      new: `Une nouvelle demande de réservation a été reçue pour votre bien "${propertyTitle}". Elle est en attente de validation par le service.`,
      validated: `Votre réservation pour "${propertyTitle}" a été confirmée. Vous serez contacté prochainement pour finaliser les détails.`,
      rejected: `Votre demande de réservation pour "${propertyTitle}" a été rejetée. Veuillez contacter le service pour plus d'informations.`,
      cancelled: `La réservation pour "${propertyTitle}" a été annulée.`,
    };

    // Récupérer les informations de l'utilisateur qui a fait la réservation
    let userInfo: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      profileImage: string | null;
      email: string;
    } | null = null;

    if (additionalData?.tenantUserId) {
      const tenantUser = await this.prisma.user.findUnique({
        where: { id: additionalData.tenantUserId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
        },
      });
      if (tenantUser) {
        userInfo = {
          id: tenantUser.id,
          firstName: tenantUser.firstName,
          lastName: tenantUser.lastName,
          profileImage: tenantUser.profileImage,
          email: tenantUser.email,
        };
      }
    }

    return this.create({
      userId,
      title: titles[type],
      message: messages[type],
      type: `booking_${type}`,
      data: {
        bookingId,
        propertyTitle,
        userInfo, // Ajouter les infos de l'utilisateur
        ...additionalData,
      },
    });
  }

  // Helper method to create notification for client when they make a booking
  async createClientBookingNotification(
    userId: string,
    bookingId: string,
    propertyTitle: string,
    bookingDetails: any,
  ) {
    return this.create({
      userId,
      title: 'Demande de réservation enregistrée',
      message: `Votre demande de réservation pour "${propertyTitle}" a bien été enregistrée. Notre équipe examine votre demande et vous contactera dans les 24 à 48 heures pour confirmer votre réservation. Merci de votre confiance !`,
      type: 'booking_client_confirmation',
      data: { bookingId, propertyTitle, ...bookingDetails },
    });
  }

  // Helper method to notify property owner when their property is booked
  async createPropertyBookedNotification(
    userId: string,
    bookingId: string,
    propertyTitle: string,
    bookingDetails: any,
  ) {
    return this.create({
      userId,
      title: 'Bien réservé et indisponible',
      message: `Votre bien "${propertyTitle}" a été confirmé pour une réservation. Il est maintenant marqué comme indisponible jusqu'à la fin de la période de location. Le locataire prendra possession du bien à partir de la date convenue.`,
      type: 'property_booked',
      data: { bookingId, propertyTitle, ...bookingDetails },
    });
  }

  async createLeaseNotification(
    userId: string,
    leaseId: string,
    type: 'created' | 'updated' | 'terminated',
    propertyTitle: string,
  ) {
    const titles = {
      created: 'Nouveau bail créé',
      updated: 'Bail mis à jour',
      terminated: 'Bail terminé',
    };

    const messages = {
      created: `Un nouveau bail a été créé pour "${propertyTitle}"`,
      updated: `Le bail pour "${propertyTitle}" a été mis à jour`,
      terminated: `Le bail pour "${propertyTitle}" a été terminé`,
    };

    return this.create({
      userId,
      title: titles[type],
      message: messages[type],
      type: `lease_${type}`,
      data: { leaseId, propertyTitle },
    });
  }

  // Helper method to notify owner when they create a property
  async createPropertyCreatedNotification(
    userId: string,
    propertyId: string,
    propertyTitle: string,
    propertyType: string,
  ) {
    return this.create({
      userId,
      title: 'Bien immobilier créé avec succès',
      message: `Félicitations ! Votre bien "${propertyTitle}" (${propertyType}) a été créé avec succès et est maintenant visible sur la plateforme. Notre équipe vérifiera les informations dans les prochaines 24 heures. Vous recevrez une notification dès que votre bien sera validé.`,
      type: 'property_created',
      data: { propertyId, propertyTitle, propertyType },
    });
  }

  // Helper method to notify admin when a new property is created
  async createPropertyCreatedAdminNotification(
    propertyId: string,
    propertyTitle: string,
    propertyType: string,
    ownerName: string,
    ownerEmail: string,
  ) {
    // Get all admin users
    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });

    // Create notification for each admin
    const notifications = await Promise.all(
      admins.map((admin) =>
        this.create({
          userId: admin.id,
          title: 'Nouveau bien immobilier à vérifier',
          message: `Un nouveau bien "${propertyTitle}" (${propertyType}) a été ajouté par ${ownerName} (${ownerEmail}). Veuillez vérifier et valider les informations du bien dans les meilleurs délais.`,
          type: 'property_created_admin',
          data: {
            propertyId,
            propertyTitle,
            propertyType,
            ownerName,
            ownerEmail,
          },
        }),
      ),
    );

    return notifications;
  }
}

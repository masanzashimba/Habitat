import { PrismaService } from './../prisma.service';
import { CloudinaryService } from './../cloudinary.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // =========================
  // GET ALL USERS (Admin only)
  // =========================
  async getUsers(requestingUserId: string) {
    const requestingUser = await this.getUserById(requestingUserId);
    if (requestingUser.role !== Role.admin) {
      throw new BadRequestException(
        'Seul un administrateur peut voir tous les utilisateurs',
      );
    }
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            properties: true,
            bookings: true,
            leasesAsTenant: true,
            leasesAsOwner: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // GET USER BY ID
  // =========================
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,

        // =====================
        // IDENTITÉ
        // =====================
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        coverImage: true,
        bio: true,
        gender: true,
        birthDate: true,

        // =====================
        // COMPTE
        // =====================
        role: true,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        lastLoginAt: true,

        // =====================
        // ADRESSE
        // =====================
        country: true,
        city: true,
        address: true,

        // =====================
        // BUSINESS
        // =====================
        companyName: true,
        companyId: true,

        // =====================
        // META
        // =====================
        createdAt: true,
        updatedAt: true,

        // =====================
        // STATISTIQUES
        // =====================
        _count: {
          select: {
            properties: true,
            bookings: true,
            leasesAsOwner: true,
            leasesAsTenant: true,
            reviews: true,
            favorites: true,
            notifications: {
              where: {
                isRead: false,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id ${id} introuvable`);
    }

    return user;
  }

  // =========================
  // GET USER WITH RELATIONS
  // =========================
  async getUserWithRelations(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        properties: {
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            currency: true,
          },
        },
        bookings: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            totalAmount: true,
          },
        },
        leasesAsOwner: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            rentAmount: true,
          },
        },
        leasesAsTenant: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            rentAmount: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id ${id} introuvable`);
    }

    return user;
  }

  // =========================
  // CREATE USER
  // =========================
  async createUser(dto: CreateUserDto, profileImage?: Express.Multer.File) {
    // Vérifier si l'email existe déjà
    const existEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existEmail) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    // Vérifier si le téléphone existe déjà
    if (dto.phone) {
      const existPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existPhone) {
        throw new BadRequestException(
          'Ce numéro de téléphone est déjà utilisé',
        );
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Upload de l'image de profil si fournie
    let profileImageUrl: string | null = null;
    if (profileImage) {
      const uploadResult = await this.cloudinaryService.uploadProfileImage(
        profileImage.buffer,
        `user-${Date.now()}-${profileImage.originalname}`,
      );
      profileImageUrl = uploadResult.secure_url;
    }

    // Créer l'utilisateur
    return this.prisma.user.create({
      data: {
        // =====================
        // IDENTITÉ
        // =====================
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        email: dto.email,
        phone: dto.phone ?? null,
        profileImage: profileImageUrl,
        bio: dto.bio ?? null,
        gender: dto.gender ?? null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,

        // =====================
        // COMPTE
        // =====================
        password: hashedPassword,
        role: dto.role ?? Role.user,
        isActive: dto.isActive ?? true,

        // =====================
        // ADRESSE
        // =====================
        country: dto.country ?? 'DRC',
        city: dto.city ?? 'Kinshasa',
        address: dto.address ?? null,

        // =====================
        // BUSINESS
        // =====================
        companyName: dto.companyName ?? null,
        companyId: dto.companyId ?? null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
        isActive: true,
        city: true,
        country: true,
        createdAt: true,
      },
    });
  }

  // =========================
  // UPDATE USER
  // =========================
  async updateUser(
    id: string,
    dto: UpdateUserDto,
    profileImage?: Express.Multer.File,
  ) {
    // Vérifier que l'utilisateur existe
    await this.getUserById(id);

    // Vérifier si le téléphone est déjà utilisé par un autre utilisateur
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone && existingPhone.id !== id) {
        throw new BadRequestException(
          'Ce numéro de téléphone est déjà utilisé par un autre utilisateur',
        );
      }
    }

    // Préparer les données à mettre à jour
    const data: any = {};

    // =====================
    // IDENTITÉ
    // =====================
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.birthDate !== undefined) {
      data.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    }

    // =====================
    // COMPTE
    // =====================
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    // =====================
    // ADRESSE
    // =====================
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.address !== undefined) data.address = dto.address;

    // =====================
    // BUSINESS
    // =====================
    if (dto.companyName !== undefined) data.companyName = dto.companyName;
    if (dto.companyId !== undefined) data.companyId = dto.companyId;

    // Upload de l'image de profil si fournie
    if (profileImage) {
      const uploadResult = await this.cloudinaryService.uploadProfileImage(
        profileImage.buffer,
        `user-${id}-${Date.now()}-${profileImage.originalname}`,
      );
      data.profileImage = uploadResult.secure_url;
    }

    // Si un nouveau mot de passe est fourni
    if (dto.newPassword) {
      data.password = await bcrypt.hash(dto.newPassword, 10);
    }

    // Mettre à jour l'utilisateur
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        bio: true,
        gender: true,
        birthDate: true,
        role: true,
        isActive: true,
        country: true,
        city: true,
        address: true,
        companyName: true,
        companyId: true,
        updatedAt: true,
      },
    });
  }

  // =========================
  // CHANGE PASSWORD
  // =========================
  async changePassword(userId: string, dto: ChangePasswordDto) {
    // Récupérer l'utilisateur avec le mot de passe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Mettre à jour le mot de passe
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        updatedAt: true,
      },
    });
  }

  // =========================
  // DELETE USER (Hard delete)
  // =========================
  async deleteUser(id: string) {
    await this.getUserById(id);

    // Vérifier si l'utilisateur a des relations actives
    const userWithRelations = await this.prisma.user.findUnique({
      where: { id },
      include: {
        properties: true,
        leasesAsOwner: true,
        leasesAsTenant: true,
      },
    });

    if (
      userWithRelations?.properties.length ||
      userWithRelations?.leasesAsOwner.length ||
      userWithRelations?.leasesAsTenant.length
    ) {
      throw new BadRequestException(
        'Impossible de supprimer cet utilisateur car il a des relations actives (propriétés, baux)',
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

  // =========================
  // DEACTIVATE USER (Soft delete alternative)
  // =========================
  async deactivateUser(id: string) {
    await this.getUserById(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  // =========================
  // ACTIVATE USER
  // =========================
  async activateUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  // =========================
  // FIND USER BY EMAIL
  // =========================
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // =========================
  // GET USER PROPERTIES
  // =========================
  async getUserProperties(userId: string) {
    await this.getUserById(userId);

    return this.prisma.property.findMany({
      where: { userId: userId },
      include: {
        leases: {
          where: { status: 'active' },
          include: {
            tenant: true,
          },
        },
        bookings: {
          where: { status: 'confirmed' },
        },
      },
    });
  }

  // =========================
  // GET USER BOOKINGS
  // =========================
  async getUserBookings(userId: string) {
    await this.getUserById(userId);

    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        property: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // GET USER LEASES (as tenant)
  // =========================
  async getUserLeases(userId: string) {
    await this.getUserById(userId);

    return this.prisma.lease.findMany({
      where: { tenantId: userId },
      include: {
        property: true,
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // GET USER NOTIFICATIONS
  // =========================
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    await this.getUserById(userId);

    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // GET OWNER TENANTS
  // =========================
  async getOwnerTenants(ownerId: string, requestingUserId: string, userRole: string) {
    // Vérifier que l'utilisateur existe
    await this.getUserById(ownerId);

    // Seul le propriétaire lui-même ou un admin peut voir les locataires
    if (userRole !== Role.admin && ownerId !== requestingUserId) {
      throw new BadRequestException(
        'Accès refusé : vous ne pouvez consulter que vos propres locataires',
      );
    }

    // Récupérer tous les baux où l'utilisateur est propriétaire
    const leases = await this.prisma.lease.findMany({
      where: {
        ownerId: ownerId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            address: true,
            city: true,
            isActive: true,
            createdAt: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: {
              select: {
                commune: true,
                quartier: true,
                avenue: true,
              },
            },
          },
        },
        contract: {
          select: {
            id: true,
            signedAt: true,
            fileUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Grouper les baux par locataire
    const tenantsMap = new Map();

    leases.forEach((lease) => {
      const tenantId = lease.tenant.id;

      if (!tenantsMap.has(tenantId)) {
        tenantsMap.set(tenantId, {
          id: tenantId,
          firstName: lease.tenant.firstName,
          lastName: lease.tenant.lastName,
          email: lease.tenant.email,
          phone: lease.tenant.phone,
          profileImage: lease.tenant.profileImage,
          address: lease.tenant.address,
          city: lease.tenant.city,
          isActive: lease.tenant.isActive,
          createdAt: lease.tenant.createdAt,
          leases: [],
        });
      }

      // Ajouter le bail au locataire
      tenantsMap.get(tenantId).leases.push({
        id: lease.id,
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: lease.rentAmount,
        currency: lease.currency,
        deposit: lease.deposit,
        status: lease.status,
        property: lease.property,
        contract: lease.contract,
      });
    });

    // Convertir la Map en tableau
    return Array.from(tenantsMap.values());
  }

  // =========================
  // GET USER STATS
  // =========================
  async getUserStats(userId: string) {
    const user = await this.getUserById(userId);

    // Stats communes à tous les utilisateurs (propriétaire ET locataire)
    const [
      propertiesCount,
      activeLeasesAsOwnerCount,
      bookingsCount,
      activeLeasesAsTenantCount,
      unreadNotifications,
    ] = await Promise.all([
      this.prisma.property.count({ where: { userId } }),
      this.prisma.lease.count({ where: { ownerId: userId, status: 'active' } }),
      this.prisma.booking.count({ where: { userId } }),
      this.prisma.lease.count({ where: { tenantId: userId, status: 'active' } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    // Locataires uniques (pour les biens dont l'utilisateur est propriétaire)
    const uniqueTenants = await this.prisma.lease.findMany({
      where: { ownerId: userId },
      select: { tenantId: true },
      distinct: ['tenantId'],
    });

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      properties: propertiesCount,
      tenants: uniqueTenants.length,
      activeLeasesAsOwner: activeLeasesAsOwnerCount,
      bookings: bookingsCount,
      activeLeasesAsTenant: activeLeasesAsTenantCount,
      unreadNotifications,
    };
  }
}

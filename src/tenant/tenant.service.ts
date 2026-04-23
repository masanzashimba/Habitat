import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../cloudinary.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AssignTenantDto } from './dto/assign-tenant.dto';
import { LeaseStatus } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // =============================
  // CREATE TENANT
  // =============================
  async create(
    createTenantDto: CreateTenantDto,
    ownerId: string,
    profileImage?: Express.Multer.File,
  ) {
    // Vérifier si un tenant avec cet email existe déjà pour ce propriétaire
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        email: createTenantDto.email,
        ownerId,
      },
    });

    if (existingTenant) {
      throw new BadRequestException(
        'Un locataire avec cet email existe déjà pour ce propriétaire',
      );
    }

    // Gérer l'upload de l'image si présente
    let profileImageUrl: string | undefined;
    if (profileImage) {
      const uploadResult = await this.cloudinaryService.uploadTenantImage(
        profileImage.buffer,
        `tenant-${Date.now()}-${profileImage.originalname}`,
      );
      profileImageUrl = uploadResult.secure_url;
    }

    // Convertir dateOfBirth en Date si présent
    const dateOfBirth = createTenantDto.dateOfBirth
      ? new Date(createTenantDto.dateOfBirth)
      : undefined;

    return this.prisma.tenant.create({
      data: {
        email: createTenantDto.email,
        firstName: createTenantDto.firstName,
        lastName: createTenantDto.lastName,
        phone: createTenantDto.phone,
        profileImage: profileImageUrl,
        dateOfBirth,
        nationalId: createTenantDto.nationalId,
        address: createTenantDto.address,
        city: createTenantDto.city,
        emergencyContact: createTenantDto.emergencyContact,
        emergencyPhone: createTenantDto.emergencyPhone,
        occupation: createTenantDto.occupation,
        employer: createTenantDto.employer,
        monthlyIncome: createTenantDto.monthlyIncome,
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  // =============================
  // FIND ALL TENANTS (WITH PAGINATION)
  // =============================
  async findAll(ownerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { ownerId },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          leases: {
            where: { status: LeaseStatus.active },
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tenant.count({
        where: { ownerId },
      }),
    ]);

    return {
      tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =============================
  // FIND ONE TENANT
  // =============================
  async findOne(id: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        leases: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
        bookings: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire non trouvé');
    }

    // Vérifier les permissions (propriétaire ou admin)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      user?.role !== 'admin' &&
      tenant.ownerId !== userId &&
      tenant.userId !== userId
    ) {
      throw new ForbiddenException('Accès non autorisé à ce locataire');
    }

    return tenant;
  }

  // =============================
  // UPDATE TENANT
  // =============================
  async update(
    id: string,
    updateTenantDto: UpdateTenantDto,
    userId: string,
    profileImage?: Express.Multer.File,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire non trouvé');
    }

    // Vérifier les permissions (propriétaire ou admin)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== 'admin' && tenant.ownerId !== userId) {
      throw new ForbiddenException(
        'Accès non autorisé pour modifier ce locataire',
      );
    }

    // Gérer l'upload de l'image si présente
    let profileImageUrl: string | undefined;
    if (profileImage) {
      const uploadResult = await this.cloudinaryService.uploadTenantImage(
        profileImage.buffer,
        `tenant-${id}-${Date.now()}-${profileImage.originalname}`,
      );
      profileImageUrl = uploadResult.secure_url;
    }

    // Convertir dateOfBirth en Date si présent
    const dateOfBirth = updateTenantDto.dateOfBirth
      ? new Date(updateTenantDto.dateOfBirth)
      : undefined;

    // Préparer les données à mettre à jour
    const updateData: any = {
      firstName: updateTenantDto.firstName,
      lastName: updateTenantDto.lastName,
      phone: updateTenantDto.phone,
      nationalId: updateTenantDto.nationalId,
      address: updateTenantDto.address,
      city: updateTenantDto.city,
      emergencyContact: updateTenantDto.emergencyContact,
      emergencyPhone: updateTenantDto.emergencyPhone,
      occupation: updateTenantDto.occupation,
      employer: updateTenantDto.employer,
      monthlyIncome: updateTenantDto.monthlyIncome,
    };

    // Ajouter les champs optionnels seulement s'ils sont définis
    if (dateOfBirth) {
      updateData.dateOfBirth = dateOfBirth;
    }
    if (profileImageUrl) {
      updateData.profileImage = profileImageUrl;
    }
    if (updateTenantDto.isActive !== undefined) {
      updateData.isActive = updateTenantDto.isActive;
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  // =============================
  // DELETE TENANT
  // =============================
  async remove(id: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        leases: {
          where: { status: LeaseStatus.active },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire non trouvé');
    }

    // Vérifier les permissions (propriétaire ou admin)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== 'admin' && tenant.ownerId !== userId) {
      throw new ForbiddenException(
        'Accès non autorisé pour supprimer ce locataire',
      );
    }

    // Vérifier qu'il n'y a pas de baux actifs
    if (tenant.leases.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer un locataire avec des baux actifs',
      );
    }

    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  // =============================
  // FIND TENANTS BY OWNER
  // =============================
  async findByOwner(ownerId: string, currentUserId: string) {
    // Vérifier les permissions (propriétaire lui-même ou admin)
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (user?.role !== 'admin' && ownerId !== currentUserId) {
      throw new ForbiddenException(
        'Accès non autorisé aux locataires de ce propriétaire',
      );
    }

    return this.prisma.tenant.findMany({
      where: { ownerId },
      include: {
        leases: {
          where: { status: LeaseStatus.active },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =============================
  // ASSIGN TENANT TO PROPERTY
  // =============================
  async assignToProperty(assignTenantDto: AssignTenantDto, ownerId: string) {
    // Vérifier que la propriété existe et appartient au propriétaire
    const property = await this.prisma.property.findFirst({
      where: {
        id: assignTenantDto.propertyId,
        userId: ownerId,
      },
    });

    if (!property) {
      throw new NotFoundException('Propriété non trouvée ou non autorisée');
    }

    // Créer ou récupérer le tenant
    let tenant = await this.prisma.tenant.findFirst({
      where: {
        email: assignTenantDto.tenantEmail,
        ownerId,
      },
    });

    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          email: assignTenantDto.tenantEmail,
          ownerId,
        },
      });
    }

    // Vérifier qu'il n'y a pas déjà un bail actif pour cette propriété
    const existingLease = await this.prisma.lease.findFirst({
      where: {
        propertyId: assignTenantDto.propertyId,
        status: LeaseStatus.active,
      },
    });

    if (existingLease) {
      throw new BadRequestException('Cette propriété a déjà un bail actif');
    }

    // Créer le bail et mettre à jour le statut de la propriété
    return this.prisma.$transaction(async (prisma) => {
      const lease = await prisma.lease.create({
        data: {
          propertyId: assignTenantDto.propertyId,
          tenantId: tenant.id,
          ownerId,
          rentAmount: assignTenantDto.rentAmount,
          currency: assignTenantDto.currency || 'USD',
          deposit: assignTenantDto.deposit || 0,
          startDate: new Date(assignTenantDto.startDate),
          endDate: assignTenantDto.endDate
            ? new Date(assignTenantDto.endDate)
            : null,
          status: LeaseStatus.active,
        },
        include: {
          tenant: true,
          property: true,
          owner: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      // Mettre à jour le statut de la propriété
      await prisma.property.update({
        where: { id: assignTenantDto.propertyId },
        data: { status: 'rented' },
      });

      return lease;
    });
  }

  // =============================
  // UNASSIGN TENANT FROM PROPERTY
  // =============================
  async unassignFromProperty(
    tenantId: string,
    propertyId: string,
    ownerId: string,
  ) {
    // Vérifier que le bail existe et appartient au propriétaire
    const lease = await this.prisma.lease.findFirst({
      where: {
        tenantId,
        propertyId,
        ownerId,
        status: LeaseStatus.active,
      },
    });

    if (!lease) {
      throw new NotFoundException(
        'Bail actif non trouvé pour ce locataire et cette propriété',
      );
    }

    // Terminer le bail et remettre la propriété disponible
    return this.prisma.$transaction(async (prisma) => {
      const updatedLease = await prisma.lease.update({
        where: { id: lease.id },
        data: { status: LeaseStatus.terminated },
        include: {
          tenant: true,
          property: true,
        },
      });

      // Remettre la propriété disponible
      await prisma.property.update({
        where: { id: propertyId },
        data: { status: 'available' },
      });

      return updatedLease;
    });
  }

  // =============================
  // GET TENANT PROPERTIES
  // =============================
  async getTenantProperties(userId: string) {
    // Trouver le tenant associé à cet utilisateur
    const tenant = await this.prisma.tenant.findFirst({
      where: { userId },
    });

    if (!tenant) {
      throw new NotFoundException('Profil locataire non trouvé');
    }

    return this.prisma.lease.findMany({
      where: {
        tenantId: tenant.id,
        status: LeaseStatus.active,
      },
      include: {
        property: {
          include: {
            images: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  // =============================
  // GET TENANT LEASES
  // =============================
  async getTenantLeases(tenantId: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire non trouvé');
    }

    // Vérifier les permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (
      user?.role !== 'admin' &&
      tenant.ownerId !== userId &&
      tenant.userId !== userId
    ) {
      throw new ForbiddenException(
        'Accès non autorisé aux baux de ce locataire',
      );
    }

    return this.prisma.lease.findMany({
      where: { tenantId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
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

  // =============================
  // CREATE OR GET TENANT (HELPER)
  // =============================
  async createOrGetTenant(
    email: string,
    ownerId: string,
    additionalData?: any,
  ) {
    let tenant = await this.prisma.tenant.findFirst({
      where: { email, ownerId },
    });

    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          email,
          ownerId,
          ...additionalData,
        },
      });
    }

    return tenant;
  }

  // =============================
  // GET LANDLORD INFO (for tenant)
  // =============================
  async getLandlordInfo(userId: string) {
    // Vérifier d'abord le rôle de l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Si l'utilisateur n'est pas un locataire, retourner null
    if (user?.role !== 'tenant') {
      return {
        landlord: null,
        activeLeases: [],
        message: "Cet utilisateur n'est pas un locataire",
      };
    }

    // Trouver le profil tenant de l'utilisateur
    const tenantProfile = await this.prisma.tenant.findFirst({
      where: { userId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            companyName: true,
          },
        },
        leases: {
          where: { status: LeaseStatus.active },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!tenantProfile) {
      return {
        landlord: null,
        activeLeases: [],
        message: 'Aucun profil locataire trouvé pour cet utilisateur',
      };
    }

    return {
      landlord: tenantProfile.owner,
      activeLeases: tenantProfile.leases,
    };
  }
}

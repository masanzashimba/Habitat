import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role, Currency, LeaseStatus, Tenant } from 'generated/prisma';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AssignTenantDto } from '../dto/assign-tenant.dto';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryService } from '../../cloudinary.service';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createOrGetTenant(
    ownerId: string,
    dto: CreateTenantDto,
    profileImage?: Express.Multer.File,
  ): Promise<Tenant> {
    let tenant = await this.prisma.tenant.findFirst({
      where: { email: dto.email },
    });

    if (!tenant) {
      let profileImageUrl: string | null = null;
      if (profileImage) {
        const uploadResult = await this.cloudinaryService.uploadTenantImage(
          profileImage.buffer,
          `tenant-${Date.now()}-${profileImage.originalname}`,
        );
        profileImageUrl = uploadResult.secure_url;
      }

      tenant = await this.prisma.tenant.create({
        data: {
          email: dto.email,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
          phone: dto.phone ?? null,
          profileImage: profileImageUrl,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          nationalId: dto.nationalId ?? null,
          address: dto.address ?? null,
          city: dto.city ?? null,
          emergencyContact: dto.emergencyContact ?? null,
          emergencyPhone: dto.emergencyPhone ?? null,
          occupation: dto.occupation ?? null,
          employer: dto.employer ?? null,
          monthlyIncome: dto.monthlyIncome ?? null,
          ownerId,
        },
      });
    }

    return tenant;
  }

  async assignTenantToProperty(
    ownerId: string,
    dto: AssignTenantDto,
  ): Promise<any> {
    // Créer ou récupérer le locataire
    const tenant = await this.createOrGetTenant(ownerId, {
      email: dto.tenantEmail,
    });

    // Vérifier que la propriété existe et appartient au propriétaire
    const property = await this.prisma.property.findFirst({
      where: {
        id: dto.propertyId,
        userId: ownerId,
      },
    });

    if (!property) {
      throw new NotFoundException('Propriété non trouvée ou non autorisée');
    }

    // Vérifier qu'il n'y a pas déjà un bail actif pour cette propriété
    const existingLease = await this.prisma.lease.findFirst({
      where: {
        propertyId: dto.propertyId,
        status: LeaseStatus.active,
      },
    });

    if (existingLease) {
      throw new BadRequestException('Cette propriété a déjà un bail actif');
    }

    // Créer le bail et mettre à jour le statut de la propriété en une transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Créer le bail
      const lease = await prisma.lease.create({
        data: {
          propertyId: dto.propertyId,
          tenantId: tenant.id,
          ownerId,
          rentAmount: dto.rentAmount,
          currency: dto.currency ?? Currency.USD,
          deposit: dto.deposit ?? 0,
          startDate: dto.startDate,
          endDate: dto.endDate ?? null,
          status: LeaseStatus.active,
        },
        include: { tenant: true, property: true },
      });

      // Mettre à jour le statut de la propriété à "rented"
      await prisma.property.update({
        where: { id: dto.propertyId },
        data: { status: 'rented' },
      });

      return lease;
    });

    return result;
  }

  async toggleTenantStatus(
    tenantId: string,
    isActive: boolean,
  ): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new BadRequestException('Locataire non trouvé');

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive },
    });
  }

  async updateTenant(
    tenantId: string,
    dto: UpdateTenantDto,
    profileImage?: Express.Multer.File,
  ): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Locataire non trouvé');

    const data: any = {};

    Object.assign(data, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      nationalId: dto.nationalId,
      address: dto.address,
      city: dto.city,
      emergencyContact: dto.emergencyContact,
      emergencyPhone: dto.emergencyPhone,
      occupation: dto.occupation,
      employer: dto.employer,
      monthlyIncome: dto.monthlyIncome,
      isActive: dto.isActive,
    });

    // Supprimer les champs undefined
    for (const key in data) if (data[key] === undefined) delete data[key];

    if (profileImage) {
      const uploadResult = await this.cloudinaryService.uploadTenantImage(
        profileImage.buffer,
        `tenant-${tenantId}-${Date.now()}-${profileImage.originalname}`,
      );
      data.profileImage = uploadResult.secure_url;
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  }

  async tenantLeaveProperty(tenantId: string, propertyId: string) {
    const lease = await this.prisma.lease.findFirst({
      where: { tenantId, propertyId, status: LeaseStatus.active },
    });

    if (!lease) throw new NotFoundException('Pas de bail actif pour ce bien');

    // Terminer le bail et remettre la propriété à disponible en une transaction
    return this.prisma.$transaction(async (prisma) => {
      // Terminer le bail
      const updatedLease = await prisma.lease.update({
        where: { id: lease.id },
        data: { status: LeaseStatus.terminated },
        select: { id: true, propertyId: true, tenantId: true, status: true },
      });

      // Remettre la propriété à "available"
      await prisma.property.update({
        where: { id: propertyId },
        data: { status: 'available' },
      });

      return updatedLease;
    });
  }

  async getTenantProperties(tenantId: string) {
    return this.prisma.lease.findMany({
      where: { tenantId, status: LeaseStatus.active },
      include: { property: true, owner: true },
    });
  }

  async getOwnerTenants(ownerId: string) {
    return this.prisma.tenant.findMany({
      where: { ownerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        dateOfBirth: true,
        nationalId: true,
        address: true,
        city: true,
        emergencyContact: true,
        emergencyPhone: true,
        occupation: true,
        employer: true,
        monthlyIncome: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantLandlord(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            companyName: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire non trouvé');
    }

    return tenant.owner;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role, Currency, LeaseStatus, Tenant } from 'generated/prisma';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { AssignTenantDto } from '../dto/assign-tenant.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrGetTenant(
    ownerId: string,
    dto: CreateTenantDto,
  ): Promise<Tenant> {
    let tenant = await this.prisma.tenant.findFirst({
      where: { email: dto.email },
    });

    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          email: dto.email,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
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
    const tenant = await this.createOrGetTenant(ownerId, {
      email: dto.tenantEmail,
    });

    const existingLease = await this.prisma.lease.findFirst({
      where: {
        propertyId: dto.propertyId,
        tenantId: tenant.id,
        status: LeaseStatus.active,
      },
    });
    if (existingLease)
      throw new BadRequestException('Locataire déjà associé à ce bien');

    return this.prisma.lease.create({
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

  async tenantLeaveProperty(tenantId: string, propertyId: string) {
    const lease = await this.prisma.lease.findFirst({
      where: { tenantId, propertyId, status: LeaseStatus.active },
    });

    if (!lease) throw new NotFoundException('Pas de bail actif pour ce bien');

    return this.prisma.lease.update({
      where: { id: lease.id },
      data: { status: LeaseStatus.terminated },
      select: { id: true, propertyId: true, tenantId: true, status: true },
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
        createdAt: true,
      },
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

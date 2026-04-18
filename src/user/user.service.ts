import { PrismaService } from './../prisma.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role, Currency, LeaseStatus } from 'generated/prisma';
import { CloudinaryService } from '../cloudinary.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // =========================
  // GET ALL USERS
  // =========================
  async getUsers(requestingUserId: string) {
    const requestingUser = await this.getUserById(requestingUserId);
    if (requestingUser.role !== Role.admin) {
      throw new BadRequestException(
        'Seul un administrateur peut voir tous les utilisateurs',
      );
    }
    return this.prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        role: true,
        accountType: true,
        companyName: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // =========================
  // GET USER BY ID
  // =========================
  async getUserById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        role: true,
        accountType: true,
        companyName: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
    const existEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existEmail) throw new BadRequestException('Email déjà utilisé');

    if (dto.phone) {
      const existPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existPhone)
        throw new BadRequestException('Numéro de téléphone déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let profileImageUrl: string | null = null;
    if (profileImage) {
      const uploadResult = await this.cloudinaryService.uploadProfileImage(
        profileImage.buffer,
        `user-${Date.now()}-${profileImage.originalname}`,
      );
      profileImageUrl = uploadResult.secure_url;
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName ?? null,
        middleName: dto.middleName ?? null,
        lastName: dto.lastName ?? null,
        phone: dto.phone ?? null,
        role: dto.role ?? Role.owner,
        accountType: dto.accountType ?? null,
        companyName: dto.companyName ?? null,
        businessId: dto.businessId ?? null,
        address: dto.address ?? null,
        city: dto.city ?? 'Kinshasa',
        profileImage: profileImageUrl,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        role: true,
        accountType: true,
        companyName: true,
        profileImage: true,
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
    await this.getUserById(id);

    const data: any = {};

    Object.assign(data, {
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      phone: dto.phone,
      accountType: dto.accountType,
      companyName: dto.companyName,
      businessId: dto.businessId,
      address: dto.address,
      city: dto.city,
      profileImage: dto.profileImage,
      coverImage: dto.coverImage,
      role: dto.role,
      isActive: dto.isActive,
    });

    for (const key in data) if (data[key] === undefined) delete data[key];

    if (profileImage) {
      const uploadResult = await this.cloudinaryService.uploadProfileImage(
        profileImage.buffer,
        `user-${id}-${Date.now()}-${profileImage.originalname}`,
      );
      data.profileImage = uploadResult.secure_url;
    }

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
      data.passwordChangedAt = new Date();
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        role: true,
        accountType: true,
        companyName: true,
        profileImage: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  // =========================
  // SOFT DELETE USER
  // =========================
  async deleteUser(id: string) {
    await this.getUserById(id);

    return this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
      select: { id: true, email: true, isDeleted: true },
    });
  }

  // =========================
  // FIND USER BY EMAIL
  // =========================
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // =========================
  // CREATE OR GET TENANT
  // =========================
  async createOrGetTenant(ownerId: string, tenantData: Partial<CreateUserDto>) {
    if (!tenantData.email) {
      throw new Error('Email is required to create or get tenant');
    }

    let tenant = await this.prisma.user.findUnique({
      where: { email: tenantData.email },
    });

    if (!tenant) {
      tenant = await this.prisma.user.create({
        data: {
          email: tenantData.email,
          password: tenantData.password || 'default-temp-password',
          firstName: tenantData.firstName ?? null,
          lastName: tenantData.lastName ?? null,
          role: Role.tenant,
          isActive: true,
        },
      });
    }

    return tenant;
  }

  // =========================
  // ASSOCIATE TENANT TO PROPERTY
  // =========================
  async assignTenantToProperty(
    ownerId: string,
    propertyId: string,
    tenantEmail: string,
    leaseData: {
      rentAmount: number;
      currency?: Currency;
      deposit?: number;
      startDate: Date;
      endDate?: Date;
    },
  ) {
    const tenant = await this.createOrGetTenant(ownerId, {
      email: tenantEmail,
    });

    const existingLease = await this.prisma.lease.findFirst({
      where: {
        propertyId,
        tenantId: tenant.id,
        status: LeaseStatus.active,
      },
    });

    if (existingLease) {
      throw new BadRequestException(
        'Ce locataire a déjà un bail actif pour ce bien',
      );
    }

    return this.prisma.lease.create({
      data: {
        propertyId,
        tenantId: tenant.id,
        ownerId,
        rentAmount: leaseData.rentAmount,
        currency: leaseData.currency ?? Currency.USD,
        deposit: leaseData.deposit ?? 0,
        startDate: leaseData.startDate,
        endDate: leaseData.endDate ?? null,
        status: LeaseStatus.active,
      },
      include: { tenant: true, property: true },
    });
  }

  // =========================
  // ACTIVATE / DEACTIVATE TENANT
  // =========================
  async toggleTenantStatus(tenantId: string, isActive: boolean) {
    const tenant = await this.getUserById(tenantId);
    if (tenant.role !== Role.tenant) {
      throw new BadRequestException('Cet utilisateur n’est pas un locataire');
    }

    return this.prisma.user.update({
      where: { id: tenantId },
      data: { isActive },
      select: { id: true, email: true, isActive: true, updatedAt: true },
    });
  }

  // =========================
  // TENANT LEAVE PROPERTY
  // =========================
  async tenantLeaveProperty(tenantId: string, propertyId: string) {
    const lease = await this.prisma.lease.findFirst({
      where: { tenantId, propertyId, status: LeaseStatus.active },
    });

    if (!lease) {
      throw new NotFoundException(
        'Vous n’êtes pas associé à ce bien ou le bail est inactif',
      );
    }

    return this.prisma.lease.update({
      where: { id: lease.id },
      data: { status: LeaseStatus.terminated },
      select: { id: true, propertyId: true, tenantId: true, status: true },
    });
  }

  // =========================
  // GET TENANT PROPERTIES
  // =========================
  async getTenantProperties(tenantId: string) {
    return this.prisma.lease.findMany({
      where: { tenantId, status: LeaseStatus.active },
      include: { property: true, owner: true },
    });
  }
}

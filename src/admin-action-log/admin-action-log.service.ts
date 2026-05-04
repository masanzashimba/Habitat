import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateAdminActionLogDto } from './dto/create-admin-action-log.dto';
import { QueryAdminActionLogDto } from './dto/query-admin-action-log.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminActionLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAdminActionLogDto: CreateAdminActionLogDto) {
    const { adminId, action, entityType, entityId, description } =
      createAdminActionLogDto;

    // Verify admin exists
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Verify admin has admin role
    if (admin.role !== 'admin') {
      throw new ForbiddenException('User is not an admin');
    }

    return this.prisma.adminActionLog.create({
      data: {
        adminId,
        action,
        entity: entityType, // entity est requis, entityType est optionnel
        entityType,
        entityId,
        description,
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(
    queryDto: QueryAdminActionLogDto,
    userId: string,
    userRole: string,
  ) {
    // Only admins can view logs
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can view action logs');
    }

    const {
      action,
      entityType,
      entityId,
      adminId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = queryDto;

    // Build where clause
    const where: any = {};

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const total = await this.prisma.adminActionLog.count({ where });

    // Get logs with pagination
    const logs = await this.prisma.adminActionLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return {
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1,
      },
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    // Only admins can view logs
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can view action logs');
    }

    const log = await this.prisma.adminActionLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Admin action log not found');
    }

    return log;
  }

  async findByAdmin(
    adminId: string,
    queryDto: QueryAdminActionLogDto,
    userId: string,
    userRole: string,
  ) {
    // Only admins can view logs
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can view action logs');
    }

    // Verify admin exists
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role !== 'admin') {
      throw new NotFoundException('User is not an admin');
    }

    // Use findAll with adminId filter
    return this.findAll({ ...queryDto, adminId }, userId, userRole);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    queryDto: QueryAdminActionLogDto,
    userId: string,
    userRole: string,
  ) {
    // Only admins can view logs
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can view action logs');
    }

    // Use findAll with entity filters
    return this.findAll(
      { ...queryDto, entityType, entityId },
      userId,
      userRole,
    );
  }

  // Helper method to log admin actions automatically
  async logAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId: string,
    description?: string,
  ) {
    try {
      return await this.create({
        adminId,
        action,
        entityType,
        entityId,
        description,
      });
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      console.error('Failed to log admin action:', error);
      return null;
    }
  }

  // Helper methods for common actions
  async logUserAction(
    adminId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE',
    userId: string,
    description?: string,
  ) {
    return this.logAction(adminId, action, 'User', userId, description);
  }

  async logPropertyAction(
    adminId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT',
    propertyId: string,
    description?: string,
  ) {
    return this.logAction(adminId, action, 'Property', propertyId, description);
  }

  async logBookingAction(
    adminId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VALIDATE' | 'CANCEL',
    bookingId: string,
    description?: string,
  ) {
    return this.logAction(adminId, action, 'Booking', bookingId, description);
  }

  async logLeaseAction(
    adminId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'TERMINATE',
    leaseId: string,
    description?: string,
  ) {
    return this.logAction(adminId, action, 'Lease', leaseId, description);
  }

  async logContractAction(
    adminId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SIGN',
    contractId: string,
    description?: string,
  ) {
    return this.logAction(adminId, action, 'Contract', contractId, description);
  }

  async logTenantAction(
    adminId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    tenantId: string,
    description?: string,
  ) {
    return this.logAction(adminId, action, 'Tenant', tenantId, description);
  }

  // Statistics methods
  async getActionStats(
    startDate?: string,
    endDate?: string,
    userId?: string,
    userRole?: string,
  ) {
    // Only admins can view stats
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can view action statistics');
    }

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get action counts by type
    const actionStats = await this.prisma.adminActionLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    });

    // Get entity type counts
    const entityStats = await this.prisma.adminActionLog.groupBy({
      by: ['entityType'],
      where,
      _count: {
        entityType: true,
      },
      orderBy: {
        _count: {
          entityType: 'desc',
        },
      },
    });

    // Get admin activity
    const adminStats = await this.prisma.adminActionLog.groupBy({
      by: ['adminId'],
      where,
      _count: {
        adminId: true,
      },
      orderBy: {
        _count: {
          adminId: 'desc',
        },
      },
      take: 10,
    });

    // Get admin details for stats
    const adminIds = adminStats.map((stat) => stat.adminId);
    const admins = await this.prisma.user.findMany({
      where: {
        id: { in: adminIds },
      },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });

    const adminStatsWithDetails = adminStats.map((stat) => ({
      ...stat,
      admin: admins.find((admin) => admin.id === stat.adminId),
    }));

    // Get total count
    const totalActions = await this.prisma.adminActionLog.count({ where });

    return {
      totalActions,
      actionStats: actionStats.map((stat) => ({
        action: stat.action,
        count: stat._count.action,
      })),
      entityStats: entityStats.map((stat) => ({
        entityType: stat.entityType,
        count: stat._count.entityType,
      })),
      adminStats: adminStatsWithDetails.map((stat) => ({
        adminId: stat.adminId,
        admin: stat.admin,
        count: stat._count.adminId,
      })),
    };
  }
}

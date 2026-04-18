import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { TenantService } from './tenant.service';
import { PrismaService } from '../../prisma.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AssignTenantDto } from '../dto/assign-tenant.dto';
import { ToggleTenantStatusDto } from '../dto/toggle-tenant-status.dto';
import { TenantLeaveDto } from '../dto/tenant-leave.dto';
import { UnassignTenantDto } from '../dto/unassign-tenant.dto';

@UseGuards(JwtAccessGuard)
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
  ) {}

  private response(success: boolean, data: any = null, message: string = '') {
    return { success, data, message };
  }

  @Post()
  @UseInterceptors(FileInterceptor('profileImage'))
  async createOrGetTenant(
    @Request() req,
    @Body() dto: CreateTenantDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    if (!req.user || !req.user.userId) {
      return this.response(false, null, 'Utilisateur non authentifié');
    }

    const tenant = await this.tenantService.createOrGetTenant(
      req.user.userId,
      dto,
      profileImage,
    );
    return this.response(
      true,
      tenant,
      'Locataire récupéré ou créé avec succès',
    );
  }

  @Post('assign')
  async assignTenantToProperty(@Request() req, @Body() dto: AssignTenantDto) {
    if (!req.user || !req.user.userId) {
      return this.response(false, null, 'Utilisateur non authentifié');
    }

    const lease = await this.tenantService.assignTenantToProperty(
      req.user.userId,
      dto,
    );
    return this.response(true, lease, 'Locataire associé au bien avec succès');
  }

  @Put(':id/status')
  async toggleTenantStatus(
    @Param('id') tenantId: string,
    @Body() dto: ToggleTenantStatusDto,
  ) {
    const tenant = await this.tenantService.toggleTenantStatus(
      tenantId,
      dto.isActive,
    );
    return this.response(
      true,
      tenant,
      `Locataire ${dto.isActive ? 'activé' : 'désactivé'} avec succès`,
    );
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateTenant(
    @Param('id') tenantId: string,
    @Body() dto: UpdateTenantDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    const tenant = await this.tenantService.updateTenant(
      tenantId,
      dto,
      profileImage,
    );
    return this.response(true, tenant, 'Locataire mis à jour avec succès');
  }

  @Post('leave')
  async tenantLeaveProperty(@Request() req, @Body() dto: TenantLeaveDto) {
    const lease = await this.tenantService.tenantLeaveProperty(
      req.user.userId,
      dto.propertyId,
    );
    return this.response(true, lease, 'Vous avez quitté le bien avec succès');
  }

  @Post('unassign')
  async unassignTenantFromProperty(
    @Request() req,
    @Body() dto: UnassignTenantDto,
  ) {
    if (!req.user || !req.user.userId) {
      return this.response(false, null, 'Utilisateur non authentifié');
    }

    const lease = await this.tenantService.tenantLeaveProperty(
      dto.tenantId,
      dto.propertyId,
    );
    return this.response(
      true,
      lease,
      'Locataire désassigné du bien avec succès',
    );
  }

  @Get('properties')
  async getTenantProperties(@Request() req) {
    const leases = await this.tenantService.getTenantProperties(
      req.user.userId,
    );
    return this.response(true, leases, 'Liste des biens récupérée avec succès');
  }

  @Get('owner/all')
  async getOwnerTenants(@Request() req) {
    const tenants = await this.tenantService.getOwnerTenants(req.user.userId);
    return this.response(
      true,
      tenants,
      'Liste des locataires récupérée avec succès',
    );
  }

  @Get('landlord')
  async getTenantLandlord(@Request() req) {
    // Trouver le tenant associé à cet utilisateur
    const tenant = await this.prisma.tenant.findFirst({
      where: { userId: req.user.userId },
    });

    if (!tenant) {
      return this.response(false, null, 'Locataire non trouvé');
    }

    const landlord = await this.tenantService.getTenantLandlord(tenant.id);
    return this.response(true, landlord, 'Bailleur récupéré avec succès');
  }
}

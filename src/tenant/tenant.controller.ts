import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ParseUUIDPipe,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AssignTenantDto } from './dto/assign-tenant.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAccessGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  private response(success: boolean, data: any = null, message: string = '') {
    return { success, data, message };
  }

  // =============================
  // CREATE TENANT
  // =============================
  @Post()
  @UseInterceptors(FileInterceptor('profileImage'))
  async create(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser('userId') ownerId: string,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    const tenant = await this.tenantService.create(
      createTenantDto,
      ownerId,
      profileImage,
    );
    return this.response(true, tenant, 'Locataire créé avec succès');
  }

  // =============================
  // GET ALL TENANTS (OWNER)
  // =============================
  @Get()
  async findAll(
    @CurrentUser('userId') ownerId: string,
    @CurrentUser('role') userRole: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    const result = await this.tenantService.findAll(
      ownerId,
      userRole,
      pageNum,
      limitNum,
    );
    return this.response(true, result, 'Liste des locataires récupérée');
  }

  // =============================
  // GET ALL TENANTS OF CURRENT OWNER
  // =============================
  @Get('owner/all')
  async getOwnerTenants(@CurrentUser('userId') ownerId: string) {
    const tenants = await this.tenantService.findByOwner(ownerId, ownerId);
    return this.response(true, tenants, 'Locataires du propriétaire récupérés');
  }

  // =============================
  // GET LANDLORD INFO (for tenant)
  // =============================
  @Get('landlord')
  async getLandlord(@CurrentUser('userId') userId: string) {
    const landlord = await this.tenantService.getLandlordInfo(userId);
    return this.response(
      true,
      landlord,
      'Informations du propriétaire récupérées',
    );
  }

  // =============================
  // GET TENANT BY ID
  // =============================
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const tenant = await this.tenantService.findOne(id, userId);
    return this.response(true, tenant, 'Locataire récupéré avec succès');
  }

  // =============================
  // UPDATE TENANT
  // =============================
  @Put(':id')
  @UseInterceptors(FileInterceptor('profileImage'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser('userId') userId: string,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    const tenant = await this.tenantService.update(
      id,
      updateTenantDto,
      userId,
      profileImage,
    );
    return this.response(true, tenant, 'Locataire mis à jour avec succès');
  }

  // =============================
  // DELETE TENANT
  // =============================
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.tenantService.remove(id, userId);
    return this.response(true, null, 'Locataire supprimé avec succès');
  }

  // =============================
  // GET TENANTS BY OWNER
  // =============================
  @Get('owner/:ownerId')
  async findByOwner(
    @Param('ownerId', ParseUUIDPipe) ownerId: string,
    @CurrentUser('userId') currentUserId: string,
  ) {
    const tenants = await this.tenantService.findByOwner(
      ownerId,
      currentUserId,
    );
    return this.response(true, tenants, 'Locataires du propriétaire récupérés');
  }

  // =============================
  // ASSIGN TENANT TO PROPERTY
  // =============================
  @Post('assign')
  async assignToProperty(
    @Body() assignTenantDto: AssignTenantDto,
    @CurrentUser('userId') ownerId: string,
  ) {
    const result = await this.tenantService.assignToProperty(
      assignTenantDto,
      ownerId,
    );
    return this.response(true, result, 'Locataire assigné à la propriété');
  }

  // =============================
  // UNASSIGN TENANT FROM PROPERTY
  // =============================
  @Post('unassign')
  async unassignFromProperty(
    @Body() body: { tenantId: string; propertyId: string },
    @CurrentUser('userId') ownerId: string,
    @Request() req: any,
  ) {
    const userRole = req.user?.role || 'owner';
    const result = await this.tenantService.unassignFromProperty(
      body.tenantId,
      body.propertyId,
      ownerId,
      userRole,
    );
    return this.response(true, result, 'Locataire désassigné de la propriété');
  }

  // =============================
  // GET TENANT PROPERTIES
  // =============================
  @Get('my/properties')
  async getMyProperties(@CurrentUser('userId') userId: string) {
    const properties = await this.tenantService.getTenantProperties(userId);
    return this.response(
      true,
      properties,
      'Propriétés du locataire récupérées',
    );
  }

  // =============================
  // GET TENANT LEASES
  // =============================
  @Get(':id/leases')
  async getTenantLeases(
    @Param('id', ParseUUIDPipe) tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const leases = await this.tenantService.getTenantLeases(tenantId, userId);
    return this.response(true, leases, 'Baux du locataire récupérés');
  }
}

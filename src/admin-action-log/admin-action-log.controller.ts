import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminActionLogService } from './admin-action-log.service';
import { CreateAdminActionLogDto } from './dto/create-admin-action-log.dto';
import { QueryAdminActionLogDto } from './dto/query-admin-action-log.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin-logs')
@UseGuards(JwtAccessGuard)
export class AdminActionLogController {
  constructor(private readonly adminActionLogService: AdminActionLogService) {}

  @Post()
  create(@Body() createAdminActionLogDto: CreateAdminActionLogDto) {
    return this.adminActionLogService.create(createAdminActionLogDto);
  }

  @Get()
  findAll(
    @Query() queryDto: QueryAdminActionLogDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.adminActionLogService.findAll(queryDto, userId, userRole);
  }

  @Get('stats')
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser('userId') userId?: string,
    @CurrentUser('role') userRole?: string,
  ) {
    return this.adminActionLogService.getActionStats(
      startDate,
      endDate,
      userId,
      userRole,
    );
  }

  @Get('admin/:adminId')
  findByAdmin(
    @Param('adminId') adminId: string,
    @Query() queryDto: QueryAdminActionLogDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.adminActionLogService.findByAdmin(
      adminId,
      queryDto,
      userId,
      userRole,
    );
  }

  @Get('entity/:entityType/:entityId')
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() queryDto: QueryAdminActionLogDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.adminActionLogService.findByEntity(
      entityType,
      entityId,
      queryDto,
      userId,
      userRole,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.adminActionLogService.findOne(id, userId, userRole);
  }
}

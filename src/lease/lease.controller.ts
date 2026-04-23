import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LeaseService } from './lease.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { UpdateLeaseStatusDto } from './dto/update-lease-status.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leases')
@UseGuards(JwtAccessGuard)
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Post()
  create(
    @Body() createLeaseDto: CreateLeaseDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.leaseService.create(createLeaseDto, userId);
  }

  @Post('from-booking/:bookingId')
  createFromBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaseService.createFromBooking(bookingId, userId, userRole);
  }

  @Get()
  findAll(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaseService.findAll(userId, userRole);
  }

  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaseService.findByProperty(propertyId, userId, userRole);
  }

  @Get('tenant/:tenantId')
  findByTenant(
    @Param('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaseService.findByTenant(tenantId, userId, userRole);
  }

  @Get('owner/:ownerId')
  findByOwner(
    @Param('ownerId') ownerId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaseService.findByOwner(ownerId, userId, userRole);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaseService.findOne(id, userId, userRole);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateLeaseDto: UpdateLeaseDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaseService.update(id, updateLeaseDto, userId, userRole);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateLeaseStatusDto: UpdateLeaseStatusDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaseService.updateStatus(
      id,
      updateLeaseStatusDto.status,
      userId,
      userRole,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.leaseService.remove(id, userId, userRole);
  }
}

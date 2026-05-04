import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingStatus } from '@prisma/client';

@Controller('bookings')
@UseGuards(JwtAccessGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.bookingService.create(createBookingDto, userId);
  }

  @Get()
  findAll(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingService.findAll(userId, userRole);
  }

  @Get('my-bookings')
  findMyBookings(@CurrentUser('userId') userId: string) {
    return this.bookingService.findByUser(userId);
  }

  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingService.findByProperty(propertyId, userId, userRole);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.bookingService.findByUser(userId);
  }


  @Get('relations/owners')
  getMyOwnerRelations(@CurrentUser('userId') userId: string) {
    return this.bookingService.getTenantOwnerRelations(userId);
  }

  @Get('relations/owners/:ownerId')
  checkRelationWithOwner(
    @CurrentUser('userId') userId: string,
    @Param('ownerId') ownerId: string,
  ) {
    return this.bookingService.hasBookingRelation(userId, ownerId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingService.findOne(id, userId, userRole);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingService.update(id, updateBookingDto, userId, userRole);
  }

  @Put(':id/validate')
  validateBooking(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingService.validateBooking(id, userId, userRole, status);
  }

  @Put(':id/cancel')
  cancelBooking(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingService.cancelBooking(id, userId, userRole);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.bookingService.remove(id, userId, userRole);
  }
}

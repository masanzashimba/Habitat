import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
  findAll(@CurrentUser('userId') userId: string) {
    return this.bookingService.findAll(userId);
  }

  @Get('my-bookings')
  findMyBookings(@CurrentUser('userId') userId: string) {
    return this.bookingService.findByUser(userId);
  }

  @Get('property/:propertyId')
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.bookingService.findByProperty(propertyId);
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
  findOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.bookingService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.bookingService.update(id, updateBookingDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.bookingService.remove(id, userId);
  }
}

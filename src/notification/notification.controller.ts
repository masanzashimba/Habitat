import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAccessGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  findAll(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.notificationService.findAll(userId, userRole);
  }

  @Get('unread')
  findUnread(@CurrentUser('userId') userId: string) {
    return this.notificationService.findUnread(userId);
  }

  @Get('unread/count')
  getUnreadCount(@CurrentUser('userId') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.notificationService.markAsRead(id, userId, userRole);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.notificationService.findOne(id, userId, userRole);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.notificationService.update(
      id,
      updateNotificationDto,
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
    return this.notificationService.remove(id, userId, userRole);
  }
}

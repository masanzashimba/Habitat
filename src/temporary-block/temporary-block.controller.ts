import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { TemporaryBlockService } from './temporary-block.service';
import { CreateTemporaryBlockDto } from './dto/create-temporary-block.dto';
import { QueryTemporaryBlockDto } from './dto/query-temporary-block.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('temporary-blocks')
@UseGuards(JwtAccessGuard)
export class TemporaryBlockController {
  constructor(private readonly temporaryBlockService: TemporaryBlockService) {}

  @Post()
  create(@Body() createTemporaryBlockDto: CreateTemporaryBlockDto) {
    return this.temporaryBlockService.create(createTemporaryBlockDto);
  }

  @Get('property/:propertyId')
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query() queryDto: QueryTemporaryBlockDto,
  ) {
    return this.temporaryBlockService.findByProperty(propertyId, queryDto);
  }

  @Get('property/:propertyId/availability')
  checkAvailability(
    @Param('propertyId') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.temporaryBlockService.checkAvailability(
      propertyId,
      startDate,
      endDate,
      sessionId,
    );
  }

  @Put('property/:propertyId/extend')
  extendBlock(
    @Param('propertyId') propertyId: string,
    @Body('sessionId') sessionId: string,
    @Body('additionalMinutes') additionalMinutes?: number,
  ) {
    return this.temporaryBlockService.extendBlock(
      propertyId,
      sessionId,
      additionalMinutes,
    );
  }

  @Get('cleanup')
  cleanup(@CurrentUser('role') userRole: string) {
    // Only admins can manually trigger cleanup
    if (userRole !== 'admin') {
      throw new Error('Only admins can trigger cleanup');
    }
    return this.temporaryBlockService.cleanup();
  }

  @Get('stats')
  getStats(@CurrentUser('role') userRole: string) {
    // Only admins can view stats
    if (userRole !== 'admin') {
      throw new Error('Only admins can view statistics');
    }
    return this.temporaryBlockService.getStats();
  }

  @Delete('session/:sessionId')
  removeBySession(@Param('sessionId') sessionId: string) {
    return this.temporaryBlockService.removeBySession(sessionId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.temporaryBlockService.remove(id);
  }
}

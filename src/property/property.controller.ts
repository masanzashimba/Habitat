import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post('create')
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.propertyService.create(createPropertyDto, userId, files);
  }

  @Public()
  @Get('all')
  findAll(@Req() req: any) {
    const userId = req.user?.sub;
    return this.propertyService.findAll(userId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.propertyService.update(id, updatePropertyDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propertyService.remove(id);
  }

  @Post(':id/favorite')
  toggleFavorite(
    @Param('id') propertyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.propertyService.toggleFavorite(propertyId, userId);
  }

  @Get('favorites')
  getUserFavorites(@CurrentUser('userId') userId: string) {
    return this.propertyService.getFavoritesByUser(userId);
  }

  @Get('secure')
  findSecure() {
    return this.propertyService.findSecure();
  }
}

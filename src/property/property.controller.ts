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
  ParseUUIDPipe,
  BadRequestException,
  Query,
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

  // =============================
  // CREATE
  // =============================
  @Post()
  @UseGuards(JwtAccessGuard)
  @UseInterceptors(FilesInterceptor('files', 10)) // max 10 images
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Au moins une image est requise');
    }

    return this.propertyService.create(createPropertyDto, userId, files);
  }

  // =============================
  // GET ALL
  // =============================
  @Public()
  @Get()
  findAll(@CurrentUser('userId') userId?: string) {
    return this.propertyService.findAll(userId, false); // false = ne pas inclure les indisponibles
  }

  // =============================
  // GET USER PROPERTIES
  // =============================
  @UseGuards(JwtAccessGuard)
  @Get('my-properties')
  getMyProperties(
    @CurrentUser('userId') userId: string,
    @Query('status') status?: 'available' | 'reserved' | 'rented',
  ) {
    return this.propertyService.findUserPropertiesByStatus(userId, status);
  }

  // =============================
  // GET OWNER PROPERTIES (alias for my-properties)
  // =============================
  @UseGuards(JwtAccessGuard)
  @Get('owner')
  getOwnerProperties(@CurrentUser('userId') userId: string) {
    return this.propertyService.findUserProperties(userId, true);
  }

  // =============================
  // FAVORITES
  // =============================
  @UseGuards(JwtAccessGuard)
  @Get('favorites')
  getUserFavorites(@CurrentUser('userId') userId: string) {
    console.log('🔍 getUserFavorites controller - userId:', userId);
    return this.propertyService.getFavoritesByUser(userId);
  }

  // =============================
  // GET ONE
  // =============================
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.findOne(id);
  }

  // =============================
  // TOGGLE FAVORITE
  // =============================
  @UseGuards(JwtAccessGuard)
  @Post(':id/favorite')
  toggleFavorite(
    @Param('id', ParseUUIDPipe) propertyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.propertyService.toggleFavorite(propertyId, userId);
  }

  // =============================
  // UPDATE
  // =============================
  @UseGuards(JwtAccessGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.propertyService.update(
      id,
      userId, // 🔥 IMPORTANT
      updatePropertyDto,
      file,
    );
  }

  // =============================
  // UPDATE STATUS
  // =============================
  @UseGuards(JwtAccessGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: 'available' | 'reserved' | 'rented',
    @CurrentUser('userId') userId: string,
  ) {
    return this.propertyService.updateStatus(id, status, userId);
  }

  // =============================
  // DELETE
  // =============================
  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.propertyService.remove(id, userId); // 🔥 IMPORTANT
  }

  // =============================
  // SECURE TEST
  // =============================
  @UseGuards(JwtAccessGuard)
  @Get('secure')
  findSecure() {
    return this.propertyService.findSecure();
  }
}

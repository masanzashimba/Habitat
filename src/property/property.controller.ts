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
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
// import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { JwtCookieGuard } from 'src/auth/jwt-cookie.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post('create')
  @UseGuards(JwtCookieGuard)
  @UseInterceptors(FilesInterceptor('file'))
  create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Req() req: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const userId = req.user?.sub; // injecté par JwtCookieGuard
    return this.propertyService.create(createPropertyDto, userId, files);
  }

  @Get('all')
  @UseGuards(JwtCookieGuard) // ✅ on vérifie via cookie httpOnly
  findAll(@Req() req: any) {
    const userId = req.user?.sub; // ton JwtCookieGuard met payload dans req.user
    return this.propertyService.findAll(userId);
  }

  @Post(':id/favorite')
  @UseGuards(JwtCookieGuard)
  async toggleFavorite(@Param('id') propertyId: string, @Req() req: any) {
    const userId = req.user?.sub;
    if (!userId) throw new Error('User ID is required');
    return this.propertyService.toggleFavorite(propertyId, userId);
  }
  @Get('favorites')
  @UseGuards(JwtCookieGuard)
  async getUserFavorites(@Req() req: any) {
    const userId = req.user?.sub;
    if (!userId) throw new Error('User ID is required');
    return this.propertyService.getFavoritesByUser(userId);
  }

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
  @Get('secure')
  @UseGuards(JwtCookieGuard)
  findSecure() {
    return this.propertyService.findSecure();
  }
}

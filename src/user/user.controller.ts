import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@UseGuards(JwtAccessGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private response(success: boolean, data: any = null, message: string = '') {
    return { success, data, message };
  }

  // =========================
  // Tous les utilisateurs (admin)
  // =========================
  @Get('all')
  async findAll(@Request() req: any) {
    const users = await this.userService.getUsers(req.user.id);
    return this.response(
      true,
      users,
      'Liste des utilisateurs récupérée avec succès',
    );
  }

  // =========================
  // Profil connecté (⚠️ doit être AVANT :id)
  // =========================
  @Get('me')
  async getProfile(@Request() req: any) {
    const user = await this.userService.getUserById(req.user.id);
    return this.response(true, user, 'Profil récupéré avec succès');
  }

  // =========================
  // Un utilisateur par ID
  // =========================
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);
    return this.response(true, user, 'Utilisateur trouvé');
  }

  // =========================
  // Créer un utilisateur (register)
  // =========================
  @Post('create')
  @UseInterceptors(FileInterceptor('profileImage'))
  async create(
    @Body() dto: CreateUserDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    const user = await this.userService.createUser(dto, profileImage);
    return this.response(true, user, 'Utilisateur créé avec succès');
  }

  // =========================
  // Mettre à jour un utilisateur
  // =========================
  @Put(':id')
  @UseInterceptors(FileInterceptor('profileImage'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    const user = await this.userService.updateUser(id, dto, profileImage);
    return this.response(true, user, 'Utilisateur mis à jour');
  }

  // =========================
  // Supprimer un utilisateur (soft delete)
  // =========================
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return this.response(true, null, 'Utilisateur supprimé');
  }
}

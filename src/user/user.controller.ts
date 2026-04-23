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
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto, ChangePasswordDto } from './dto/create-user.dto';
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
    const users = await this.userService.getUsers(req.user.userId);
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
    const user = await this.userService.getUserById(req.user.userId);
    return this.response(true, user, 'Profil récupéré avec succès');
  }

  // =========================
  // Profil connecté avec relations
  // =========================
  @Get('me/full')
  async getFullProfile(@Request() req: any) {
    const user = await this.userService.getUserWithRelations(req.user.userId);
    return this.response(true, user, 'Profil complet récupéré avec succès');
  }

  // =========================
  // Mettre à jour le profil connecté
  // =========================
  @Put('me')
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateUserDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    const user = await this.userService.updateUser(
      req.user.userId,
      dto,
      profileImage,
    );
    return this.response(true, user, 'Profil mis à jour avec succès');
  }

  // =========================
  // Changer le mot de passe
  // =========================
  @Put('me/password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    const result = await this.userService.changePassword(req.user.userId, dto);
    return this.response(true, result, 'Mot de passe modifié avec succès');
  }

  // =========================
  // Statistiques de l'utilisateur connecté
  // =========================
  @Get('me/stats')
  async getMyStats(@Request() req: any) {
    const stats = await this.userService.getUserStats(req.user.userId);
    return this.response(true, stats, 'Statistiques récupérées avec succès');
  }

  // =========================
  // Propriétés de l'utilisateur connecté
  // =========================
  @Get('me/properties')
  async getMyProperties(@Request() req: any) {
    const properties = await this.userService.getUserProperties(
      req.user.userId,
    );
    return this.response(true, properties, 'Propriétés récupérées avec succès');
  }

  // =========================
  // Réservations de l'utilisateur connecté
  // =========================
  @Get('me/bookings')
  async getMyBookings(@Request() req: any) {
    const bookings = await this.userService.getUserBookings(req.user.userId);
    return this.response(true, bookings, 'Réservations récupérées avec succès');
  }

  // =========================
  // Baux de l'utilisateur connecté (en tant que locataire)
  // =========================
  @Get('me/leases')
  async getMyLeases(@Request() req: any) {
    const leases = await this.userService.getUserLeases(req.user.userId);
    return this.response(true, leases, 'Baux récupérés avec succès');
  }

  // =========================
  // Notifications de l'utilisateur connecté
  // =========================
  @Get('me/notifications')
  async getMyNotifications(
    @Request() req: any,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const notifications = await this.userService.getUserNotifications(
      req.user.userId,
      unreadOnly === 'true',
    );
    return this.response(
      true,
      notifications,
      'Notifications récupérées avec succès',
    );
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
  // Un utilisateur par ID avec relations
  // =========================
  @Get(':id/full')
  async findOneWithRelations(@Param('id') id: string) {
    const user = await this.userService.getUserWithRelations(id);
    return this.response(true, user, 'Utilisateur trouvé avec relations');
  }

  // =========================
  // Statistiques d'un utilisateur
  // =========================
  @Get(':id/stats')
  async getUserStats(@Param('id') id: string) {
    const stats = await this.userService.getUserStats(id);
    return this.response(true, stats, 'Statistiques récupérées avec succès');
  }

  // =========================
  // Propriétés d'un utilisateur
  // =========================
  @Get(':id/properties')
  async getUserProperties(@Param('id') id: string) {
    const properties = await this.userService.getUserProperties(id);
    return this.response(true, properties, 'Propriétés récupérées avec succès');
  }

  // =========================
  // Réservations d'un utilisateur
  // =========================
  @Get(':id/bookings')
  async getUserBookings(@Param('id') id: string) {
    const bookings = await this.userService.getUserBookings(id);
    return this.response(true, bookings, 'Réservations récupérées avec succès');
  }

  // =========================
  // Baux d'un utilisateur (en tant que locataire)
  // =========================
  @Get(':id/leases')
  async getUserLeases(@Param('id') id: string) {
    const leases = await this.userService.getUserLeases(id);
    return this.response(true, leases, 'Baux récupérés avec succès');
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
  // Désactiver un utilisateur
  // =========================
  @Put(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    const user = await this.userService.deactivateUser(id);
    return this.response(true, user, 'Utilisateur désactivé');
  }

  // =========================
  // Activer un utilisateur
  // =========================
  @Put(':id/activate')
  async activate(@Param('id') id: string) {
    const user = await this.userService.activateUser(id);
    return this.response(true, user, 'Utilisateur activé');
  }

  // =========================
  // Supprimer un utilisateur (hard delete)
  // =========================
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.userService.deleteUser(id);
    return this.response(true, result, 'Utilisateur supprimé');
  }
}

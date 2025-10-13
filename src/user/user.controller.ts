import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private response(success: boolean, data: any = null, message: string = '') {
    return { success, data, message };
  }

  @Get()
  async findAll() {
    const users = await this.userService.getUsers();
    return this.response(true, users, 'Liste des utilisateurs récupérée avec succès');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);
    return this.response(true, user, 'Utilisateur trouvé');
  }

  @Post('create')
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.createUser(dto);
    return this.response(true, user, 'Utilisateur créé avec succès');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.userService.updateUser(id, dto);
    return this.response(true, user, 'Utilisateur mis à jour');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return this.response(true, null, 'Utilisateur supprimé');
  }
  @UseGuards(AuthGuard('jwt'))
@Get('me')
async getProfile(@Request() req) {
  return req.user; 
}
}

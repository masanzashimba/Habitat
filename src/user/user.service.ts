import { PrismaService } from './../prisma.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { access } from 'fs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true } });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur avec l'id ${id} introuvable`);
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const exist = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exist) throw new BadRequestException('Email déjà utilisé');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({ data: { ...dto, password: hashedPassword } });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.getUserById(id); // check existence
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async deleteUser(id: string) {
    await this.getUserById(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  

}
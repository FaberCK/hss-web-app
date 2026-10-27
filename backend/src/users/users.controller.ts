import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import * as express from 'express';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { User } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(RolesGuard) // Applies the guard to all routes in this controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('invite')
  @Roles('ADMIN') // Restrict user invitation to ADMINs
  @HttpCode(HttpStatus.CREATED)
  async invite(@Body() inviteUserDto: InviteUserDto): Promise<User> {
    return this.usersService.inviteUser(inviteUserDto);
  }

  @Get()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: express.Request): Promise<User[]> {
    return this.usersService.findAllUsers(req.user!.activeScopes);
  }
}

import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  async invite(@Body() inviteUserDto: InviteUserDto): Promise<User> {
    return this.usersService.inviteUser(inviteUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<User[]> {
    return this.usersService.findAllUsers();
  }
}

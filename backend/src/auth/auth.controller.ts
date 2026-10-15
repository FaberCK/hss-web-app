import { Controller, Post, Get, Req, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

/**
 * Controller handling authentication routes.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(loginDto);
  }

  // New endpoint for the frontend to fetch the current user's active scope permissions
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getProfile(@Req() req: express.Request) {
    return req.user; // Returns the UserContext object populated by AuthContextMiddleware
  }
}
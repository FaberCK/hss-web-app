import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '../shared/shared.module';
import { AuthContextMiddleware } from './middlewares/auth-context.middleware';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    SharedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  exports: [JwtModule, AuthContextMiddleware],
  controllers: [AuthController],
  providers: [AuthService, AuthContextMiddleware],
})
export class AuthModule {}
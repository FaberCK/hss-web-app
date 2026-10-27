import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { Organization, Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Roles(Role.ADMIN)
  async findAll(@Req() req: express.Request): Promise<Organization[]> {
    return this.organizationsService.findAvailable(req.user!.organizationId);
  }
}
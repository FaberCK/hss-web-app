import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { HubsService } from './hubs.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubPropertiesDto } from './dto/update-hub-properties.dto';
import { Hub, Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('hubs')
@UseGuards(RolesGuard)
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createHubDto: CreateHubDto, @Req() req: express.Request): Promise<Hub> {
    return this.hubsService.createHub(createHubDto, req.user!.activeScopes);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: express.Request): Promise<Hub[]> {
    return this.hubsService.findAllHubs(req.user!.activeScopes);
  }

  @Patch(':id/properties')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateProperties(
    @Param('id') id: string,
    @Body() updateDto: UpdateHubPropertiesDto,
    @Req() req: express.Request,
  ): Promise<Hub> {
    return this.hubsService.updateHubProperties(id, updateDto, req.user!.activeScopes);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: express.Request): Promise<Hub> {
    return this.hubsService.deleteHub(id, req.user!.activeScopes);
  }
}
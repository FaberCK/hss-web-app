import { Controller, Get, Req, HttpCode, HttpStatus } from '@nestjs/common';
import * as express from 'express';
import { DashboardService, ScopeSummary } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async getSummary(@Req() req: express.Request): Promise<ScopeSummary> {
    const activeScopeId = req.headers['x-hss-scope-id'] as string;
    return this.dashboardService.getScopeSummary(activeScopeId);
  }
}
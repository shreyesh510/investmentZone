import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(
    @Request() req: any,
    @Query('timeframe') timeframe: string = '1M',
    @Query('year') year?: string,
    @Query('customStartDate') customStartDate?: string,
    @Query('customEndDate') customEndDate?: string,
  ) {
    const userId = req.user.userId;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    return await this.dashboardService.getConsolidatedDashboard(
      userId,
      timeframe,
      targetYear,
      customStartDate,
      customEndDate
    );
  }
}

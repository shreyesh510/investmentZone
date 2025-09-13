import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Request() req: any, @Query('days') days?: string) {
    const userId = req.user.userId;
    const daysNumber = days ? parseInt(days, 10) : 30;

    return await this.dashboardService.getDashboardSummary(userId, daysNumber);
  }

  @Get('positions')
  async getPositions(
    @Request() req: any,
    @Query('timeframe') timeframe: string = '1M',
  ) {
    const userId = req.user.userId;
    return await this.dashboardService.getPositionsData(userId, timeframe);
  }

  @Get('wallets')
  async getWallets(
    @Request() req: any,
    @Query('timeframe') timeframe: string = '1M',
  ) {
    const userId = req.user.userId;
    return await this.dashboardService.getWalletsData(userId, timeframe);
  }

  @Get('trade-pnl')
  async getTradePnL(
    @Request() req: any,
    @Query('timeframe') timeframe: string = '1M',
  ) {
    const userId = req.user.userId;
    return await this.dashboardService.getTradePnLData(userId, timeframe);
  }

  @Get('transactions')
  async getTransactions(
    @Request() req: any,
    @Query('timeframe') timeframe: string = '1M',
  ) {
    const userId = req.user.userId;
    return await this.dashboardService.getTransactionsData(userId, timeframe);
  }
}

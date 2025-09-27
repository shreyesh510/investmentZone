import { Injectable } from '@nestjs/common';
import { DepositsService } from '../deposits/deposits.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { TradePnLService } from '../trade-pnl/trade-pnl.service';

export interface UnifiedDashboardSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  totalTrades: number;
  totalProfit: number;
  totalLoss: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly depositsService: DepositsService,
    private readonly withdrawalsService: WithdrawalsService,
    private readonly tradePnLService: TradePnLService,
  ) {}

  async getUnifiedSummary(userId: string): Promise<UnifiedDashboardSummary> {
    try {
      // Fetch all data in parallel
      const [deposits, withdrawals, tradePnLData] = await Promise.all([
        this.depositsService.list(userId),
        this.withdrawalsService.list(userId),
        this.tradePnLService.findAll(userId),
      ]);

      // Calculate total deposits
      const totalDeposits = deposits.reduce((sum, deposit) => {
        return sum + (deposit.amount || 0);
      }, 0);

      // Calculate total withdrawals
      const totalWithdrawals = withdrawals.reduce((sum, withdrawal) => {
        return sum + (withdrawal.amount || 0);
      }, 0);

      // Calculate trade statistics
      const totalTrades = tradePnLData.length;

      const totalProfit = tradePnLData.reduce((sum, trade) => {
        return sum + (trade.profit || 0);
      }, 0);

      const totalLoss = tradePnLData.reduce((sum, trade) => {
        return sum + (trade.loss || 0);
      }, 0);

      return {
        totalDeposits,
        totalWithdrawals,
        totalTrades,
        totalProfit,
        totalLoss,
      };
    } catch (error) {
      console.error('Error getting unified dashboard summary:', error);
      // Return default values if there's an error
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalTrades: 0,
        totalProfit: 0,
        totalLoss: 0,
      };
    }
  }
}
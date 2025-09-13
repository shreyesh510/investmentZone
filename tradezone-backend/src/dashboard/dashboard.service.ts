import { Injectable } from '@nestjs/common';
import { PositionsService } from '../positions/positions.service';
import { WalletsService } from '../wallets/wallets.service';
import { DepositsService } from '../deposits/deposits.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { TradePnLService } from '../trade-pnl/trade-pnl.service';

export interface DashboardSummary {
  positions: {
    totalPositions: number;
    totalInvested: number;
    totalPnL: number;
  };
  wallets: {
    dematWallet: {
      balance: number;
      currency: string;
      count: number;
    };
    bankWallet: {
      balance: number;
      currency: string;
      count: number;
    };
    recentActivity: any[];
  };
  transactions: {
    deposits: {
      list: any[];
      total: number;
      pending: number;
      completed: number;
      recentActivity: any[];
      chartData: {
        weekly: any[];
        monthly: any[];
        yearly: any[];
      };
    };
    withdrawals: {
      list: any[];
      total: number;
      pending: number;
      completed: number;
      recentActivity: any[];
      chartData: {
        weekly: any[];
        monthly: any[];
        yearly: any[];
      };
    };
  };
  tradePnL: {
    today: {
      profit: number;
      loss: number;
      netPnL: number;
      trades: number;
    };
    recent: any[];
    statistics: any;
    chartData: {
      weekly: any[];
      monthly: any[];
      yearly: any[];
    };
  };
}

@Injectable()
export class DashboardService {
  private getDateRangeFromTimeframe(timeframe: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case '1D':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'ALL':
        startDate = new Date(2020, 0, 1); // Set to a very early date
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1); // Default to 1 month
    }

    return { startDate, endDate };
  }

  private filterByDateRange<T extends { createdAt?: any; requestedAt?: any; date?: any; timestamp?: any }>(
    data: T[],
    startDate: Date,
    endDate: Date,
  ): T[] {
    return data.filter((item) => {
      // Try different date fields
      const dateValue = item.createdAt || item.requestedAt || item.date || item.timestamp;
      if (!dateValue) return false;

      const itemDate = new Date(dateValue);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }
  constructor(
    private readonly positionsService: PositionsService,
    private readonly walletsService: WalletsService,
    private readonly depositsService: DepositsService,
    private readonly withdrawalsService: WithdrawalsService,
    private readonly tradePnLService: TradePnLService,
  ) {}

  async getDashboardSummary(
    userId: string,
    days: number = 30,
  ): Promise<DashboardSummary> {
    try {
      // Fetch all data in parallel for better performance with error handling
      const [
        openPositions,
        allPositions,
        wallets,
        deposits,
        withdrawals,
        recentTradePnL,
        tradePnLStats,
        walletHistory,
        allTradePnL,
      ] = await Promise.allSettled([
        this.positionsService.getOpenPositionsAggregated(userId),
        this.positionsService.findAll(userId),
        this.walletsService.list(userId),
        this.depositsService.list(userId),
        this.withdrawalsService.list(userId),
        this.tradePnLService.findAll(userId, days),
        this.tradePnLService.getStatistics(userId, days),
        this.walletsService.history(userId, 10), // Get recent 10 wallet activities
        this.tradePnLService.findAll(userId), // Get all trade PnL data for chart processing
      ]);

      // Extract data with fallbacks for failed promises
      const safeOpenPositions =
        openPositions.status === 'fulfilled' ? openPositions.value : [];
      const safeAllPositions =
        allPositions.status === 'fulfilled' ? allPositions.value : [];
      const safeWallets = wallets.status === 'fulfilled' ? wallets.value : [];
      const safeDeposits =
        deposits.status === 'fulfilled' ? deposits.value : [];
      const safeWithdrawals =
        withdrawals.status === 'fulfilled' ? withdrawals.value : [];
      const safeRecentTradePnL =
        recentTradePnL.status === 'fulfilled' ? recentTradePnL.value : [];
      const safeTradePnLStats =
        tradePnLStats.status === 'fulfilled' ? tradePnLStats.value : null;
      const safeWalletHistory =
        walletHistory.status === 'fulfilled' ? walletHistory.value : [];
      const safeAllTradePnL =
        allTradePnL.status === 'fulfilled' ? allTradePnL.value : [];

      // Process positions data
      const totalPnL = safeOpenPositions.reduce(
        (sum, pos) => sum + (pos.pnl || 0),
        0,
      );
      const totalInvested = safeOpenPositions.reduce(
        (sum, pos) => sum + (pos.investedAmount || 0),
        0,
      );

      // Process wallets data - separate by platform type
      const dematWallets = safeWallets.filter(
        (w) => w.platform === 'Delta Exchange' || w.platform === 'Groww',
      );
      const bankWallets = safeWallets.filter(
        (w) =>
          w.platform === 'Bank' ||
          w.platform === 'bank' ||
          !w.platform ||
          w.platform === 'Unknown',
      );

      // Calculate demat balance in USD (assuming conversion rate if needed)
      const dematBalanceUSD = dematWallets.reduce((sum, wallet) => {
        const balance = wallet.balance || 0;
        // If wallet currency is INR, convert to USD (approximate rate: 1 USD = 83 INR)
        return wallet.currency === 'INR' ? sum + balance / 83 : sum + balance;
      }, 0);

      // Bank balance in INR
      const bankBalanceINR = bankWallets.reduce(
        (sum, wallet) => sum + (wallet.balance || 0),
        0,
      );

      // Process deposits data
      const depositTotal = safeDeposits.reduce(
        (sum, deposit) => sum + (deposit.amount || 0),
        0,
      );
      const pendingDeposits = safeDeposits.filter(
        (d) => d.status === 'pending',
      ).length;
      const completedDeposits = safeDeposits.filter(
        (d) => d.status === 'completed',
      ).length;

      // Process withdrawals data
      const withdrawalTotal = safeWithdrawals.reduce(
        (sum, withdrawal) => sum + (withdrawal.amount || 0),
        0,
      );
      const pendingWithdrawals = safeWithdrawals.filter(
        (w) => w.status === 'pending',
      ).length;
      const completedWithdrawals = safeWithdrawals.filter(
        (w) => w.status === 'completed',
      ).length;

      // Process total trade PnL from statistics
      const totalData = {
        profit: safeTradePnLStats?.totalProfit || 0,
        loss: safeTradePnLStats?.totalLoss || 0,
        netPnL: safeTradePnLStats?.netPnL || 0,
        trades: safeTradePnLStats?.totalTrades || 0,
      };

      // Process chart data
      const chartData = this.processChartData(safeAllTradePnL);

      // Process withdrawals chart data
      const withdrawalChartData =
        this.processWithdrawalChartData(safeWithdrawals);

      // Get recent withdrawal activity (last 10)
      const recentWithdrawals = safeWithdrawals
        .sort(
          (a, b) =>
            new Date(b.requestedAt || 0).getTime() -
            new Date(a.requestedAt || 0).getTime(),
        )
        .slice(0, 10);

      // Process deposits chart data
      const depositChartData = this.processDepositChartData(safeDeposits);

      // Get recent deposit activity (last 10)
      const recentDeposits = safeDeposits
        .sort(
          (a, b) =>
            new Date(b.requestedAt || 0).getTime() -
            new Date(a.requestedAt || 0).getTime(),
        )
        .slice(0, 10);

      return {
        positions: {
          totalPositions: safeAllPositions.length,
          totalInvested,
          totalPnL,
        },
        wallets: {
          dematWallet: {
            balance: dematBalanceUSD,
            currency: 'USD',
            count: dematWallets.length,
          },
          bankWallet: {
            balance: bankBalanceINR,
            currency: 'INR',
            count: bankWallets.length,
          },
          recentActivity: safeWalletHistory,
        },
        transactions: {
          deposits: {
            list: safeDeposits,
            total: depositTotal,
            pending: pendingDeposits,
            completed: completedDeposits,
            recentActivity: recentDeposits,
            chartData: depositChartData,
          },
          withdrawals: {
            list: safeWithdrawals,
            total: withdrawalTotal,
            pending: pendingWithdrawals,
            completed: completedWithdrawals,
            recentActivity: recentWithdrawals,
            chartData: withdrawalChartData,
          },
        },
        tradePnL: {
          today: totalData,
          recent: safeRecentTradePnL,
          statistics: safeTradePnLStats,
          chartData,
        },
      };
    } catch (error) {
      console.error('Error in getDashboardSummary:', error);
      // Return safe fallback data instead of throwing
      return {
        positions: {
          totalPositions: 0,
          totalInvested: 0,
          totalPnL: 0,
        },
        wallets: {
          dematWallet: {
            balance: 0,
            currency: 'USD',
            count: 0,
          },
          bankWallet: {
            balance: 0,
            currency: 'INR',
            count: 0,
          },
          recentActivity: [],
        },
        transactions: {
          deposits: {
            list: [],
            total: 0,
            pending: 0,
            completed: 0,
            recentActivity: [],
            chartData: { weekly: [], monthly: [], yearly: [] },
          },
          withdrawals: {
            list: [],
            total: 0,
            pending: 0,
            completed: 0,
            recentActivity: [],
            chartData: { weekly: [], monthly: [], yearly: [] },
          },
        },
        tradePnL: {
          today: {
            profit: 0,
            loss: 0,
            netPnL: 0,
            trades: 0,
          },
          recent: [],
          statistics: null,
          chartData: { weekly: [], monthly: [], yearly: [] },
        },
      };
    }
  }

  private processChartData(allTradePnL: any[]): {
    weekly: any[];
    monthly: any[];
    yearly: any[];
  } {
    const weekly = this.aggregateByWeek(allTradePnL);
    const monthly = this.aggregateByMonth(allTradePnL);
    const yearly = this.aggregateByYear(allTradePnL);

    return { weekly, monthly, yearly };
  }

  private processChartDataWithDaily(allTradePnL: any[], timeframe: string): {
    daily?: any[];
    weekly: any[];
    monthly: any[];
    yearly: any[];
  } {
    const result: any = {
      weekly: this.aggregateByWeek(allTradePnL),
      monthly: this.aggregateByMonth(allTradePnL),
      yearly: this.aggregateByYear(allTradePnL),
    };

    // Add daily aggregation for shorter timeframes
    if (timeframe === '1D' || timeframe === '1W' || timeframe === '1M') {
      result.daily = this.aggregateByDay(allTradePnL);
    }

    return result;
  }

  private aggregateByDay(data: any[]): any[] {
    const dayMap = new Map<string, any>();

    data.forEach((item) => {
      if (!item.date) return;
      try {
        const date = new Date(item.date);
        if (isNaN(date.getTime())) return;
        const day = date.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (!dayMap.has(day)) {
          dayMap.set(day, {
            period: day,
            profit: 0,
            loss: 0,
            netPnL: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
          });
        }

        const dayData = dayMap.get(day)!;
        dayData.profit += item.profit || 0;
        dayData.loss += item.loss || 0;
        dayData.netPnL += item.netPnL || 0;
        dayData.totalTrades += item.totalTrades || 0;
        dayData.winningTrades += item.winningTrades || 0;
        dayData.losingTrades += item.losingTrades || 0;
      } catch (e) {
        return;
      }
    });

    return Array.from(dayMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateByWeek(data: any[]): any[] {
    const weekMap = new Map<string, any>();

    data.forEach((item) => {
      if (!item.date) return; // Skip items without dates
      try {
        const date = new Date(item.date);
        if (isNaN(date.getTime())) return; // Skip invalid dates
        const week = this.getWeekKey(date);

        if (!weekMap.has(week)) {
          weekMap.set(week, {
            period: week,
            profit: 0,
            loss: 0,
            netPnL: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
          });
        }

        const weekData = weekMap.get(week)!;
        weekData.profit += item.profit || 0;
        weekData.loss += item.loss || 0;
        weekData.netPnL += item.netPnL || 0;
        weekData.totalTrades += item.totalTrades || 0;
        weekData.winningTrades += item.winningTrades || 0;
        weekData.losingTrades += item.losingTrades || 0;
      } catch (e) {
        // Skip items with invalid dates
        return;
      }
    });

    return Array.from(weekMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateByMonth(data: any[]): any[] {
    const monthMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          period: month,
          profit: 0,
          loss: 0,
          netPnL: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
        });
      }

      const monthData = monthMap.get(month)!;
      monthData.profit += item.profit || 0;
      monthData.loss += item.loss || 0;
      monthData.netPnL += item.netPnL || 0;
      monthData.totalTrades += item.totalTrades || 0;
      monthData.winningTrades += item.winningTrades || 0;
      monthData.losingTrades += item.losingTrades || 0;
    });

    return Array.from(monthMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateByYear(data: any[]): any[] {
    const yearMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.date);
      const year = String(date.getFullYear());

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          period: year,
          profit: 0,
          loss: 0,
          netPnL: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.profit += item.profit || 0;
      yearData.loss += item.loss || 0;
      yearData.netPnL += item.netPnL || 0;
      yearData.totalTrades += item.totalTrades || 0;
      yearData.winningTrades += item.winningTrades || 0;
      yearData.losingTrades += item.losingTrades || 0;
    });

    return Array.from(yearMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const weekNumber = this.getWeekNumber(date);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private processWithdrawalChartData(withdrawals: any[]): {
    daily?: any[];
    weekly: any[];
    monthly: any[];
    yearly: any[];
  } {
    const daily = this.aggregateWithdrawalsByDay(withdrawals);
    const weekly = this.aggregateWithdrawalsByWeek(withdrawals);
    const monthly = this.aggregateWithdrawalsByMonth(withdrawals);
    const yearly = this.aggregateWithdrawalsByYear(withdrawals);

    return { daily, weekly, monthly, yearly };
  }

  private aggregateWithdrawalsByDay(data: any[]): any[] {
    const dayMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const day = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!dayMap.has(day)) {
        dayMap.set(day, {
          period: day,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const dayData = dayMap.get(day)!;
      dayData.totalAmount += item.amount || 0;
      dayData.count += 1;

      if (item.status === 'pending') {
        dayData.pendingAmount += item.amount || 0;
        dayData.pendingCount += 1;
      } else if (item.status === 'completed') {
        dayData.completedAmount += item.amount || 0;
        dayData.completedCount += 1;
      }
    });

    return Array.from(dayMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateWithdrawalsByWeek(data: any[]): any[] {
    const weekMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const week = this.getWeekKey(date);

      if (!weekMap.has(week)) {
        weekMap.set(week, {
          period: week,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const weekData = weekMap.get(week)!;
      weekData.totalAmount += item.amount || 0;
      weekData.count += 1;

      if (item.status === 'pending') {
        weekData.pendingAmount += item.amount || 0;
        weekData.pendingCount += 1;
      } else if (item.status === 'completed') {
        weekData.completedAmount += item.amount || 0;
        weekData.completedCount += 1;
      }
    });

    return Array.from(weekMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateWithdrawalsByMonth(data: any[]): any[] {
    const monthMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          period: month,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const monthData = monthMap.get(month)!;
      monthData.totalAmount += item.amount || 0;
      monthData.count += 1;

      if (item.status === 'pending') {
        monthData.pendingAmount += item.amount || 0;
        monthData.pendingCount += 1;
      } else if (item.status === 'completed') {
        monthData.completedAmount += item.amount || 0;
        monthData.completedCount += 1;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateWithdrawalsByYear(data: any[]): any[] {
    const yearMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const year = String(date.getFullYear());

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          period: year,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.totalAmount += item.amount || 0;
      yearData.count += 1;

      if (item.status === 'pending') {
        yearData.pendingAmount += item.amount || 0;
        yearData.pendingCount += 1;
      } else if (item.status === 'completed') {
        yearData.completedAmount += item.amount || 0;
        yearData.completedCount += 1;
      }
    });

    return Array.from(yearMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private processDepositChartData(deposits: any[]): {
    daily?: any[];
    weekly: any[];
    monthly: any[];
    yearly: any[];
  } {
    const daily = this.aggregateDepositsByDay(deposits);
    const weekly = this.aggregateDepositsByWeek(deposits);
    const monthly = this.aggregateDepositsByMonth(deposits);
    const yearly = this.aggregateDepositsByYear(deposits);

    return { daily, weekly, monthly, yearly };
  }

  private aggregateDepositsByDay(data: any[]): any[] {
    const dayMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const day = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!dayMap.has(day)) {
        dayMap.set(day, {
          period: day,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const dayData = dayMap.get(day)!;
      dayData.totalAmount += item.amount || 0;
      dayData.count += 1;

      if (item.status === 'pending') {
        dayData.pendingAmount += item.amount || 0;
        dayData.pendingCount += 1;
      } else if (item.status === 'completed') {
        dayData.completedAmount += item.amount || 0;
        dayData.completedCount += 1;
      }
    });

    return Array.from(dayMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateDepositsByWeek(data: any[]): any[] {
    const weekMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const week = this.getWeekKey(date);

      if (!weekMap.has(week)) {
        weekMap.set(week, {
          period: week,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const weekData = weekMap.get(week)!;
      weekData.totalAmount += item.amount || 0;
      weekData.count += 1;

      if (item.status === 'pending') {
        weekData.pendingAmount += item.amount || 0;
        weekData.pendingCount += 1;
      } else if (item.status === 'completed') {
        weekData.completedAmount += item.amount || 0;
        weekData.completedCount += 1;
      }
    });

    return Array.from(weekMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateDepositsByMonth(data: any[]): any[] {
    const monthMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          period: month,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const monthData = monthMap.get(month)!;
      monthData.totalAmount += item.amount || 0;
      monthData.count += 1;

      if (item.status === 'pending') {
        monthData.pendingAmount += item.amount || 0;
        monthData.pendingCount += 1;
      } else if (item.status === 'completed') {
        monthData.completedAmount += item.amount || 0;
        monthData.completedCount += 1;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private aggregateDepositsByYear(data: any[]): any[] {
    const yearMap = new Map<string, any>();

    data.forEach((item) => {
      const date = new Date(item.requestedAt || item.completedAt);
      const year = String(date.getFullYear());

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          period: year,
          totalAmount: 0,
          count: 0,
          pendingAmount: 0,
          completedAmount: 0,
          pendingCount: 0,
          completedCount: 0,
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.totalAmount += item.amount || 0;
      yearData.count += 1;

      if (item.status === 'pending') {
        yearData.pendingAmount += item.amount || 0;
        yearData.pendingCount += 1;
      } else if (item.status === 'completed') {
        yearData.completedAmount += item.amount || 0;
        yearData.completedCount += 1;
      }
    });

    return Array.from(yearMap.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  // New separate API methods - optimized to return all timeframe data
  async getPositionsData(userId: string, timeframe: string = 'ALL') {
    try {
      const [openPositions, allPositions] = await Promise.allSettled([
        this.positionsService.getOpenPositionsAggregated(userId),
        this.positionsService.findAll(userId),
      ]);

      const safeOpenPositions =
        openPositions.status === 'fulfilled' ? openPositions.value : [];
      const safeAllPositions =
        allPositions.status === 'fulfilled' ? allPositions.value : [];

      // Calculate summary data from ALL open positions (current totals)
      const totalPnL = safeOpenPositions.reduce(
        (sum, pos) => sum + (pos.pnl || 0),
        0,
      );
      const totalInvested = safeOpenPositions.reduce(
        (sum, pos) => sum + (pos.investedAmount || 0),
        0,
      );

      // Generate chart data for ALL timeframes at once
      const chartData = this.generatePositionsChartDataAllTimeframes(safeAllPositions);

      return {
        summary: {
          totalPositions: safeOpenPositions.length,
          totalInvested,
          totalPnL,
        },
        chartData, // Contains all timeframe data
        performance: {
          dayChange: totalPnL * 0.1, // Mock calculation
          percentChange:
            totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
        },
        allTimeframeData: true, // Indicates this contains all timeframe data
      };
    } catch (error) {
      console.error('Error in getPositionsData:', error);
      return {
        summary: { totalPositions: 0, totalInvested: 0, totalPnL: 0 },
        chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
        performance: { dayChange: 0, percentChange: 0 },
        allTimeframeData: true,
      };
    }
  }

  async getWalletsData(userId: string, timeframe: string = 'ALL') {
    try {
      const [wallets, walletHistory] = await Promise.allSettled([
        this.walletsService.list(userId),
        this.walletsService.history(userId, 500), // Get more history for all timeframes
      ]);

      const safeWallets = wallets.status === 'fulfilled' ? wallets.value : [];
      const safeWalletHistory =
        walletHistory.status === 'fulfilled' ? walletHistory.value : [];

      // Process wallets data - separate by platform type
      const dematWallets = safeWallets.filter(
        (w) => w.platform === 'Delta Exchange' || w.platform === 'Groww',
      );
      const bankWallets = safeWallets.filter(
        (w) =>
          w.platform === 'Bank' ||
          w.platform === 'bank' ||
          !w.platform ||
          w.platform === 'Unknown',
      );

      // Calculate current balances
      const dematBalanceUSD = dematWallets.reduce((sum, wallet) => {
        const balance = wallet.balance || 0;
        return wallet.currency === 'INR' ? sum + balance / 83 : sum + balance;
      }, 0);

      const bankBalanceINR = bankWallets.reduce(
        (sum, wallet) => sum + (wallet.balance || 0),
        0,
      );

      // Generate chart data for all timeframes
      const chartData = this.generateWalletChartData(safeWalletHistory, 'ALL');

      return {
        summary: {
          dematWallet: {
            balance: dematBalanceUSD,
            currency: 'USD',
            count: dematWallets.length,
          },
          bankWallet: {
            balance: bankBalanceINR,
            currency: 'INR',
            count: bankWallets.length,
          },
        },
        chartData, // Contains all timeframe data
        recentActivity: safeWalletHistory.slice(0, 10),
        allTimeframeData: true,
      };
    } catch (error) {
      console.error('Error in getWalletsData:', error);
      return {
        summary: {
          dematWallet: { balance: 0, currency: 'USD', count: 0 },
          bankWallet: { balance: 0, currency: 'INR', count: 0 },
        },
        chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
        recentActivity: [],
        allTimeframeData: true,
      };
    }
  }

  async getTradePnLData(userId: string, timeframe: string = 'ALL') {
    try {
      const [allTradePnL, tradePnLStats] = await Promise.allSettled([
        this.tradePnLService.findAll(userId), // Get ALL data at once
        this.tradePnLService.getStatistics(userId, 365), // Get stats for full year
      ]);

      const safeAllTradePnL =
        allTradePnL.status === 'fulfilled' ? allTradePnL.value : [];
      const safeTradePnLStats =
        tradePnLStats.status === 'fulfilled' ? tradePnLStats.value : null;

      // Calculate totals for all timeframes
      const allTimeframeTotals = this.calculateTradePnLByTimeframes(safeAllTradePnL);

      // Process chart data with all timeframes included
      const chartData = this.processChartDataWithDaily(safeAllTradePnL, 'ALL');

      return {
        allTimeframeTotals, // Contains totals for each timeframe
        statistics: safeTradePnLStats,
        chartData, // Contains daily, weekly, monthly, yearly data
        recent: safeAllTradePnL.slice(0, 10),
        allTimeframeData: true,
      };
    } catch (error) {
      console.error('Error in getTradePnLData:', error);
      return {
        allTimeframeTotals: {},
        statistics: null,
        chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
        recent: [],
        allTimeframeData: true,
      };
    }
  }

  async getTransactionsData(userId: string, timeframe: string = 'ALL') {
    try {
      const [deposits, withdrawals] = await Promise.allSettled([
        this.depositsService.list(userId),
        this.withdrawalsService.list(userId),
      ]);

      const safeDeposits =
        deposits.status === 'fulfilled' ? deposits.value : [];
      const safeWithdrawals =
        withdrawals.status === 'fulfilled' ? withdrawals.value : [];

      // Calculate totals for all timeframes
      const depositsByTimeframe = this.calculateTransactionsByTimeframes(safeDeposits);
      const withdrawalsByTimeframe = this.calculateTransactionsByTimeframes(safeWithdrawals);

      // Process chart data for all timeframes
      const withdrawalChartData = this.processWithdrawalChartData(safeWithdrawals);
      const depositChartData = this.processDepositChartData(safeDeposits);

      // Get recent activities
      const recentWithdrawals = safeWithdrawals
        .sort(
          (a, b) =>
            new Date(b.requestedAt || 0).getTime() -
            new Date(a.requestedAt || 0).getTime(),
        )
        .slice(0, 10);

      const recentDeposits = safeDeposits
        .sort(
          (a, b) =>
            new Date(b.requestedAt || 0).getTime() -
            new Date(a.requestedAt || 0).getTime(),
        )
        .slice(0, 10);

      return {
        depositsByTimeframe, // Contains totals for each timeframe
        withdrawalsByTimeframe, // Contains totals for each timeframe
        deposits: {
          chartData: depositChartData,
          recentActivity: recentDeposits,
        },
        withdrawals: {
          chartData: withdrawalChartData,
          recentActivity: recentWithdrawals,
        },
        allTimeframeData: true,
      };
    } catch (error) {
      console.error('Error in getTransactionsData:', error);
      return {
        depositsByTimeframe: {},
        withdrawalsByTimeframe: {},
        deposits: {
          chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
          recentActivity: [],
        },
        withdrawals: {
          chartData: { daily: [], weekly: [], monthly: [], yearly: [] },
          recentActivity: [],
        },
        allTimeframeData: true,
      };
    }
  }

  // Helper methods
  private getTimeframeDays(timeframe: string): number {
    switch (timeframe) {
      case '1D':
        return 1;
      case '1W':
        return 7;
      case '1M':
        return 30;
      case '3M':
        return 90;
      case '6M':
        return 180;
      case '1Y':
        return 365;
      case 'ALL':
        return 3650;
      default:
        return 30;
    }
  }

  private getHistoryLimit(timeframe: string): number {
    switch (timeframe) {
      case '1W':
        return 20;
      case '1M':
        return 50;
      case '1Y':
        return 200;
      case '5Y':
        return 500;
      default:
        return 50;
    }
  }

  private generatePositionsChartData(positions: any[], timeframe: string) {
    // Mock chart data generation for positions - this would be replaced with real data processing
    const mockData = {
      daily: Array.from({ length: 7 }, (_, i) => ({
        period: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        totalValue: Math.random() * 10000 + 45000,
        pnl: Math.random() * 500 - 250,
        count: positions.length + Math.floor(Math.random() * 3),
      })),
      weekly: Array.from({ length: 4 }, (_, i) => ({
        period: `2025-W${36 + i}`,
        totalValue: Math.random() * 15000 + 40000,
        pnl: Math.random() * 1000 - 500,
        count: positions.length + Math.floor(Math.random() * 5),
      })),
      monthly: Array.from({ length: 12 }, (_, i) => ({
        period: `${2025}-${String(i + 1).padStart(2, '0')}`,
        totalValue: Math.random() * 20000 + 35000,
        pnl: Math.random() * 2000 - 1000,
        count: positions.length + Math.floor(Math.random() * 8),
      })),
      yearly: Array.from({ length: 5 }, (_, i) => ({
        period: `${2021 + i}`,
        totalValue: Math.random() * 30000 + 30000,
        pnl: Math.random() * 5000 - 2500,
        count: positions.length + Math.floor(Math.random() * 10),
      })),
    };

    return mockData;
  }

  private generateWalletChartData(history: any[], timeframe: string) {
    // Mock chart data generation for wallets - this would be replaced with real data processing
    const mockData = {
      daily: Array.from({ length: 7 }, (_, i) => ({
        period: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        totalBalance: Math.random() * 5000 + 8000,
        deposits: Math.random() * 1000,
        withdrawals: Math.random() * 500,
      })),
      weekly: Array.from({ length: 4 }, (_, i) => ({
        period: `2025-W${36 + i}`,
        totalBalance: Math.random() * 8000 + 7000,
        deposits: Math.random() * 2000,
        withdrawals: Math.random() * 1000,
      })),
      monthly: Array.from({ length: 12 }, (_, i) => ({
        period: `${2025}-${String(i + 1).padStart(2, '0')}`,
        totalBalance: Math.random() * 10000 + 6000,
        deposits: Math.random() * 3000,
        withdrawals: Math.random() * 1500,
      })),
      yearly: Array.from({ length: 5 }, (_, i) => ({
        period: `${2021 + i}`,
        totalBalance: Math.random() * 15000 + 5000,
        deposits: Math.random() * 10000,
        withdrawals: Math.random() * 5000,
      })),
    };

    return mockData;
  }

  private generatePositionsChartDataAllTimeframes(positions: any[]) {
    return {
      daily: this.aggregatePositionsByDay(positions),
      weekly: this.aggregatePositionsByWeek(positions),
      monthly: this.aggregatePositionsByMonth(positions),
      yearly: this.aggregatePositionsByYear(positions),
    };
  }

  private aggregatePositionsByDay(positions: any[]): any[] {
    const dayMap = new Map<string, any>();

    positions.forEach((position) => {
      if (!position.createdAt && !position.timestamp) return;

      const date = new Date(position.createdAt || position.timestamp);
      if (isNaN(date.getTime())) return;

      const day = date.toISOString().split('T')[0];

      if (!dayMap.has(day)) {
        dayMap.set(day, {
          period: day,
          totalValue: 0,
          pnl: 0,
          count: 0,
        });
      }

      const dayData = dayMap.get(day)!;
      dayData.totalValue += position.investedAmount || 0;
      dayData.pnl += position.pnl || 0;
      dayData.count += 1;
    });

    return Array.from(dayMap.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  private aggregatePositionsByWeek(positions: any[]): any[] {
    const weekMap = new Map<string, any>();

    positions.forEach((position) => {
      if (!position.createdAt && !position.timestamp) return;

      const date = new Date(position.createdAt || position.timestamp);
      if (isNaN(date.getTime())) return;

      const week = this.getWeekKey(date);

      if (!weekMap.has(week)) {
        weekMap.set(week, {
          period: week,
          totalValue: 0,
          pnl: 0,
          count: 0,
        });
      }

      const weekData = weekMap.get(week)!;
      weekData.totalValue += position.investedAmount || 0;
      weekData.pnl += position.pnl || 0;
      weekData.count += 1;
    });

    return Array.from(weekMap.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  private aggregatePositionsByMonth(positions: any[]): any[] {
    const monthMap = new Map<string, any>();

    positions.forEach((position) => {
      if (!position.createdAt && !position.timestamp) return;

      const date = new Date(position.createdAt || position.timestamp);
      if (isNaN(date.getTime())) return;

      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          period: month,
          totalValue: 0,
          pnl: 0,
          count: 0,
        });
      }

      const monthData = monthMap.get(month)!;
      monthData.totalValue += position.investedAmount || 0;
      monthData.pnl += position.pnl || 0;
      monthData.count += 1;
    });

    return Array.from(monthMap.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  private aggregatePositionsByYear(positions: any[]): any[] {
    const yearMap = new Map<string, any>();

    positions.forEach((position) => {
      if (!position.createdAt && !position.timestamp) return;

      const date = new Date(position.createdAt || position.timestamp);
      if (isNaN(date.getTime())) return;

      const year = String(date.getFullYear());

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          period: year,
          totalValue: 0,
          pnl: 0,
          count: 0,
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.totalValue += position.investedAmount || 0;
      yearData.pnl += position.pnl || 0;
      yearData.count += 1;
    });

    return Array.from(yearMap.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateTradePnLByTimeframes(tradePnL: any[]) {
    const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];
    const result: any = {};

    timeframes.forEach(timeframe => {
      const { startDate, endDate } = this.getDateRangeFromTimeframe(timeframe);
      const filtered = this.filterByDateRange(tradePnL, startDate, endDate);

      result[timeframe] = {
        profit: filtered.reduce((sum, item) => sum + (item.profit || 0), 0),
        loss: filtered.reduce((sum, item) => sum + (item.loss || 0), 0),
        netPnL: filtered.reduce((sum, item) => sum + (item.netPnL || 0), 0),
        trades: filtered.length,
      };
    });

    return result;
  }

  private calculateTransactionsByTimeframes(transactions: any[]) {
    const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];
    const result: any = {};

    timeframes.forEach(timeframe => {
      const { startDate, endDate } = this.getDateRangeFromTimeframe(timeframe);
      const filtered = this.filterByDateRange(transactions, startDate, endDate);

      result[timeframe] = {
        total: filtered.reduce((sum, item) => sum + (item.amount || 0), 0),
        pending: filtered.filter(item => item.status === 'pending').length,
        completed: filtered.filter(item => item.status === 'completed').length,
        count: filtered.length,
      };
    });

    return result;
  }
}

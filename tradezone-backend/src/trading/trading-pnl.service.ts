import { Injectable } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreateTradingPnLDto } from './dto/create-trading-pnl.dto';
import { UpdateTradingPnLDto } from './dto/update-trading-pnl.dto';
import { TradingPnL } from './entities/trading-pnl.entity';

@Injectable()
export class TradingPnLService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService,
  ) {}

  async create(
    userId: string,
    userName: string,
    createTradingPnLDto: CreateTradingPnLDto,
  ): Promise<TradingPnL> {
    return this.firebaseDatabaseService.createTradingPnL(
      userId,
      userName,
      createTradingPnLDto,
    );
  }

  async findAll(): Promise<TradingPnL[]> {
    return this.firebaseDatabaseService.getTradingPnL();
  }

  async update(
    id: string,
    userId: string,
    updateTradingPnLDto: UpdateTradingPnLDto,
  ): Promise<boolean> {
    return this.firebaseDatabaseService.updateTradingPnL(
      id,
      userId,
      updateTradingPnLDto,
    );
  }

  async remove(id: string, userId: string): Promise<boolean> {
    return this.firebaseDatabaseService.deleteTradingPnL(id, userId);
  }

  async getHistory(limit?: number): Promise<any[]> {
    return this.firebaseDatabaseService.getTradingPnLHistory(limit);
  }

  // Calculate daily P&L summary
  async getDailySummary(date: string): Promise<{
    totalPnL: number;
    totalProfit: number;
    totalLoss: number;
    tradesCount: number;
    byUser: Record<string, { pnl: number; count: number }>;
    bySymbol: Record<string, { pnl: number; count: number }>;
  }> {
    const allTrades = await this.findAll();
    const filtered = allTrades.filter((trade) => trade.date === date);

    let totalPnL = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    const byUser: Record<string, { pnl: number; count: number }> = {};
    const bySymbol: Record<string, { pnl: number; count: number }> = {};

    filtered.forEach((trade) => {
      totalPnL += trade.pnl || 0;
      totalProfit += trade.profit || 0;
      totalLoss += Math.abs(trade.loss || 0);

      // By user
      if (!byUser[trade.userName]) {
        byUser[trade.userName] = { pnl: 0, count: 0 };
      }
      byUser[trade.userName].pnl += trade.pnl || 0;
      byUser[trade.userName].count += 1;

      // By symbol
      if (!bySymbol[trade.symbol]) {
        bySymbol[trade.symbol] = { pnl: 0, count: 0 };
      }
      bySymbol[trade.symbol].pnl += trade.pnl || 0;
      bySymbol[trade.symbol].count += 1;
    });

    return {
      totalPnL,
      totalProfit,
      totalLoss,
      tradesCount: filtered.length,
      byUser,
      bySymbol,
    };
  }
}

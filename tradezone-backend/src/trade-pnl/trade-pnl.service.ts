import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreateTradePnLDto } from './dto/create-trade-pnl.dto';
import { UpdateTradePnLDto } from './dto/update-trade-pnl.dto';
import { BulkImportResult } from './dto/create-trade-pnl-bulk.dto';

export interface TradePnL {
  id: string;
  date: string;
  profit: number;
  loss: number;
  netPnL: number;
  notes?: string;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TradePnLService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService,
  ) {}

  async create(
    createTradePnLDto: CreateTradePnLDto,
    userId: string,
  ): Promise<TradePnL> {
    const data = {
      ...createTradePnLDto,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.firebaseDatabaseService.createTradePnL(data);
  }

  async findAll(userId: string, days?: number): Promise<TradePnL[]> {
    const items = await this.firebaseDatabaseService.getTradePnL(userId);

    if (!days) {
      return items;
    }

    // Filter items by date range - use date-only comparison
    const today = new Date();
    const cutoffDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - days + 1,
    );
    const cutoffDateString = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(
      `Filtering items from ${cutoffDateString} onwards (${days} days including today ${today.toISOString().split('T')[0]})`,
    );

    return items.filter((item) => {
      const itemDateString = item.date.split('T')[0]; // Handle both YYYY-MM-DD and full ISO strings
      const isIncluded = itemDateString >= cutoffDateString;
      console.log(
        `Item ${itemDateString}: ${isIncluded ? 'INCLUDED' : 'EXCLUDED'} (cutoff: ${cutoffDateString})`,
      );
      return isIncluded;
    });
  }

  async findOne(id: string, userId: string): Promise<TradePnL> {
    const item = await this.firebaseDatabaseService.getTradePnLById(userId, id);
    if (!item) {
      throw new NotFoundException(`TradeP&L with ID ${id} not found`);
    }
    return item;
  }

  async findByDate(date: string, userId: string): Promise<TradePnL | null> {
    const items = await this.firebaseDatabaseService.getTradePnL(userId);
    return items.find((item) => item.date === date) || null;
  }

  async update(
    id: string,
    updateTradePnLDto: UpdateTradePnLDto,
    userId: string,
  ): Promise<TradePnL> {
    const existing = await this.findOne(id, userId);

    const success = await this.firebaseDatabaseService.updateTradePnL(
      userId,
      id,
      updateTradePnLDto,
    );
    if (!success) {
      throw new NotFoundException(
        `TradeP&L with ID ${id} not found or access denied`,
      );
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const success = await this.firebaseDatabaseService.deleteTradePnL(
      userId,
      id,
    );
    if (!success) {
      throw new NotFoundException(
        `TradeP&L with ID ${id} not found or access denied`,
      );
    }
  }

  async bulkImport(
    items: CreateTradePnLDto[],
    userId: string,
  ): Promise<BulkImportResult> {
    type ImportItemResult =
      | { type: 'created' }
      | { type: 'skipped' }
      | { type: 'error'; message: string };

    const result: BulkImportResult = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    console.log(
      `Starting bulk import for ${items.length} items for user ${userId}`,
    );

    // Process items in batches of 50 to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(items.length / batchSize)} (${batch.length} items)`,
      );

      // Process each item in the batch
      const batchPromises: Promise<ImportItemResult>[] = batch.map(
        async (item): Promise<ImportItemResult> => {
          try {
            // Skip if netPnL is zero (no realized P&L)
            if (item.netPnL === 0) {
              return { type: 'skipped' };
            }

            // Create the item
            await this.create(item, userId);
            return { type: 'created' };
          } catch (error) {
            return {
              type: 'error',
              message: `Failed to create record for ${item.date}: ${error?.message || 'Unknown error'}`,
            };
          }
        },
      );

      // Wait for the batch to complete
      const batchResults: ImportItemResult[] = await Promise.all(batchPromises);

      // Aggregate results
      batchResults.forEach((batchResult) => {
        if (batchResult.type === 'created') {
          result.created++;
        } else if (batchResult.type === 'skipped') {
          result.skipped++;
        } else if (batchResult.type === 'error') {
          result.errors.push(batchResult.message);
          result.skipped++;
        }
      });
    }

    console.log(
      `Bulk import completed: Created ${result.created}, Skipped ${result.skipped}, Errors ${result.errors.length}`,
    );
    return result;
  }

  async getStatistics(userId: string, days: number = 30): Promise<any> {
    // Get all items first, then filter by date for statistics using the same logic as findAll
    const recentItems = await this.findAll(userId, days);

    const totalProfit = recentItems.reduce((sum, item) => sum + item.profit, 0);
    const totalLoss = recentItems.reduce((sum, item) => sum + item.loss, 0);
    const netPnL = recentItems.reduce((sum, item) => sum + item.netPnL, 0);
    const totalTrades = recentItems.reduce(
      (sum, item) => sum + (item.totalTrades || 0),
      0,
    );
    const winningTrades = recentItems.reduce(
      (sum, item) => sum + (item.winningTrades || 0),
      0,
    );
    const losingTrades = recentItems.reduce(
      (sum, item) => sum + (item.losingTrades || 0),
      0,
    );

    return {
      period: `${days} days`,
      totalProfit,
      totalLoss,
      netPnL,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate:
        totalTrades > 0
          ? ((winningTrades / totalTrades) * 100).toFixed(2) + '%'
          : '0%',
      averageDailyPnL:
        recentItems.length > 0 ? (netPnL / recentItems.length).toFixed(2) : 0,
      daysTraded: recentItems.length,
    };
  }
}

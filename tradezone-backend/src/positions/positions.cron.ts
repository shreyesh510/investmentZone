import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { MarketDataService } from './market-data.service';

@Injectable()
export class PositionsCronService {
  private readonly logger = new Logger(PositionsCronService.name);

  constructor(
    private readonly db: FirebaseDatabaseService,
    private readonly marketData: MarketDataService,
  ) {}

  // Runs every 6 hours to refresh currentPrice on open positions
  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshOpenPositionsPrices() {
    try {
      this.logger.log('Starting 6-hour price refresh for open positions');

      const openPositions = await this.db.getAllOpenPositions();
      if (!openPositions?.length) {
        this.logger.log('No open positions found; skipping.');
        return;
      }

      // Group by symbol
      const bySymbol = new Map<string, string[]>(); // symbol -> [docIds]
      for (const p of openPositions) {
        const sym = (p.symbol || '').toUpperCase();
        if (!sym) continue;
        const arr = bySymbol.get(sym) ?? [];
        arr.push(p.id);
        bySymbol.set(sym, arr);
      }

      const symbols = Array.from(bySymbol.keys());
      const priceMap = await this.marketData.getUsdPricesForSymbols(symbols);

      let updated = 0;
      for (const sym of symbols) {
        const price = priceMap[sym];
        if (typeof price !== 'number' || !(price > 0)) continue;
        const ids = bySymbol.get(sym) ?? [];
        await this.db.updatePositionsCurrentPriceBySymbol(sym, price);
        updated += ids.length;
      }

      this.logger.log(
        `Price refresh completed. Symbols: ${symbols.length}, Documents updated: ${updated}`,
      );
    } catch (err) {
      this.logger.error('Error during price refresh cron', err);
    }
  }
}

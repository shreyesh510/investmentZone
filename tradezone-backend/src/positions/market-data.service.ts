import { Injectable } from '@nestjs/common';

// Lot size map: base units per lot for platform
const LOT_SIZES: Record<string, number> = {
  BTCUSD: 0.001, // Delta Exchange: 3 lots = 0.003 BTC, so 1 lot = 0.001 BTC
  ETHUSD: 0.01, // Delta Exchange: 6 lots = 0.06 ETH, so 1 lot = 0.01 ETH
  AVAXUSD: 1, // Delta Exchange: 8 lots = 8 AVAX, so 1 lot = 1 AVAX
  ALGOUSD: 1, // 1 lot = 1 ALGO
  FLOKIUSD: 1000000, // Approximate lot size for FLOKI (meme coin with high supply)
  DOGEUSD: 1000, // Approximate lot size for DOGE
  SOLUSD: 0.1, // Approximate lot size for SOL
  ADAUSD: 100, // Approximate lot size for ADA
};

@Injectable()
export class MarketDataService {
  getLotSize(symbol: string): number {
    return LOT_SIZES[symbol?.toUpperCase?.() ?? ''] ?? 0;
  }

  async getUsdPricesForSymbols(
    symbols: string[],
  ): Promise<Record<string, number>> {
    // Static prices - replace with your preferred data source
    const staticPrices: Record<string, number> = {
      BTCUSD: 110000,
      ETHUSD: 4200,
      AVAXUSD: 24,
      FLOKIUSD: 0.00009,
      DOGEUSD: 0.08,
      SOLUSD: 200,
      ADAUSD: 0.5,
      XRPUSD: 0.6,
      BNBUSD: 600,
      LTCUSD: 100,
      ALGOUSD: 0.2,
      SUIUSD: 2,
    };

    const priceBySymbol: Record<string, number> = {};
    for (const sym of symbols) {
      const price = staticPrices[sym.toUpperCase()];
      if (typeof price === 'number' && price > 0) {
        priceBySymbol[sym.toUpperCase()] = price;
      }
    }
    return priceBySymbol;
  }
}

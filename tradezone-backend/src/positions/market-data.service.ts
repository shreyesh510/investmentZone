import { Injectable } from '@nestjs/common';
import axios from 'axios';

// Map our symbols to CoinGecko IDs
const COINGECKO_IDS: Record<string, string> = {
  BTCUSD: 'bitcoin',
  ETHUSD: 'ethereum',
  SOLUSD: 'solana',
  AVAXUSD: 'avalanche-2',
  XRPUSD: 'ripple',
  BNBUSD: 'binancecoin',
  LTCUSD: 'litecoin',
  DOGEUSD: 'dogecoin',
  ADAUSD: 'cardano',
  FLOKIUSD: 'floki',
  ALGOUSD: 'algorand',
  SUIUSD: 'sui',
};

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

  mapToCoinId(symbol: string): string | undefined {
    return COINGECKO_IDS[symbol?.toUpperCase?.() ?? ''];
  }

  async getUsdPricesForSymbols(
    symbols: string[],
  ): Promise<Record<string, number>> {
    const ids = Array.from(
      new Set(
        symbols.map((s) => this.mapToCoinId(s)).filter((x): x is string => !!x),
      ),
    );

    if (ids.length === 0) {
      return {};
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      ids.join(','),
    )}&vs_currencies=usd`;

    try {
      const res = await axios.get(url, {
        headers: { accept: 'application/json' },
        timeout: 10000, // 10 second timeout
      });

      const data = res.data as Record<string, { usd?: number }>;

      // Build map back to our symbol keys
      const priceBySymbol: Record<string, number> = {};
      for (const sym of symbols) {
        const id = this.mapToCoinId(sym);
        const price = id ? data[id]?.usd : undefined;
        if (typeof price === 'number' && price > 0) {
          priceBySymbol[sym.toUpperCase()] = price;
        }
      }
      return priceBySymbol;
    } catch (error) {
      console.error('❌ MarketData: API request error:', error);
      // Fallback to static prices if API fails
      const fallbackPrices: Record<string, number> = {
        bitcoin: 110000,
        ethereum: 4200,
        'avalanche-2': 24,
        floki: 0.00009,
        dogecoin: 0.08,
        solana: 200,
        cardano: 0.5,
        ripple: 0.6,
        binancecoin: 600,
        litecoin: 100,
        algorand: 0.2,
        sui: 2,
      };

      const fallbackPriceMap: Record<string, number> = {};
      for (const sym of symbols) {
        const id = this.mapToCoinId(sym);
        if (id && fallbackPrices[id]) {
          fallbackPriceMap[sym.toUpperCase()] = fallbackPrices[id];
        }
      }
      return fallbackPriceMap;
    }
  }
}

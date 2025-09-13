/**
 * TradingView Data Service
 * Fetches market data from TradingView and other crypto APIs
 */

export interface TradingViewCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  symbol: string;
  timeframe: string;
  price: number;
  change24h: number;
  volume24h: number;
  candles: TradingViewCandle[];
  timestamp: number;
  technicals?: {
    rsi?: number;
    macd?: {
      macd: number;
      signal: number;
      histogram: number;
    };
    movingAverages?: {
      sma20: number;
      sma50: number;
      sma200: number;
      ema20: number;
      ema50: number;
    };
    supportResistance?: {
      support: number[];
      resistance: number[];
    };
  };
}

export interface CryptoInfo {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  market_cap_rank: number;
  circulating_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
  last_updated: string;
}

class TradingViewService {
  private baseURL = 'https://api.coingecko.com/api/v3';
  private tvURL = 'https://api.binance.com/api/v3'; // Alternative data source
  
  /**
   * Converts TradingView symbol to CoinGecko ID
   */
  private symbolToCoinGeckoId(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'DOGEUSD': 'dogecoin',
      'DOGE': 'dogecoin',
      'BTCUSD': 'bitcoin',
      'BTC': 'bitcoin',
      'ETHUSD': 'ethereum', 
      'ETH': 'ethereum',
      'ADAUSD': 'cardano',
      'ADA': 'cardano',
      'SOLUSD': 'solana',
      'SOL': 'solana',
      'MATICUSD': 'matic-network',
      'MATIC': 'matic-network',
      'DOTUSD': 'polkadot',
      'DOT': 'polkadot',
      'AVAXUSD': 'avalanche-2',
      'AVAX': 'avalanche-2',
  'LTCUSD': 'litecoin',
  'LTC': 'litecoin',
  'FLOKIUSD': 'floki',
  'FLOKI': 'floki',
  'XRPUSD': 'ripple',
  'XRP': 'ripple',
  'BNBUSD': 'binancecoin',
  'BNB': 'binancecoin',
  'ALGOUSD': 'algorand',
  'ALGO': 'algorand',
  'SUIUSD': 'sui',
  'SUI': 'sui',
    };
    
    const cleanSymbol = symbol.replace('USD', '').toUpperCase();
    return symbolMap[symbol] || symbolMap[cleanSymbol] || symbol.toLowerCase();
  }

  /**
   * Converts TradingView symbol to Binance format
   */
  private symbolToBinanceSymbol(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'DOGEUSD': 'DOGEUSDT',
      'DOGE': 'DOGEUSDT',
      'BTCUSD': 'BTCUSDT',
      'BTC': 'BTCUSDT',
      'ETHUSD': 'ETHUSDT',
      'ETH': 'ETHUSDT',
      'ADAUSD': 'ADAUSDT',
      'ADA': 'ADAUSDT',
      'SOLUSD': 'SOLUSDT',
      'SOL': 'SOLUSDT',
      'MATICUSD': 'MATICUSDT',
      'MATIC': 'MATICUSDT',
      'DOTUSD': 'DOTUSDT',
      'DOT': 'DOTUSDT',
      'AVAXUSD': 'AVAXUSDT',
      'AVAX': 'AVAXUSDT',
    };
    
    const cleanSymbol = symbol.replace('USD', '').toUpperCase();
    return symbolMap[symbol] || symbolMap[cleanSymbol] || `${cleanSymbol}USDT`;
  }

  /**
   * Converts TradingView timeframe to Binance interval
   */
  private timeframeToBinanceInterval(timeframe: string): string {
    const intervalMap: Record<string, string> = {
      '1': '1m',
      '5': '5m',
      '15': '15m',
      '30': '30m',
      '60': '1h',
      '240': '4h',
      '1D': '1d',
      '1W': '1w',
    };
    
    return intervalMap[timeframe] || '5m';
  }

  /**
   * Fetches current crypto info from CoinGecko
   */
  async getCryptoInfo(symbol: string): Promise<CryptoInfo | null> {
    try {
      const coinId = this.symbolToCoinGeckoId(symbol);
      // Prefer simple/price to avoid 404s on unknown ids like ltcusd
      const simpleUrl = `${this.baseURL}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd&include_24hr_change=true`;
      const response = await fetch(simpleUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch simple price: ${response.status}`);
      }

      const data = await response.json();
      const entry = data?.[coinId];
      if (!entry) {
        throw new Error(`CoinGecko simple price missing entry for ${coinId}`);
      }

      // Map minimal fields; other metrics default to 0
      return {
        id: coinId,
        symbol: symbol.toUpperCase(),
        name: coinId,
        current_price: Number(entry.usd) || 0,
        price_change_percentage_24h: Number(entry.usd_24h_change ?? 0),
        total_volume: 0,
        market_cap: 0,
        market_cap_rank: 0,
        circulating_supply: 0,
        max_supply: 0,
        ath: 0,
        ath_change_percentage: 0,
        atl: 0,
        atl_change_percentage: 0,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error fetching crypto info for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetches OHLC candle data from Binance
   */
  async getCandleData(symbol: string, timeframe: string, limit: number = 100): Promise<TradingViewCandle[]> {
    try {
      const binanceSymbol = this.symbolToBinanceSymbol(symbol);
      const interval = this.timeframeToBinanceInterval(timeframe);
      
      const response = await fetch(
        `${this.tvURL}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch candle data: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((candle: any[]): TradingViewCandle => ({
        time: candle[0], // Open time
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }));
    } catch (error) {
      console.error(`❌ Error fetching candle data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Calculates basic technical indicators
   */
  private calculateTechnicals(candles: TradingViewCandle[]) {
    if (candles.length < 20) return {};

    const closes = candles.map(c => c.close);
    
    // Simple Moving Averages
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const sma200 = this.calculateSMA(closes, 200);
    
    // Exponential Moving Averages
    const ema20 = this.calculateEMA(closes, 20);
    const ema50 = this.calculateEMA(closes, 50);
    
    // RSI
    const rsi = this.calculateRSI(closes, 14);
    
    // MACD
    const macd = this.calculateMACD(closes);
    
    // Support and Resistance levels
    const supportResistance = this.calculateSupportResistance(candles);

    return {
      rsi,
      macd,
      movingAverages: {
        sma20,
        sma50,
        sma200,
        ema20,
        ema50,
      },
      supportResistance,
    };
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Calculate Exponential Moving Average
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Default neutral RSI
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD
   */
  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // Signal line is EMA of MACD
    const macdHistory = [macd]; // In reality, you'd calculate this over time
    const signal = this.calculateEMA(macdHistory, 9);
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  /**
   * Calculate basic support and resistance levels
   */
  private calculateSupportResistance(candles: TradingViewCandle[]) {
    const highs = candles.map(c => c.high).sort((a, b) => b - a);
    const lows = candles.map(c => c.low).sort((a, b) => a - b);
    
    // Take top resistance levels
    const resistance = highs.slice(0, 3);
    
    // Take bottom support levels  
    const support = lows.slice(0, 3);
    
    return { support, resistance };
  }

  /**
   * Fetches comprehensive market data for a symbol and timeframe
   */
  async getMarketData(symbol: string, timeframe: string): Promise<MarketData | null> {
    try {
      console.log(`📊 Fetching market data for ${symbol} on ${timeframe} timeframe`);
      
      // Fetch current crypto info and candle data in parallel
      const [cryptoInfo, candles] = await Promise.all([
        this.getCryptoInfo(symbol),
        this.getCandleData(symbol, timeframe, 200) // Get more data for better technical analysis
      ]);

      if (!cryptoInfo || candles.length === 0) {
        console.warn(`⚠️ Failed to fetch complete data for ${symbol}`);
        return null;
      }

      // Calculate technical indicators
      const technicals = this.calculateTechnicals(candles);

      const marketData: MarketData = {
        symbol: cryptoInfo.symbol,
        timeframe,
        price: cryptoInfo.current_price,
        change24h: cryptoInfo.price_change_percentage_24h,
        volume24h: cryptoInfo.total_volume,
        candles: candles.slice(-50), // Return last 50 candles
        timestamp: Date.now(),
        technicals,
      };

      console.log(`✅ Market data fetched successfully for ${symbol}`);
      return marketData;
    } catch (error) {
      console.error(`❌ Error fetching market data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Formats market data for AI context
   */
  formatMarketDataForAI(marketData: MarketData): string {
    const { symbol, timeframe, price, change24h, volume24h, technicals, candles } = marketData;
    
    const latestCandle = candles[candles.length - 1];
    const previousCandle = candles[candles.length - 2];
    
    const priceAction = latestCandle.close > latestCandle.open ? 'bullish' : 'bearish';
    const trend = technicals?.movingAverages?.sma20 && price > technicals.movingAverages.sma20 ? 'uptrend' : 'downtrend';
    
    return `
MARKET CONTEXT for ${symbol} (${timeframe} timeframe):
- Current Price: $${price.toFixed(6)}
- 24h Change: ${change24h.toFixed(2)}%
- 24h Volume: $${(volume24h / 1000000).toFixed(2)}M
- Latest Candle: ${priceAction} (Open: $${latestCandle.open.toFixed(6)}, Close: $${latestCandle.close.toFixed(6)})
- Price Action: ${trend}
- RSI: ${technicals?.rsi?.toFixed(2) || 'N/A'}
- Support Levels: ${technicals?.supportResistance?.support.map(s => `$${s.toFixed(6)}`).join(', ') || 'N/A'}
- Resistance Levels: ${technicals?.supportResistance?.resistance.map(r => `$${r.toFixed(6)}`).join(', ') || 'N/A'}
- Moving Averages: SMA20: $${technicals?.movingAverages?.sma20?.toFixed(6) || 'N/A'}, SMA50: $${technicals?.movingAverages?.sma50?.toFixed(6) || 'N/A'}
    `.trim();
  }

  /**
   * Gets current chart context (symbol and timeframe) from DOM and settings
   */
  getCurrentChartContext(): { symbol: string; timeframe: string } {
    // First try to get from localStorage settings
    try {
      const settingsData = localStorage.getItem('tradeZone_settings');
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        const symbol = settings.defaultCrypto || 'DOGEUSD';
        const timeframe = settings.defaultTimeframe || '5';
        
        console.log(`📊 Chart context from settings: ${symbol} on ${timeframe} timeframe`);
        return { symbol, timeframe };
      }
    } catch (error) {
      console.warn('Could not get settings from localStorage:', error);
    }

    // Try to extract from TradingView widget as fallback
    try {
      // Look for TradingView iframe or container
      const tvIframes = document.querySelectorAll('iframe[src*="tradingview"]');
      for (const iframe of tvIframes) {
        const src = iframe.getAttribute('src') || '';
        
        // Try to extract symbol from URL
        const symbolMatch = src.match(/symbol=([^&]+)/);
        const intervalMatch = src.match(/interval=([^&]+)/);
        
        if (symbolMatch) {
          console.log(`📊 Chart context from DOM: ${symbolMatch[1]} on ${intervalMatch?.[1] || '5'} timeframe`);
          return {
            symbol: symbolMatch[1] || 'DOGEUSD',
            timeframe: intervalMatch?.[1] || '5'
          };
        }
      }
    } catch (error) {
      console.warn('Could not extract chart context from DOM:', error);
    }
    
    // Fallback to default values
    console.log('📊 Using default chart context: DOGEUSD on 5m timeframe');
    return {
      symbol: 'DOGEUSD',
      timeframe: '5'
    };
  }
}

export const tradingViewService = new TradingViewService();
export default tradingViewService;

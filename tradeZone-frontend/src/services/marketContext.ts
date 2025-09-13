/**
 * Market Context Service
 * Provides real-time market context for AI chat integration
 */

import { tradingViewService, type MarketData } from './tradingViewService';
import { chartContextService } from './chartCapture';

export interface ChatMarketContext {
  currentSymbol: string;
  currentTimeframe: string;
  marketData: MarketData | null;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

class MarketContextService {
  private context: ChatMarketContext = {
    currentSymbol: 'DOGEUSD',
    currentTimeframe: '5',
    marketData: null,
    lastUpdated: 0,
    isLoading: false,
    error: null,
  };

  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 30000; // Update every 30 seconds
  private readonly CACHE_DURATION = 60000; // Cache for 1 minute

  /**
   * Gets the current market context
   */
  getCurrentContext(): ChatMarketContext {
    return { ...this.context };
  }

  /**
   * Detects current chart symbol and timeframe from the UI
   */
  private detectCurrentChart(): { symbol: string; timeframe: string } {
    try {
      // Get chart context from the context service
      const chartContext = chartContextService.getCurrentChartContext();
      
      return {
        symbol: chartContext.symbol,
        timeframe: chartContext.timeframe
      };
    } catch (error) {
      console.warn('⚠️ Could not detect current chart, using defaults:', error);
      return { symbol: 'DOGEUSD', timeframe: '5' };
    }
  }

  /**
   * Updates market context with current chart data
   */
  async updateMarketContext(): Promise<ChatMarketContext> {
    const currentChart = this.detectCurrentChart();
    
    // Check if we need to update (symbol/timeframe changed or cache expired)
    const symbolChanged = currentChart.symbol !== this.context.currentSymbol;
    const timeframeChanged = currentChart.timeframe !== this.context.currentTimeframe;
    const cacheExpired = Date.now() - this.context.lastUpdated > this.CACHE_DURATION;
    
    if (!symbolChanged && !timeframeChanged && !cacheExpired && this.context.marketData) {
      console.log('📊 Using cached market data for', currentChart.symbol);
      return this.context;
    }

    console.log(`📊 Updating market context for ${currentChart.symbol} (${currentChart.timeframe})`);
    
    this.context.isLoading = true;
    this.context.error = null;
    this.context.currentSymbol = currentChart.symbol;
    this.context.currentTimeframe = currentChart.timeframe;

    try {
      const marketData = await tradingViewService.getMarketData(
        currentChart.symbol,
        currentChart.timeframe
      );

      if (marketData) {
        this.context.marketData = marketData;
        this.context.lastUpdated = Date.now();
        this.context.error = null;
        console.log(`✅ Market context updated for ${currentChart.symbol}`);
      } else {
        this.context.error = 'Failed to fetch market data';
        console.warn(`⚠️ No market data available for ${currentChart.symbol}`);
      }
    } catch (error) {
      this.context.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error updating market context:', error);
    } finally {
      this.context.isLoading = false;
    }

    return { ...this.context };
  }

  /**
   * Formats market context for AI prompt injection
   */
  formatContextForAI(): string {
    if (!this.context.marketData) {
      return `Currently viewing ${this.context.currentSymbol} chart on ${this.context.currentTimeframe} timeframe (market data unavailable).`;
    }

    const marketContext = tradingViewService.formatMarketDataForAI(this.context.marketData);
    
    return `CURRENT CHART CONTEXT:
You are helping a user who is currently viewing a ${this.context.currentSymbol} chart on ${this.context.currentTimeframe} timeframe.

${marketContext}

The user can see this chart in real-time and may ask questions about price movements, technical analysis, trading opportunities, or general market insights related to this specific view.`;
  }

  /**
   * Gets a concise summary for quick AI reference
   */
  getQuickSummary(): string {
    if (!this.context.marketData) {
      return `${this.context.currentSymbol} (${this.context.currentTimeframe}) - Data loading...`;
    }

    const { marketData } = this.context;
    const trend = marketData.change24h >= 0 ? '📈' : '📉';
    const price = marketData.price.toFixed(6);
    const change = marketData.change24h.toFixed(2);
    
    return `${trend} ${marketData.symbol} $${price} (${change}% 24h) on ${marketData.timeframe} chart`;
  }

  /**
   * Starts automatic context updates
   */
  startAutoUpdate(): void {
    this.stopAutoUpdate(); // Clear any existing interval
    
    // Update immediately
    this.updateMarketContext();
    
    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.updateMarketContext();
    }, this.UPDATE_INTERVAL);
    
    console.log('🔄 Market context auto-update started');
  }

  /**
   * Stops automatic context updates
   */
  stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Market context auto-update stopped');
    }
  }

  /**
   * Forces an immediate context update
   */
  async forceUpdate(): Promise<ChatMarketContext> {
    this.context.lastUpdated = 0; // Force cache invalidation
    return await this.updateMarketContext();
  }

  /**
   * Checks if market data is stale and needs updating
   */
  isContextStale(): boolean {
    return Date.now() - this.context.lastUpdated > this.CACHE_DURATION;
  }

  /**
   * Gets market data for a specific symbol (for comparison)
   */
  async getMarketDataForSymbol(symbol: string, timeframe?: string): Promise<MarketData | null> {
    const tf = timeframe || this.context.currentTimeframe;
    return await tradingViewService.getMarketData(symbol, tf);
  }

  /**
   * Cleanup method for when service is no longer needed
   */
  cleanup(): void {
    this.stopAutoUpdate();
    this.context = {
      currentSymbol: 'DOGEUSD',
      currentTimeframe: '5',
      marketData: null,
      lastUpdated: 0,
      isLoading: false,
      error: null,
    };
  }
}

export const marketContextService = new MarketContextService();
export default marketContextService;

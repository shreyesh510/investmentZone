/**
 * Chart Context Service
 * Provides chart context detection for AI analysis
 */
import { tradingViewService } from './tradingViewService';

export interface ChartContext {
  symbol: string;
  timeframe: string;
  timestamp: number;
}

class ChartContextService {
  /**
   * Gets current chart context from settings and DOM
   */
  getCurrentChartContext(): ChartContext {
    const context = tradingViewService.getCurrentChartContext();
    return {
      ...context,
      timestamp: Date.now()
    };
  }

}

export const chartContextService = new ChartContextService();
export default chartContextService;
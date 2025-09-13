import { useState, memo } from 'react';
import { AdvancedChart } from 'react-tradingview-embed';
import { useSettings } from '../../contexts/settingsContext';

interface LiveChartProps {
  symbol?: string;
  timeframe?: string;
}

const LiveChart = memo(function LiveChart({ symbol, timeframe }: LiveChartProps) {
  const { settings } = useSettings();

  // Use settings for theme and chart configuration
  const isDarkMode = settings.theme === 'dark';

  // Use provided props or fallback to settings
  const chartSymbol = symbol || settings.defaultCrypto;
  const chartTimeframe = timeframe || settings.defaultTimeframe;

  return (
    <div className={`h-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <AdvancedChart
          widgetProps={{
            symbol: chartSymbol,
            interval: chartTimeframe,
            timezone: "Etc/UTC",
            theme: isDarkMode ? "dark" : "light",
            style: "3",
            locale: "en",
            toolbar_bg: isDarkMode ? "#1e222d" : "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: `tradingview_chart_${chartSymbol}_${chartTimeframe}_${Date.now()}`,
            autosize: true,
            width: "100%",
            height: "100%",
            save_image: false,
            hide_side_toolbar: true,
            overrides: {
              "mainSeriesProperties.style": 3,
            },
            // Dynamic timeframes based on settings
            time_frames: [
              { text: "1m", resolution: "1", description: "1 Minute", title: "1m" },
              { text: "5m", resolution: "5", description: "5 Minutes", title: "5m" },
              { text: "15m", resolution: "15", description: "15 Minutes", title: "15m" },
              { text: "30m", resolution: "30", description: "30 Minutes", title: "30m" },
              { text: "1h", resolution: "60", description: "1 Hour", title: "1h" },
              { text: "4h", resolution: "240", description: "4 Hours", title: "4h" },
              { text: "1D", resolution: "1D", description: "1 Day", title: "1D" },
              { text: "1W", resolution: "1W", description: "1 Week", title: "1W" }
            ],
            // Force reload with new settings
            load_last_chart: false,
          }}
        />
    </div>
  );
});

export default LiveChart;

import { useState, memo, useEffect, useRef } from 'react';
import { AdvancedChart } from 'react-tradingview-embed';
import { useSettings } from '../../contexts/settingsContext';

interface LiveChartProps {
  symbol?: string;
  timeframe?: string;
}

const LiveChart = memo(function LiveChart({ symbol, timeframe }: LiveChartProps) {
  const { settings } = useSettings();
  const chartKey = useRef(`tradingview_chart_${Date.now()}`);

  // Use settings for theme and chart configuration
  const isDarkMode = settings.theme === 'dark';

  // Use provided props or fallback to settings
  const chartSymbol = symbol || settings.defaultCrypto;
  const chartTimeframe = timeframe || settings.defaultTimeframe;

  // Generate a unique client ID for this user (stored in localStorage)
  useEffect(() => {
    if (!localStorage.getItem('tradingview_client_id')) {
      localStorage.setItem('tradingview_client_id', `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  const clientId = localStorage.getItem('tradingview_client_id') || 'default_client';
  const chartsStorageUrl = `https://saveload.tradingview.com`;
  const chartsStorageApiVersion = "1.1";

  return (
    <div className={`h-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <AdvancedChart
          widgetProps={{
            symbol: chartSymbol,
            interval: chartTimeframe,
            timezone: "Etc/UTC",
            theme: isDarkMode ? "dark" : "light",
            style: "1",
            locale: "en",
            toolbar_bg: isDarkMode ? "#1e222d" : "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: chartKey.current,
            autosize: true,
            width: "100%",
            height: "100%",
            save_image: false,
            hide_side_toolbar: false,
            hide_top_toolbar: false,
            overrides: {
              "mainSeriesProperties.style": 1,
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
          }}
        />
    </div>
  );
});

export default LiveChart;

import { memo, useEffect, useState } from 'react';
import { useSettings } from '../../contexts/settingsContext';
import LiveChart from '../../components/chart/liveChart';

interface CryptoData {
  symbol: string;
  price: number;
  change24h: number;
}

const HeaderChart = memo(function HeaderChart() {
  const { settings } = useSettings();
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    const saved = localStorage.getItem('selectedSymbols');
    return saved ? JSON.parse(saved) : ['XAUUSD', 'BTCUSD', 'ETHUSD'];
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('15');

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  // Save selected symbols to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedSymbols', JSON.stringify(selectedSymbols));
  }, [selectedSymbols]);

  // Available symbols for selection
  const availableSymbols = ['XAUUSD', 'LTCUSD', 'DOGEUSD', 'BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'AVAXUSD', 'XRPUSD', 'ADAUSD', 'FLOKIUSD', 'ALGOUSD', 'SUIUSD'];

  // Available timeframes
  const timeframes = [
    { value: '1', label: '1m' },
    { value: '3', label: '3m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: '1D', label: '1D' }
  ];


  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const removeSymbol = (symbol: string) => {
    setSelectedSymbols(prev => prev.filter(s => s !== symbol));
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className={`p-4 md:p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Market Overview
            </h1>
            <p className={`text-xs md:text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Real-time cryptocurrency and commodity prices (Gold, Bitcoin, Ethereum, etc.)
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            {/* Timeframe Selector */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <label className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Timeframe:
              </label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className={`flex-1 md:flex-none px-3 py-2 border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-700 text-white'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                {timeframes.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Selector */}
            <div className="relative w-full md:w-auto">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border rounded-lg text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDarkMode
                    ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600 focus:ring-blue-500'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
                }`}
              >
                <svg className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Symbols ({selectedSymbols.length})
                <svg className={`w-4 h-4 ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>

              {/* Dropdown */}
            {isDropdownOpen && (
              <div className={`absolute left-0 md:right-0 mt-2 w-full md:w-64 rounded-lg shadow-lg z-50 ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border`}>
                <div className="p-2">
                  <div className="max-h-48 overflow-y-auto">
                    {availableSymbols.map((symbol) => (
                      <label
                        key={symbol}
                        className={`flex items-center px-3 py-2 rounded-md cursor-pointer hover:${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSymbols.includes(symbol)}
                          onChange={() => toggleSymbol(symbol)}
                          className={`mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                            isDarkMode ? 'bg-gray-700 border-gray-600' : ''
                          }`}
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {symbol}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Selected Symbols Tags */}
        {selectedSymbols.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1 md:gap-2">
            {selectedSymbols.map((symbol) => (
              <span
                key={symbol}
                className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                  isDarkMode
                    ? 'bg-blue-900 text-blue-200'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {symbol}
                <button
                  onClick={() => removeSymbol(symbol)}
                  className={`ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:${
                    isDarkMode ? 'bg-blue-800' : 'bg-blue-200'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="p-2 md:p-6">
        {selectedSymbols.length === 0 ? (
          <div className={`flex items-center justify-center h-64 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-center">
              <svg className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium">No symbols selected</p>
              <p className="text-sm mt-1">Click "Add Symbols" to display charts</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 md:gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {selectedSymbols.map((symbol) => (
              <div
                key={`${symbol}-${selectedTimeframe}`}
                className={`w-full h-80 md:h-[500px] relative rounded-lg overflow-hidden shadow-sm border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                {/* Chart Header */}
                <div className={`absolute top-0 left-0 right-0 z-10 px-2 md:px-4 py-2 ${
                  isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'
                } backdrop-blur-sm border-b ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {symbol}
                    </div>
                    <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {timeframes.find(tf => tf.value === selectedTimeframe)?.label}
                    </div>
                  </div>
                </div>

                {/* Chart Container */}
                <div className="h-full pt-10 md:pt-14">
                  <LiveChart
                    key={`${symbol}-${selectedTimeframe}`}
                    symbol={symbol}
                    timeframe={selectedTimeframe}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default HeaderChart;
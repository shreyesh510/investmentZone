import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../redux/store';
import { fetchTradePnLProgress } from '../../redux/thunks/dashboard/newDashboardThunks';

interface TradePnLProgressProps {
  isDarkMode: boolean;
}

interface ProgressData {
  date: string;
  pnl: number;
  dayOfWeek: number;
  week: number;
  month: number;
  hasData: boolean;
}

interface ProgressSummary {
  totalDays: number;
  tradingDays: number;
  profitDays: number;
  lossDays: number;
  totalPnL: number;
  maxPnL: number;
  minPnL: number;
  winRate: string;
}

const TradePnLProgress: React.FC<TradePnLProgressProps> = ({ isDarkMode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [hoveredDay, setHoveredDay] = useState<ProgressData | null>(null);

  // Redux selectors
  const { tradePnLProgress, loading, errors } = useSelector((state: RootState) => state.newDashboard);
  const data = tradePnLProgress?.data || [];
  const summary = tradePnLProgress?.summary || null;
  const isLoading = loading.tradePnLProgress;

  useEffect(() => {
    dispatch(fetchTradePnLProgress(selectedYear));
  }, [dispatch, selectedYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getIntensityColor = (pnl: number, hasData: boolean) => {
    if (!hasData) {
      return isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
    }

    if (pnl === 0) {
      return isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
    }

    if (pnl > 0) {
      // Green for profits
      if (pnl < 5000) return 'bg-green-200';
      if (pnl < 15000) return 'bg-green-300';
      if (pnl < 30000) return 'bg-green-400';
      if (pnl < 50000) return 'bg-green-500';
      return 'bg-green-600';
    } else {
      // Red for losses
      if (pnl > -5000) return 'bg-red-200';
      if (pnl > -15000) return 'bg-red-300';
      if (pnl > -30000) return 'bg-red-400';
      if (pnl > -50000) return 'bg-red-500';
      return 'bg-red-600';
    }
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Group data by weeks for proper display
  const groupedData = data.reduce((weeks: ProgressData[][], day, index) => {
    const weekIndex = Math.floor(index / 7);
    if (!weeks[weekIndex]) {
      weeks[weekIndex] = [];
    }
    weeks[weekIndex].push(day);
    return weeks;
  }, []);

  // Organize data in a 7x53 grid (7 days x 53 weeks max)
  const gridData: (ProgressData | null)[][] = Array(7).fill(null).map(() => Array(53).fill(null));

  data.forEach((day) => {
    const date = new Date(day.date);
    // Start from September 13, 2025 for the year 2025, otherwise use January 1st
    const startDate = selectedYear === 2025
      ? new Date(2025, 8, 13) // September 13, 2025 (month is 0-indexed)
      : new Date(selectedYear, 0, 1);

    const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    // Only show data from the start date onwards
    if (daysSinceStart >= 0) {
      const weekIndex = Math.floor(daysSinceStart / 7);
      const dayIndex = date.getDay();

      if (weekIndex < 53 && dayIndex < 7) {
        gridData[dayIndex][weekIndex] = day;
      }
    }
  });

  return (
    <div className={`p-6 rounded-2xl backdrop-blur-lg border ${
      isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/60 border-white/20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Trading Activity Progress
          </h3>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Daily P&L activity throughout the year
          </p>
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className={`px-3 py-2 rounded-lg text-sm border ${
            isDarkMode
              ? 'bg-gray-700/50 border-gray-600/50 text-white'
              : 'bg-white/70 border-gray-300/50 text-gray-900'
          }`}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Progress Grid */}
          <div className="mb-6">
            {/* Month labels */}
            <div className="flex items-center mb-2 ml-6">
              {months.map((month, index) => (
                <div
                  key={month}
                  className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} w-16 text-center`}
                  style={{ marginLeft: index === 0 ? '0' : '8px' }}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col mr-2">
                {weekdays.map((day, index) => (
                  <div
                    key={day}
                    className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} w-4 h-3 flex items-center justify-center mb-1`}
                  >
                    {index % 2 === 1 ? day : ''}
                  </div>
                ))}
              </div>

              {/* Progress squares */}
              <div className="flex">
                {gridData[0].map((_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col mr-1">
                    {gridData.map((week, dayIndex) => {
                      const day = week[weekIndex];
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`w-3 h-3 rounded-sm mb-1 cursor-pointer transition-all duration-150 hover:scale-110 ${
                            day ? getIntensityColor(day.pnl, day.hasData) : (isDarkMode ? 'bg-gray-800' : 'bg-gray-100')
                          } ${day?.hasData ? 'border border-gray-300' : ''}`}
                          onMouseEnter={() => day && setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          title={day ? `${day.date}: ${day.hasData ? formatCurrency(day.pnl) : 'No trading'}` : ''}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-4">
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Less activity
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-sm ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                <div className="w-3 h-3 rounded-sm bg-green-200"></div>
                <div className="w-3 h-3 rounded-sm bg-green-300"></div>
                <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                <div className="w-3 h-3 rounded-sm bg-red-200"></div>
                <div className="w-3 h-3 rounded-sm bg-red-300"></div>
                <div className="w-3 h-3 rounded-sm bg-red-400"></div>
                <div className="w-3 h-3 rounded-sm bg-red-500"></div>
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                More activity
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Trading Days</p>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {summary.tradingDays}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Win Rate</p>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {summary.winRate}%
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total P&L</p>
                <p className={`text-lg font-semibold ${
                  summary.totalPnL >= 0
                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                }`}>
                  {summary.totalPnL >= 0 ? '+' : ''}{formatCurrency(summary.totalPnL)}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Best Day</p>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  +{formatCurrency(summary.maxPnL)}
                </p>
              </div>
            </div>
          )}

          {/* Hover tooltip */}
          {hoveredDay && (
            <div className={`fixed z-50 px-3 py-2 rounded-lg shadow-lg pointer-events-none ${
              isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-900'
            }`} style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}>
              <p className="font-medium">{hoveredDay.date}</p>
              <p className={`text-sm ${
                hoveredDay.hasData
                  ? hoveredDay.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                  : 'text-gray-500'
              }`}>
                {hoveredDay.hasData ? formatCurrency(hoveredDay.pnl) : 'No trading'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TradePnLProgress;
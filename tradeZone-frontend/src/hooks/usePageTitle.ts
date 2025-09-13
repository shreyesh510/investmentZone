import { useEffect } from 'react';

/**
 * Hook to dynamically set page title
 * @param title - The title to set (without the app name suffix)
 * @param includeAppName - Whether to include "Investment Zone" suffix (default: true)
 */
export const usePageTitle = (title?: string, includeAppName: boolean = true) => {
  useEffect(() => {
    const baseTitle = 'Investment Zone';

    if (title && includeAppName) {
      document.title = `${title} - ${baseTitle}`;
    } else if (title && !includeAppName) {
      document.title = title;
    } else {
      document.title = `${baseTitle} - Smart Investment Management Platform`;
    }

    return () => {
      // Reset to default title when component unmounts
      document.title = `${baseTitle} - Smart Investment Management Platform`;
    };
  }, [title, includeAppName]);
};

/**
 * Predefined page titles for consistent naming
 */
export const PAGE_TITLES = {
  DASHBOARD: 'Dashboard',
  POSITIONS: 'Positions',
  TRADE_PNL: 'Trade P&L',
  DEPOSITS: 'Deposits',
  WITHDRAWALS: 'Withdrawals',
  WALLETS: 'Wallets',
  CHAT: 'Community Chat',
  LOGIN: 'Login',
  REGISTER: 'Register',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  MARKET_ANALYSIS: 'Market Analysis',
  PORTFOLIO: 'Portfolio',
  REPORTS: 'Reports',
} as const;
import type { AppDispatch } from '../../store';
import { dashboardApi } from '../../../services/dashboardApi';
import { setLoading, setDashboardData, setError } from '../../slices/dashboardSlice';

export const fetchDashboardSummary = (days?: number) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const data = await dashboardApi.getDashboardSummary(days);
    dispatch(setDashboardData(data));
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch dashboard data';
    dispatch(setError(errorMessage));
    console.error('Error fetching dashboard summary:', error);
  }
};
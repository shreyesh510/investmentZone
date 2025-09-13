import { createSlice } from '@reduxjs/toolkit';

export interface PriceData {
  price: number;
  change24h: number;
}

interface CoinState {
  price: number | null;
  change24h: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface PriceState {
  dogecoin: CoinState;
  bitcoin: CoinState;
  ethereum: CoinState;
  // For future use with multiple coins
  prices: Record<string, PriceData>;
  multipleLoading: boolean;
  multipleError: string | null;
}

const createInitialCoinState = (): CoinState => ({
  price: null,
  change24h: null,
  loading: false,
  error: null,
  lastUpdated: null,
});

const initialState: PriceState = {
  dogecoin: createInitialCoinState(),
  bitcoin: createInitialCoinState(),
  ethereum: createInitialCoinState(),
  prices: {},
  multipleLoading: false,
  multipleError: null,
};

const priceSlice = createSlice({
  name: 'price',
  initialState,
  reducers: {
    // Clear error manually if needed
    clearError: (state) => {
      state.dogecoin.error = null;
      state.bitcoin.error = null;
      state.ethereum.error = null;
      state.multipleError = null;
    },
    // Clear specific coin data
    clearDogecoinData: (state) => {
      state.dogecoin = createInitialCoinState();
    },
    clearBitcoinData: (state) => {
      state.bitcoin = createInitialCoinState();
    },
    clearEthereumData: (state) => {
      state.ethereum = createInitialCoinState();
    },
    // Clear all coin data
    clearAllPriceData: (state) => {
      state.dogecoin = createInitialCoinState();
      state.bitcoin = createInitialCoinState();
      state.ethereum = createInitialCoinState();
      state.prices = {};
    },
  },
});

export const { 
  clearError, 
  clearDogecoinData, 
  clearBitcoinData, 
  clearEthereumData, 
  clearAllPriceData 
} = priceSlice.actions;
export default priceSlice.reducer;

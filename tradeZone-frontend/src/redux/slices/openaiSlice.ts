import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OpenAIResponse } from '../thunks/openai/openAI';
import {
  generateOpenAIResponse,
  generateTradingAnalysis,
  generateChartAnalysis
} from '../thunks/openai/openAI';

interface ConversationItem {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIState {
  // General AI responses
  currentResponse: string | null;
  loading: boolean;
  error: string | null;
  
  // Trading analysis
  tradingAnalysis: {
    response: string | null;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
  };
  
  // Chart analysis
  chartAnalysis: {
    response: string | null;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
  };
  
  // Conversation history
  conversation: ConversationItem[];
  
  // Usage tracking
  totalTokensUsed: number;
  requestCount: number;
}

const initialState: OpenAIState = {
  currentResponse: null,
  loading: false,
  error: null,
  
  tradingAnalysis: {
    response: null,
    loading: false,
    error: null,
    lastUpdated: null,
  },
  
  chartAnalysis: {
    response: null,
    loading: false,
    error: null,
    lastUpdated: null,
  },
  
  conversation: [],
  totalTokensUsed: 0,
  requestCount: 0,
};

const openaiSlice = createSlice({
  name: 'openai',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.tradingAnalysis.error = null;
      state.chartAnalysis.error = null;
    },
    
    clearCurrentResponse: (state) => {
      state.currentResponse = null;
      state.error = null;
    },
    
    clearTradingAnalysis: (state) => {
      state.tradingAnalysis.response = null;
      state.tradingAnalysis.error = null;
      state.tradingAnalysis.lastUpdated = null;
    },
    
    clearChartAnalysis: (state) => {
      state.chartAnalysis.response = null;
      state.chartAnalysis.error = null;
      state.chartAnalysis.lastUpdated = null;
    },
    
    clearConversation: (state) => {
      state.conversation = [];
    },
    
    addUserMessage: (state, action: PayloadAction<string>) => {
      state.conversation.push({
        id: `user_${Date.now()}`,
        type: 'user',
        content: action.payload,
        timestamp: Date.now(),
      });
    },
    
    resetUsageStats: (state) => {
      state.totalTokensUsed = 0;
      state.requestCount = 0;
    },
  },
  
  extraReducers: (builder) => {
    // General OpenAI response
    builder
      .addCase(generateOpenAIResponse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateOpenAIResponse.fulfilled, (state, action: PayloadAction<OpenAIResponse>) => {
        state.loading = false;
        state.currentResponse = action.payload.message;
        state.requestCount += 1;
        
        if (action.payload.usage) {
          state.totalTokensUsed += action.payload.usage.total_tokens;
        }
        
        // Add to conversation
        state.conversation.push({
          id: `assistant_${Date.now()}`,
          type: 'assistant',
          content: action.payload.message,
          timestamp: Date.now(),
          usage: action.payload.usage,
        });
      })
      .addCase(generateOpenAIResponse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to generate response';
      })
      
    // Trading analysis
    builder
      .addCase(generateTradingAnalysis.pending, (state) => {
        state.tradingAnalysis.loading = true;
        state.tradingAnalysis.error = null;
      })
      .addCase(generateTradingAnalysis.fulfilled, (state, action: PayloadAction<OpenAIResponse>) => {
        state.tradingAnalysis.loading = false;
        state.tradingAnalysis.response = action.payload.message;
        state.tradingAnalysis.lastUpdated = Date.now();
        state.requestCount += 1;
        
        if (action.payload.usage) {
          state.totalTokensUsed += action.payload.usage.total_tokens;
        }
      })
      .addCase(generateTradingAnalysis.rejected, (state, action) => {
        state.tradingAnalysis.loading = false;
        state.tradingAnalysis.error = action.payload || 'Failed to generate trading analysis';
      })
      
    // Chart analysis
    builder
      .addCase(generateChartAnalysis.pending, (state) => {
        state.chartAnalysis.loading = true;
        state.chartAnalysis.error = null;
      })
      .addCase(generateChartAnalysis.fulfilled, (state, action: PayloadAction<OpenAIResponse>) => {
        state.chartAnalysis.loading = false;
        state.chartAnalysis.response = action.payload.message;
        state.chartAnalysis.lastUpdated = Date.now();
        state.requestCount += 1;
        
        if (action.payload.usage) {
          state.totalTokensUsed += action.payload.usage.total_tokens;
        }
      })
      .addCase(generateChartAnalysis.rejected, (state, action) => {
        state.chartAnalysis.loading = false;
        state.chartAnalysis.error = action.payload || 'Failed to generate chart analysis';
      });
  },
});

export const {
  clearError,
  clearCurrentResponse,
  clearTradingAnalysis,
  clearChartAnalysis,
  clearConversation,
  addUserMessage,
  resetUsageStats,
} = openaiSlice.actions;

export default openaiSlice.reducer;

import { createAsyncThunk } from '@reduxjs/toolkit';
import { config } from '../../../config/env';
import { marketContextService } from '../../../services/marketContext';

// Types for OpenAI API
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequest {
  prompt: string;
  systemMessage?: string;
  maxTokens?: number;
  temperature?: number;
  includeMarketContext?: boolean;
}

export interface OpenAIResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// OpenAI API service
const openAIService = {
  async generateResponse(request: OpenAIRequest): Promise<OpenAIResponse> {
    const apiKey = config.OPENAI_API_KEY;
    
    console.log('🔑 Debug - API Key from config:', apiKey ? 'KEY_FOUND' : 'NO_KEY');
    console.log('🔑 Debug - Raw env var:', import.meta.env.VITE_OPENAI_API_KEY ? 'ENV_FOUND' : 'NO_ENV');
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file');
    }

    const messages: OpenAIMessage[] = [];
    
    // Add system message with market context if enabled
    let systemMessage = request.systemMessage || 'You are a helpful AI assistant specializing in cryptocurrency trading and market analysis.';
    
    if (request.includeMarketContext !== false) { // Default to true
      try {
        console.log('📊 Fetching market context for AI...');
        await marketContextService.updateMarketContext();
        const marketContext = marketContextService.formatContextForAI();
        
        systemMessage = `${systemMessage}

${marketContext}

Provide helpful, accurate responses based on the current market context. When discussing price movements or technical analysis, reference the current chart data provided above.`;
        
        console.log('✅ Market context added to AI prompt');
      } catch (error) {
        console.warn('⚠️ Could not fetch market context:', error);
        // Continue without market context
      }
    }
    
    messages.push({
      role: 'system',
      content: systemMessage
    });
    
    // Add user prompt
    messages.push({
      role: 'user',
      content: request.prompt
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // You can change this to gpt-4 if needed
        messages,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    return {
      message: data.choices[0].message.content,
      usage: data.usage,
    };
  },
};

// Redux Thunks
export const generateOpenAIResponse = createAsyncThunk<
  OpenAIResponse,
  OpenAIRequest,
  { rejectValue: string }
>(
  'openai/generateResponse',
  async (request, { rejectWithValue }) => {
    try {
      return await openAIService.generateResponse(request);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate OpenAI response');
    }
  }
);

// Trading-specific thunk for market analysis
export const generateTradingAnalysis = createAsyncThunk<
  OpenAIResponse,
  { symbol: string; timeframe: string; prompt: string },
  { rejectValue: string }
>(
  'openai/generateTradingAnalysis',
  async ({ symbol, timeframe, prompt }, { rejectWithValue }) => {
    try {
      const systemMessage = `You are an expert cryptocurrency trading analyst. You provide concise, actionable insights about ${symbol} on ${timeframe} timeframe. Focus on technical analysis, market trends, and potential trading opportunities. Keep responses under 200 words.`;
      
      return await openAIService.generateResponse({
        prompt,
        systemMessage,
        maxTokens: 300,
        temperature: 0.5, // Lower temperature for more consistent analysis
      });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate trading analysis');
    }
  }
);

// Chart analysis thunk with automatic market context
export const generateChartAnalysis = createAsyncThunk<
  OpenAIResponse,
  { prompt: string; priceData?: any },
  { rejectValue: string }
>(
  'openai/generateChartAnalysis',
  async ({ prompt, priceData }, { rejectWithValue }) => {
    try {
      let enhancedPrompt = prompt;
      
      if (priceData) {
        enhancedPrompt = `Additional market data: ${JSON.stringify(priceData, null, 2)}\n\nUser question: ${prompt}`;
      }
      
      const systemMessage = `You are a professional technical analyst specializing in cryptocurrency markets. Provide clear, actionable chart analysis and trading insights. Focus on price action, support/resistance levels, and potential entry/exit points. Use the current chart context to provide specific analysis.`;
      
      return await openAIService.generateResponse({
        prompt: enhancedPrompt,
        systemMessage,
        maxTokens: 400,
        temperature: 0.3, // Very focused analysis
        includeMarketContext: true, // Always include market context for chart analysis
      });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate chart analysis');
    }
  }
);

export default openAIService;

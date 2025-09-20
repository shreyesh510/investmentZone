import { createAsyncThunk } from '@reduxjs/toolkit';
import { marketContextService } from '../../../services/marketContext';

// Types for OpenAI API
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export interface OpenAIRequest {
  prompt: string;
  systemMessage?: string;
  maxTokens?: number;
  temperature?: number;
  includeMarketContext?: boolean;
  imageBase64?: string;
  conversationHistory?: OpenAIMessage[];
}

export interface OpenAIResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Available vision models to try
const VISION_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-vision-preview'];

// OpenAI API service
const openAIService = {
  async generateResponse(request: OpenAIRequest): Promise<OpenAIResponse> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

    console.log('🔑 Debug - API Key from env:', apiKey ? 'KEY_FOUND' : 'NO_KEY');
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

    // Add conversation history if provided
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      // Add the last few messages for context (limit to prevent token overflow)
      const recentHistory = request.conversationHistory.slice(-6); // Last 6 messages (3 exchanges)
      messages.push(...recentHistory);
    }
    
    // Add user prompt with image if provided
    if (request.imageBase64) {
      // Ensure the image has the proper data URL format
      let imageUrl = request.imageBase64;
      if (!imageUrl.startsWith('data:')) {
        // If it's raw base64, add the data URL prefix
        imageUrl = `data:image/jpeg;base64,${imageUrl}`;
      }

      console.log('🖼️ Sending image to OpenAI Vision API');
      console.log('Image URL prefix:', imageUrl.substring(0, 50));
      console.log('Full message structure:', JSON.stringify({
        role: 'user',
        content: [
          { type: 'text', text: request.prompt },
          { type: 'image_url', image_url: { url: imageUrl.substring(0, 50) + '...' } }
        ]
      }, null, 2));

      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: request.prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: request.prompt
      });
    }

    const requestBody = {
      model: request.imageBase64 ? 'gpt-4o' : 'gpt-3.5-turbo', // Use GPT-4o Vision for images
      messages,
      max_tokens: request.imageBase64 ? (request.maxTokens || 1500) : (request.maxTokens || 1000), // More tokens for image analysis
      temperature: request.temperature || 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    console.log('📤 OpenAI API Request:', {
      model: requestBody.model,
      hasImage: !!request.imageBase64,
      messageCount: messages.length,
      maxTokens: requestBody.max_tokens
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenAI API Error:', errorData);

      // Check for specific vision-related errors
      if (errorData.error?.message?.includes('vision') ||
          errorData.error?.message?.includes('image') ||
          errorData.error?.message?.includes('gpt-4o') ||
          errorData.error?.code === 'model_not_found') {
        throw new Error(
          'Image analysis failed. Your OpenAI API key may not have access to GPT-4o Vision model, or you may have insufficient credits. Error: ' +
          errorData.error?.message
        );
      }

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

import fetch from 'node-fetch';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

/**
 * Check if Ollama is available
 */
export async function checkOllamaConnection() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Ollama connection failed');
    }
    
    return true;
  } catch (error) {
    console.error('Ollama connection error:', error.message);
    return false;
  }
}

/**
 * Get list of available models from Ollama
 */
export async function getAvailableModels() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error fetching models:', error.message);
    return [];
  }
}

/**
 * Generate a completion from an LLM model
 */
export async function generateCompletion(model, prompt, options = {}) {
  const {
    temperature = 0.7,
    top_p = 0.9,
    max_tokens = 256,
    stream = false,
  } = options;
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        options: {
          temperature,
          top_p,
          num_predict: max_tokens,
        },
        stream,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.response,
      done: data.done,
      totalDuration: data.total_duration,
      loadDuration: data.load_duration,
      promptEvalCount: data.prompt_eval_count,
      evalCount: data.eval_count,
    };
  } catch (error) {
    console.error('Generation error:', error.message);
    throw error;
  }
}

/**
 * Generate a chat completion (for chat-style models)
 */
export async function generateChatCompletion(model, messages, options = {}) {
  const {
    temperature = 0.7,
    top_p = 0.9,
    max_tokens = 256,
    stream = false,
  } = options;
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        options: {
          temperature,
          top_p,
          num_predict: max_tokens,
        },
        stream,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Chat generation failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.message?.content || '',
      done: data.done,
      totalDuration: data.total_duration,
      loadDuration: data.load_duration,
      promptEvalCount: data.prompt_eval_count,
      evalCount: data.eval_count,
    };
  } catch (error) {
    console.error('Chat generation error:', error.message);
    throw error;
  }
}

import { http } from '../utils/http.js';
import { aiLogger as log } from '../utils/logger.js';
import { env } from '../config/env.js';
import type { AiStrategyRequest, AiStrategyResponse } from '../schemas/ai.js';

// ---------------------------------------------------------------------------
// System prompt — teaches the LLM about GridEx grid trading
// ---------------------------------------------------------------------------

function buildSystemPrompt(req: AiStrategyRequest): string {
  return `You are a grid trading strategy advisor for the GridEx protocol.

Grid trading parameters:
- askPrice0: Lowest ask (sell) order price — must be above current price
- bidPrice0: Highest bid (buy) order price — must be below current price
- askGap: Price gap between consecutive ask orders (positive number)
- bidGap: Price gap between consecutive bid orders (positive number)
- askOrderCount: Number of ask orders (1–100)
- bidOrderCount: Number of bid orders (1–100)
- amountPerGrid: Base token amount per grid level
- compound: Whether to reinvest profits (true/false)

Current context:
- Trading pair: ${req.base_token.symbol}/${req.quote_token.symbol}
- Current price: ${req.current_price} ${req.quote_token.symbol}
- Chain ID: ${req.chain_id}

Rules:
1. If the user's description is too vague or missing critical info (price range, investment amount, or grid density), respond with status "clarify" and ask specific questions.
2. If sufficient info is provided, generate a strategy with status "success".
3. All prices must be reasonable relative to current_price.
4. askPrice0 must be > current_price, bidPrice0 must be < current_price.
5. Respond in the same language as the user's prompt.
6. All numeric values in the strategy object must be strings (e.g. "650.5", not 650.5).
7. compound defaults to true unless the user says otherwise.

Output STRICTLY valid JSON matching one of these two formats (no markdown, no code fences, no extra text):

Format A – when user info is incomplete:
{
  "status": "clarify",
  "questions": ["question 1", "question 2"],
  "analysis": "brief explanation of what info is missing and why it matters"
}

Format B – when user info is sufficient:
{
  "status": "success",
  "strategy": {
    "askPrice0": "...",
    "bidPrice0": "...",
    "askGap": "...",
    "bidGap": "...",
    "askOrderCount": "...",
    "bidOrderCount": "...",
    "amountPerGrid": "...",
    "compound": true
  },
  "analysis": "brief explanation of the strategy and reasoning"
}`;
}

// ---------------------------------------------------------------------------
// LLM call
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function generateStrategy(
  req: AiStrategyRequest,
): Promise<AiStrategyResponse> {
  if (!env.LLM_API_KEY) {
    throw new Error('LLM_API_KEY is not configured');
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(req) },
    { role: 'user', content: req.prompt },
  ];

  const apiBase = env.LLM_API_BASE.replace(/\/+$/, '');
  const url = `${apiBase}/chat/completions`;

  log.info({ model: env.LLM_MODEL, pair: `${req.base_token.symbol}/${req.quote_token.symbol}` }, 'Calling LLM');

  const response = await http.post<ChatCompletionResponse>(url, {
    model: env.LLM_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 1024,
  }, {
    headers: {
      Authorization: `Bearer ${env.LLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30_000,
  });

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from LLM');
  }

  log.debug({ content }, 'LLM raw response');

  // Strip possible markdown code fences the LLM might add despite instructions
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    log.error({ content: cleaned }, 'Failed to parse LLM JSON response');
    throw new Error('LLM returned invalid JSON');
  }

  // Validate against our Zod schema
  const { aiStrategyResponseSchema } = await import('../schemas/ai.js');
  const result = aiStrategyResponseSchema.safeParse(parsed);

  if (!result.success) {
    log.error({ errors: result.error.format(), parsed }, 'LLM response failed schema validation');
    throw new Error('LLM response does not match expected schema');
  }

  return result.data;
}

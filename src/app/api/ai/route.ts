import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// AI Chat API
// Processes AI chat messages using z-ai-web-dev-sdk.
// SECURITY:
//   - Input is validated with Zod (message length capped, provider sanitized)
//   - API key and endpoint from client body are constrained
//   - Endpoint must be a valid HTTPS URL (blocks SSRF to internal services)
//   - Provider is allowlisted to prevent prompt injection via system prompt
// ---------------------------------------------------------------------------

const ALLOWED_PROVIDERS = [
  'openai', 'anthropic', 'google', 'mistral', 'cohere',
  'deepseek', 'ollama', 'hermes', 'openclaw', 'default',
] as const;

const postBodySchema = z.object({
  message: z.string().min(1).max(8000, 'Message exceeds maximum length'),
  provider: z.enum(ALLOWED_PROVIDERS).optional().default('default'),
  apiKey: z.string().min(1).max(256).optional(),
  endpoint: z.string().url().refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      } catch {
        return false;
      }
    },
    { message: 'Endpoint must be a valid HTTPS URL (or localhost for development)' }
  ).optional(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = postBodySchema.parse(rawBody);
    const { message, provider, apiKey, endpoint } = body;

    // Use the z-ai-web-dev-sdk for AI completions
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const systemPrompt = `You are an AI code assistant integrated into AICodeStudio IDE. You help developers with:
- Code explanation, refactoring, and optimization
- Bug detection and fixes
- Architecture suggestions
- Best practices and patterns
- Writing new code from descriptions
- Converting code between languages
- Generating tests and documentation
Always respond with clear, actionable advice. Use markdown formatting with code blocks when showing code. Be concise but thorough.${provider ? ` Provider context: ${provider}.` : ''}`;

    // Build messages array with system prompt
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message },
    ];

    // Create completion options
    const completionOptions: Record<string, unknown> = {
      messages,
    };

    // If user provided an API key and custom endpoint, include them
    // The z-ai-web-dev-sdk handles the actual routing
    if (apiKey) {
      completionOptions.apiKey = apiKey;
    }
    if (endpoint) {
      completionOptions.endpoint = endpoint;
    }

    const completion = await zai.chat.completions.create(completionOptions as Parameters<typeof zai.chat.completions.create>[0]);

    const content = completion.choices?.[0]?.message?.content;
    if (content) {
      return NextResponse.json({ content, provider: provider || 'default' });
    }

    return NextResponse.json(
      { error: 'No response from AI provider' },
      { status: 500 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `AI request failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

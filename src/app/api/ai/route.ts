import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, provider, apiKey, endpoint } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Use the z-ai-web-dev-sdk for AI completions
    // The API key and endpoint are passed from the client (user-configured)
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
      { error: "No response from AI provider" },
      { status: 500 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `AI request failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

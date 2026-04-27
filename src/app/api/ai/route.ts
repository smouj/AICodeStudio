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
Always respond with clear, actionable advice. Use markdown formatting with code blocks when showing code.${provider ? ` Provider context: ${provider}.` : ''}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;
    if (content) {
      return NextResponse.json({ content, provider: provider || 'default' });
    }

    return NextResponse.json(
      { error: "No response from AI provider" },
      { status: 500 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `AI request failed: ${message}` },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Extension Marketplace API
// Uses the Open VSX Registry (https://open-vsx.org) for real extension data.
//
// SECURITY: All inputs validated with Zod. size is capped to prevent
// excessive API responses. sortBy/sortOrder are enum-validated.
// namespace/name are sanitized before passing to external API.
// ---------------------------------------------------------------------------

const OPEN_VSX_BASE = 'https://open-vsx.org/api';

interface VSXExtension {
  id: string;
  namespace: string;
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  publisher?: { name: string };
  files?: Record<string, string>;
  icons?: Record<string, string>;
  license?: string;
  repository?: string;
  downloadCount?: number;
  rating?: number;
  reviewCount?: number;
  timestamp?: string;
  tags?: string[];
  categories?: string[];
}

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const EXT_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

const getQuerySchema = z.object({
  query: z.string().max(200).default(''),
  size: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
  category: z.string().max(50).default(''),
  sortBy: z.enum(['relevance', 'downloadCount', 'timestamp']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const postBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('detail'),
    namespace: z.string().min(1).max(100).regex(EXT_NAME_REGEX, 'Invalid namespace format'),
    name: z.string().min(1).max(100).regex(EXT_NAME_REGEX, 'Invalid extension name format'),
  }).strict(),
  z.object({
    action: z.literal('popular'),
    size: z.number().int().min(1).max(50).default(20),
  }).strict(),
]);

/**
 * GET /api/extensions
 * Search extensions from Open VSX Registry.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = getQuerySchema.parse({
      query: searchParams.get('query') || '',
      size: searchParams.get('size') || '20',
      offset: searchParams.get('offset') || '0',
      category: searchParams.get('category') || '',
      sortBy: searchParams.get('sortBy') || 'relevance',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    // Build Open VSX search URL
    const params = new URLSearchParams();
    if (parsed.query) params.set('query', parsed.query);
    params.set('size', String(parsed.size));
    params.set('offset', String(parsed.offset));
    if (parsed.category) params.set('category', parsed.category);
    if (parsed.sortBy) params.set('sortBy', parsed.sortBy);
    if (parsed.sortOrder) params.set('sortOrder', parsed.sortOrder);

    const searchUrl = `${OPEN_VSX_BASE}/-/search?${params.toString()}`;

    const response = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Open VSX API error: ${text}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize the response
    const extensions = (data.extensions || []).map(
      (ext: Record<string, unknown>) => ({
        id: `${ext.namespace}.${ext.name}`,
        namespace: ext.namespace,
        name: ext.name,
        version: ext.version,
        displayName: ext.displayName || ext.name,
        description: ext.description || '',
        publisher: (ext.publisher as { name?: string })?.name || ext.namespace,
        iconUrl: (ext.files as Record<string, string>)?.icon || (ext.icons as Record<string, string>)?.['128'] || null,
        downloadCount: ext.downloadCount || 0,
        rating: ext.averageRating || 0,
        reviewCount: ext.reviewCount || 0,
        timestamp: ext.timestamp,
        tags: ext.tags || [],
        categories: ext.categories || [],
        repository: ext.repository || null,
        license: ext.license || null,
      })
    );

    return NextResponse.json({
      success: true,
      query: parsed.query,
      extensions,
      totalSize: data.totalSize || extensions.length,
      offset: parsed.offset,
      size: parsed.size,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Extension search failed: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/extensions
 * Get extension details or popular extensions.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = postBodySchema.parse(rawBody);

    switch (body.action) {
      case 'detail':
        return await getExtensionDetail(body.namespace, body.name);
      case 'popular':
        return await getPopularExtensions(body.size);
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Extension operation failed: ${message}` },
      { status: 500 }
    );
  }
}

async function getExtensionDetail(namespace: string, name: string) {
  try {
    const detailUrl = `${OPEN_VSX_BASE}/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;
    const response = await fetch(detailUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Extension ${namespace}.${name} not found` },
          { status: 404 }
        );
      }
      const text = await response.text();
      return NextResponse.json(
        { error: `Open VSX API error: ${text}` },
        { status: response.status }
      );
    }

    const data: VSXExtension = await response.json();

    // Get all versions
    const versionsUrl = `${OPEN_VSX_BASE}/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/versions`;
    let versions: string[] = [];
    try {
      const versionsResponse = await fetch(versionsUrl, {
        headers: { Accept: 'application/json' },
      });
      if (versionsResponse.ok) {
        versions = await versionsResponse.json();
      }
    } catch {
      // Non-critical: versions are optional
    }

    return NextResponse.json({
      success: true,
      action: 'detail',
      extension: {
        id: `${data.namespace}.${data.name}`,
        namespace: data.namespace,
        name: data.name,
        version: data.version,
        displayName: data.displayName || data.name,
        description: data.description,
        publisher: data.publisher?.name || data.namespace,
        iconUrl: data.files?.icon || null,
        downloadCount: data.downloadCount || 0,
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
        timestamp: data.timestamp,
        tags: data.tags,
        categories: data.categories,
        repository: data.repository,
        license: data.license,
        versions,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get extension detail: ${message}` },
      { status: 500 }
    );
  }
}

async function getPopularExtensions(size: number) {
  try {
    const params = new URLSearchParams({
      size: String(size),
      sortBy: 'downloadCount',
      sortOrder: 'desc',
    });

    const searchUrl = `${OPEN_VSX_BASE}/-/search?${params.toString()}`;
    const response = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Open VSX API error: ${text}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const extensions = (data.extensions || []).map(
      (ext: Record<string, unknown>) => ({
        id: `${ext.namespace}.${ext.name}`,
        namespace: ext.namespace,
        name: ext.name,
        version: ext.version,
        displayName: ext.displayName || ext.name,
        description: ext.description || '',
        publisher: (ext.publisher as { name?: string })?.name || ext.namespace,
        iconUrl: (ext.files as Record<string, string>)?.icon || null,
        downloadCount: ext.downloadCount || 0,
        rating: ext.averageRating || 0,
        categories: ext.categories || [],
      })
    );

    return NextResponse.json({
      success: true,
      action: 'popular',
      extensions,
      totalSize: data.totalSize || extensions.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get popular extensions: ${message}` },
      { status: 500 }
    );
  }
}

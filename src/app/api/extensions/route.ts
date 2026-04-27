import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Extension Marketplace API
// Uses the Open VSX Registry (https://open-vsx.org) for real extension data.
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

/**
 * GET /api/extensions
 * Search extensions from Open VSX Registry.
 * Query params:
 *   - query: search string
 *   - size: number of results (default 20)
 *   - offset: pagination offset (default 0)
 *   - category: filter by category
 *   - sortBy: relevance | downloadCount | timestamp (default relevance)
 *   - sortOrder: asc | desc (default desc)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const size = searchParams.get('size') || '20';
    const offset = searchParams.get('offset') || '0';
    const category = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build Open VSX search URL
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    params.set('size', size);
    params.set('offset', offset);
    if (category) params.set('category', category);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);

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
      query,
      extensions,
      totalSize: data.totalSize || extensions.length,
      offset: parseInt(offset, 10),
      size: parseInt(size, 10),
    });
  } catch (error: unknown) {
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
 * Body: { action: 'detail'|'popular', namespace: string, name: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'detail':
        return await getExtensionDetail(body.namespace, body.name);
      case 'popular':
        return await getPopularExtensions(body.size || 20);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: detail, popular` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Extension operation failed: ${message}` },
      { status: 500 }
    );
  }
}

async function getExtensionDetail(namespace?: string, name?: string) {
  if (!namespace || !name) {
    return NextResponse.json(
      { error: 'namespace and name are required for detail action' },
      { status: 400 }
    );
  }

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

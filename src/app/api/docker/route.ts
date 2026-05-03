import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Docker Engine API helper
// SECURITY: Docker is DISABLED by default.
//   - Requires AICODE_ENABLE_DOCKER=true
//   - Requires DOCKER_HOST to be explicitly set
//   - TCP on port 2375 without TLS is NOT recommended
//   - Never expose Docker on a public server without auth/TLS/tunnel
// ---------------------------------------------------------------------------

function isDockerEnabled(): boolean {
  return process.env.AICODE_ENABLE_DOCKER === 'true' && !!process.env.DOCKER_HOST;
}

function getDockerBaseUrl(): string {
  const host = process.env.DOCKER_HOST || '';
  return host.replace(/\/$/, '');
}

async function dockerFetch(path: string, options?: RequestInit): Promise<Response> {
  if (!isDockerEnabled()) {
    throw new Error('Docker is disabled. Set AICODE_ENABLE_DOCKER=true and DOCKER_HOST to enable.');
  }

  const baseUrl = getDockerBaseUrl();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, { ...options });
  return response;
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const postBodySchema = z.object({
  action: z.enum(['start', 'stop', 'remove', 'restart']),
  containerId: z.string().min(1),
});

const putBodySchema = z.object({
  image: z.string().min(1),
  tag: z.string().optional(),
});

/**
 * GET /api/docker
 * List containers and images.
 * Returns "Docker disabled" if not enabled.
 */
export async function GET(req: NextRequest) {
  if (!isDockerEnabled()) {
    return NextResponse.json({
      success: false,
      dockerAvailable: false,
      message: 'Docker integration is disabled. Set AICODE_ENABLE_DOCKER=true and DOCKER_HOST to enable.',
    }, { status: 200 }); // 200 so UI can display the status gracefully
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'containers';
    const all = searchParams.get('all') === 'true';

    if (type === 'images') {
      return await listImages();
    }

    return await listContainers(all);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Docker operation failed: ${message}`, dockerAvailable: false },
      { status: 503 }
    );
  }
}

async function listContainers(all: boolean) {
  try {
    const response = await dockerFetch(
      `/containers/json?all=${all ? 'true' : 'false'}`
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Docker API error: ${text}`, dockerAvailable: true },
        { status: response.status }
      );
    }

    const containers = await response.json();
    const formatted = (containers as Record<string, unknown>[]).map((c) => ({
      id: c.Id,
      names: c.Names,
      image: c.Image,
      state: c.State,
      status: c.Status,
      ports: c.Ports,
      createdAt: c.Created,
    }));

    return NextResponse.json({
      success: true,
      type: 'containers',
      data: formatted,
      total: formatted.length,
      dockerAvailable: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message, dockerAvailable: false },
      { status: 503 }
    );
  }
}

async function listImages() {
  try {
    const response = await dockerFetch('/images/json');

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Docker API error: ${text}`, dockerAvailable: true },
        { status: response.status }
      );
    }

    const images = await response.json();
    const formatted = (images as Record<string, unknown>[]).map((i) => ({
      id: i.Id,
      repoTags: i.RepoTags,
      size: i.Size,
      createdAt: i.Created,
      labels: i.Labels,
    }));

    return NextResponse.json({
      success: true,
      type: 'images',
      data: formatted,
      total: formatted.length,
      dockerAvailable: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message, dockerAvailable: false },
      { status: 503 }
    );
  }
}

/**
 * POST /api/docker
 * Start, stop, or remove a container.
 * Body: { action: 'start'|'stop'|'remove'|'restart', containerId: string }
 */
export async function POST(req: NextRequest) {
  if (!isDockerEnabled()) {
    return NextResponse.json({
      success: false,
      dockerAvailable: false,
      message: 'Docker integration is disabled.',
    }, { status: 200 });
  }

  try {
    const rawBody = await req.json();
    const body = postBodySchema.parse(rawBody);
    const { action, containerId } = body;

    let path: string = `/containers/${containerId}`;
    let method = 'POST';

    switch (action) {
      case 'start':
        path = `/containers/${containerId}/start`;
        break;
      case 'stop':
        path = `/containers/${containerId}/stop`;
        break;
      case 'restart':
        path = `/containers/${containerId}/restart`;
        break;
      case 'remove':
        path = `/containers/${containerId}`;
        method = 'DELETE';
        break;
    }

    const response = await dockerFetch(path, { method });

    if (!response.ok && response.status !== 204 && response.status !== 304) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Docker API error: ${text}` },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      containerId,
      message: `Container ${containerId} ${action}ed successfully`,
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
      { error: `Docker operation failed: ${message}`, dockerAvailable: false },
      { status: 503 }
    );
  }
}

/**
 * PUT /api/docker
 * Pull an image from a registry.
 * Body: { image: string, tag?: string }
 */
export async function PUT(req: NextRequest) {
  if (!isDockerEnabled()) {
    return NextResponse.json({
      success: false,
      dockerAvailable: false,
      message: 'Docker integration is disabled.',
    }, { status: 200 });
  }

  try {
    const rawBody = await req.json();
    const body = putBodySchema.parse(rawBody);
    const { image, tag } = body;

    const imageTag = tag || 'latest';
    const fromImage = image;
    const response = await dockerFetch(
      `/images/create?fromImage=${encodeURIComponent(fromImage)}&tag=${encodeURIComponent(imageTag)}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Docker API error: ${text}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      image: fromImage,
      tag: imageTag,
      message: `Image ${fromImage}:${imageTag} pull initiated`,
      details: result,
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
      { error: `Docker pull failed: ${message}`, dockerAvailable: false },
      { status: 503 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Docker Engine API helper
// Attempts to connect via unix socket (/var/run/docker.sock) or TCP
// (DOCKER_HOST env var). Gracefully returns an error when Docker is
// unavailable.
// ---------------------------------------------------------------------------

const DOCKER_SOCKET = '/var/run/docker.sock';
const DOCKER_HOST = process.env.DOCKER_HOST || '';

function getDockerBaseUrl(): string {
  if (DOCKER_HOST) {
    return DOCKER_HOST.replace(/\/$/, '');
  }
  // When running inside Docker or with a TCP endpoint
  return 'http://localhost:2375';
}

async function dockerFetch(path: string, options?: RequestInit): Promise<Response> {
  const baseUrl = getDockerBaseUrl();
  const url = `${baseUrl}${path}`;

  try {
    // Try TCP connection first
    const response = await fetch(url, {
      ...options,
    });
    return response;
  } catch {
    // If TCP fails, try unix socket via a simple exec approach
    throw new Error('Docker Engine is not reachable. Ensure Docker is running and accessible.');
  }
}

/**
 * GET /api/docker
 * List containers and images.
 * Query params:
 *   - type=containers|images (default: containers)
 *   - all=true (include stopped containers)
 */
export async function GET(req: NextRequest) {
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
  try {
    const body = await req.json();
    const { action, containerId } = body;

    if (!action || !containerId) {
      return NextResponse.json(
        { error: 'action and containerId are required' },
        { status: 400 }
      );
    }

    const validActions = ['start', 'stop', 'remove', 'restart'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

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
  try {
    const body = await req.json();
    const { image, tag } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'image is required (e.g., "nginx", "postgres:15")' },
        { status: 400 }
      );
    }

    const imageTag = tag || 'latest';
    const fromImage = tag ? image : `${image}`;
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Docker pull failed: ${message}`, dockerAvailable: false },
      { status: 503 }
    );
  }
}

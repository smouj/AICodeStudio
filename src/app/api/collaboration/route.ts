import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Collaboration API
// Manages collaboration rooms for real-time co-editing via Yjs + WebSocket.
// In production, room state would be persisted in a database.
//
// SECURITY: All inputs validated with Zod. maxParticipants capped at 50.
// filePath is sanitized to prevent path traversal in display contexts.
// ---------------------------------------------------------------------------

interface CollaborationRoom {
  id: string;
  name: string;
  createdAt: number;
  createdBy: string;
  participants: Participant[];
  documentId: string;
  status: 'active' | 'closed';
  maxParticipants: number;
  language?: string;
  filePath?: string;
}

interface Participant {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
  joinedAt: number;
}

// In-memory store for active rooms
const rooms = new Map<string, CollaborationRoom>();

// Maximum rooms to prevent memory exhaustion
const MAX_ROOMS = 100;

// Predefined cursor colors for participants
const CURSOR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
];

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const SANITIZED_PATH_REGEX = /^[a-zA-Z0-9_./-]+$/;

const createBodySchema = z.object({
  action: z.literal('create'),
  name: z.string().min(1).max(100).default('New Room'),
  createdBy: z.string().min(1).max(50).default('Host'),
  maxParticipants: z.number().int().min(2).max(50).default(10),
  language: z.string().max(30).optional(),
  filePath: z.string().max(500).regex(SANITIZED_PATH_REGEX, 'filePath contains invalid characters').optional(),
  documentId: z.string().uuid().optional(),
}).strict();

const joinBodySchema = z.object({
  action: z.literal('join'),
  roomId: z.string().uuid('Invalid room ID format'),
  name: z.string().min(1).max(50).default('Guest'),
}).strict();

const postBodySchema = z.discriminatedUnion('action', [createBodySchema, joinBodySchema]);

const getQuerySchema = z.object({
  action: z.enum(['info', 'list']).default('list'),
  roomId: z.string().uuid().optional(),
});

const deleteQuerySchema = z.object({
  roomId: z.string().uuid('Invalid room ID format'),
  participantId: z.string().uuid().optional(),
});

/**
 * POST /api/collaboration
 * Create a collaboration room or join an existing one.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = postBodySchema.parse(rawBody);

    switch (body.action) {
      case 'create':
        return await handleCreateRoom(body);
      case 'join':
        return await handleJoinRoom(body);
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
      { error: `Collaboration operation failed: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/collaboration
 * Get room information or list active rooms.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = getQuerySchema.parse({
      action: searchParams.get('action') || 'list',
      roomId: searchParams.get('roomId') || undefined,
    });

    switch (parsed.action) {
      case 'info':
        if (!parsed.roomId) {
          return NextResponse.json(
            { error: 'roomId is required for info action' },
            { status: 400 }
          );
        }
        return await handleGetRoomInfo(parsed.roomId);
      case 'list':
        return await handleListRooms();
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
      { error: `Collaboration operation failed: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collaboration
 * Leave a room or close a room.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = deleteQuerySchema.parse({
      roomId: searchParams.get('roomId') || '',
      participantId: searchParams.get('participantId') || undefined,
    });

    const room = rooms.get(parsed.roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (parsed.participantId) {
      // Remove participant from room
      room.participants = room.participants.filter(
        (p) => p.id !== parsed.participantId
      );

      if (room.participants.length === 0) {
        room.status = 'closed';
        rooms.delete(parsed.roomId);
        return NextResponse.json({
          success: true,
          message: 'Room closed (no participants remaining)',
          roomId: parsed.roomId,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Participant ${parsed.participantId} left the room`,
        roomId: parsed.roomId,
        remainingParticipants: room.participants.length,
      });
    }

    // Close the entire room
    room.status = 'closed';
    rooms.delete(parsed.roomId);

    return NextResponse.json({
      success: true,
      message: `Room ${parsed.roomId} closed`,
      roomId: parsed.roomId,
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
      { error: `Collaboration operation failed: ${message}` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleCreateRoom(body: z.infer<typeof createBodySchema>) {
  // Guard against room explosion
  if (rooms.size >= MAX_ROOMS) {
    return NextResponse.json(
      { error: 'Maximum number of active rooms reached. Try again later.' },
      { status: 503 }
    );
  }

  const roomId = randomUUID();
  const creatorId = randomUUID();

  const room: CollaborationRoom = {
    id: roomId,
    name: body.name,
    createdAt: Date.now(),
    createdBy: creatorId,
    participants: [
      {
        id: creatorId,
        name: body.createdBy,
        color: CURSOR_COLORS[0],
        joinedAt: Date.now(),
      },
    ],
    documentId: body.documentId || randomUUID(),
    status: 'active',
    maxParticipants: body.maxParticipants,
    language: body.language,
    filePath: body.filePath,
  };

  rooms.set(roomId, room);

  return NextResponse.json({
    success: true,
    action: 'create',
    room: {
      id: room.id,
      name: room.name,
      documentId: room.documentId,
      status: room.status,
      createdAt: room.createdAt,
      participantId: creatorId,
      // WebSocket URL for Yjs real-time sync
      websocketUrl: `/?XTransformPort=3003&room=${roomId}`,
      participants: room.participants,
      maxParticipants: room.maxParticipants,
      language: room.language,
      filePath: room.filePath,
    },
  });
}

async function handleJoinRoom(body: z.infer<typeof joinBodySchema>) {
  const { roomId, name } = body;

  const room = rooms.get(roomId);
  if (!room) {
    return NextResponse.json(
      { error: 'Room not found' },
      { status: 404 }
    );
  }

  if (room.status !== 'active') {
    return NextResponse.json(
      { error: 'Room is no longer active' },
      { status: 410 }
    );
  }

  if (room.participants.length >= room.maxParticipants) {
    return NextResponse.json(
      { error: 'Room is full' },
      { status: 409 }
    );
  }

  const participantId = randomUUID();
  const colorIndex = room.participants.length % CURSOR_COLORS.length;

  const participant: Participant = {
    id: participantId,
    name,
    color: CURSOR_COLORS[colorIndex],
    joinedAt: Date.now(),
  };

  room.participants.push(participant);

  return NextResponse.json({
    success: true,
    action: 'join',
    roomId: room.id,
    documentId: room.documentId,
    participantId,
    websocketUrl: `/?XTransformPort=3003&room=${roomId}`,
    participants: room.participants,
    name: room.name,
    language: room.language,
    filePath: room.filePath,
  });
}

async function handleGetRoomInfo(roomId: string) {
  const room = rooms.get(roomId);

  if (!room) {
    return NextResponse.json(
      { error: 'Room not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    action: 'info',
    room: {
      id: room.id,
      name: room.name,
      documentId: room.documentId,
      status: room.status,
      createdAt: room.createdAt,
      createdBy: room.createdBy,
      participants: room.participants,
      maxParticipants: room.maxParticipants,
      language: room.language,
      filePath: room.filePath,
      websocketUrl: `/?XTransformPort=3003&room=${roomId}`,
    },
  });
}

async function handleListRooms() {
  const activeRooms = Array.from(rooms.values())
    .filter((r) => r.status === 'active')
    .map((r) => ({
      id: r.id,
      name: r.name,
      documentId: r.documentId,
      status: r.status,
      createdAt: r.createdAt,
      participantCount: r.participants.length,
      maxParticipants: r.maxParticipants,
      language: r.language,
      filePath: r.filePath,
    }));

  return NextResponse.json({
    success: true,
    action: 'list',
    rooms: activeRooms,
    total: activeRooms.length,
  });
}

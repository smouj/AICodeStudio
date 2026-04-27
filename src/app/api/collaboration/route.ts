import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Collaboration API
// Manages collaboration rooms for real-time co-editing via Yjs + WebSocket.
// In production, room state would be persisted in a database.
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

// Predefined cursor colors for participants
const CURSOR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
];

/**
 * POST /api/collaboration
 * Create a collaboration room or join an existing one.
 * Body: { action: 'create'|'join', ...params }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return await handleCreateRoom(body);
      case 'join':
        return await handleJoinRoom(body);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: create, join` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
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
 * Query params:
 *   - action=info|list (default: list)
 *   - roomId: room ID (required for info)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'list';
    const roomId = searchParams.get('roomId');

    switch (action) {
      case 'info':
        if (!roomId) {
          return NextResponse.json(
            { error: 'roomId is required for info action' },
            { status: 400 }
          );
        }
        return await handleGetRoomInfo(roomId);
      case 'list':
        return await handleListRooms();
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: info, list` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
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
 * Query params / Body:
 *   - roomId: room ID
 *   - participantId: participant leaving (optional, closes room if creator)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const participantId = searchParams.get('participantId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      );
    }

    const room = rooms.get(roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (participantId) {
      // Remove participant from room
      room.participants = room.participants.filter(
        (p) => p.id !== participantId
      );

      if (room.participants.length === 0) {
        room.status = 'closed';
        rooms.delete(roomId);
        return NextResponse.json({
          success: true,
          message: 'Room closed (no participants remaining)',
          roomId,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Participant ${participantId} left the room`,
        roomId,
        remainingParticipants: room.participants.length,
      });
    }

    // Close the entire room
    room.status = 'closed';
    rooms.delete(roomId);

    return NextResponse.json({
      success: true,
      message: `Room ${roomId} closed`,
      roomId,
    });
  } catch (error: unknown) {
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

async function handleCreateRoom(body: {
  name?: string;
  createdBy?: string;
  maxParticipants?: number;
  language?: string;
  filePath?: string;
  documentId?: string;
}) {
  const roomId = randomUUID();
  const creatorId = randomUUID();

  const room: CollaborationRoom = {
    id: roomId,
    name: body.name || `Room-${roomId.slice(0, 8)}`,
    createdAt: Date.now(),
    createdBy: creatorId,
    participants: [
      {
        id: creatorId,
        name: body.createdBy || 'Host',
        color: CURSOR_COLORS[0],
        joinedAt: Date.now(),
      },
    ],
    documentId: body.documentId || randomUUID(),
    status: 'active',
    maxParticipants: body.maxParticipants || 10,
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

async function handleJoinRoom(body: {
  roomId?: string;
  name?: string;
}) {
  const { roomId, name } = body;

  if (!roomId) {
    return NextResponse.json(
      { error: 'roomId is required' },
      { status: 400 }
    );
  }

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
    name: name || `User-${participantId.slice(0, 6)}`,
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

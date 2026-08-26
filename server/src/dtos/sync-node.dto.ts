import { Selectable } from 'kysely';
import { createZodDto } from 'nestjs-zod';
import { SyncNodeStatusSchema } from 'src/enum';
import { SyncNodeTable, SyncNodeUserTable } from 'src/schema/tables/sync-node.table';
import { asDateTimeString } from 'src/utils/date';
import z from 'zod';

const SyncNodeCreateSchema = z
  .object({
    name: z.string().min(1).describe('Human-readable name, unique across nodes'),
    url: z.url().describe('Base URL of the peer, e.g. https://immich.example.com'),
    apiKey: z.string().min(1).describe('API key for the peer. Write-only: never returned.'),
    isEnabled: z.boolean().default(true).describe('Whether this node participates in scheduled syncs'),
  })
  .meta({ id: 'SyncNodeCreateDto' });

const SyncNodeUpdateSchema = z
  .object({
    name: z.string().min(1).optional().describe('Human-readable name, unique across nodes'),
    url: z.url().optional().describe('Base URL of the peer'),
    // Omitting the key keeps the stored one, so the UI never has to hold it.
    apiKey: z.string().min(1).optional().describe('API key for the peer. Write-only: never returned.'),
    isEnabled: z.boolean().optional().describe('Whether this node participates in scheduled syncs'),
  })
  .meta({ id: 'SyncNodeUpdateDto' });

const SyncNodeResponseSchema = z
  .object({
    id: z.uuidv4().describe('Sync node ID'),
    name: z.string().describe('Human-readable name'),
    url: z.string().describe('Base URL of the peer'),
    isEnabled: z.boolean().describe('Whether this node participates in scheduled syncs'),
    status: SyncNodeStatusSchema,
    remoteVersion: z.string().nullable().describe('Immich version reported by the peer'),
    lastCheckedAt: z.string().meta({ format: 'date-time' }).nullable().describe('Last connectivity check'),
    error: z.string().nullable().describe('Reason the last check failed'),
    createdAt: z.string().meta({ format: 'date-time' }).describe('Creation date'),
    updatedAt: z.string().meta({ format: 'date-time' }).describe('Last update date'),
  })
  .meta({ id: 'SyncNodeResponseDto' });

const SyncNodeTestResponseSchema = z
  .object({
    ok: z.boolean().describe('Whether the peer could be reached and authenticated'),
    status: SyncNodeStatusSchema,
    remoteVersion: z.string().nullable().describe('Immich version reported by the peer'),
    error: z.string().nullable().describe('Failure reason when `ok` is false'),
  })
  .meta({ id: 'SyncNodeTestResponseDto' });

const SyncNodeRemoteUserSchema = z
  .object({
    id: z.string().describe('User ID on the peer'),
    email: z.string().describe('Email on the peer'),
    name: z.string().describe('Name on the peer'),
  })
  .meta({ id: 'SyncNodeRemoteUserDto' });

const SyncPairingCreateSchema = z
  .object({
    localUserId: z.uuidv4().describe('User on this node'),
    remoteUserId: z.uuidv4().describe('User on the peer to pair with'),
    remoteApiKey: z
      .string()
      .min(1)
      .describe(
        "An API key belonging to that user on the peer. Asset endpoints act as the key's owner, so the paired user's own key is required. Write-only: never returned.",
      ),
    pushEnabled: z.boolean().default(true).describe("Send this user's assets to the peer"),
    pullEnabled: z.boolean().default(true).describe("Bring the paired user's assets here"),
  })
  .meta({ id: 'SyncPairingCreateDto' });

const SyncPairingUpdateSchema = z
  .object({
    // Omitting the key keeps the stored one, so the UI never round-trips it.
    remoteApiKey: z.string().min(1).optional().describe('Replacement API key for the paired user'),
    pushEnabled: z.boolean().optional().describe("Send this user's assets to the peer"),
    pullEnabled: z.boolean().optional().describe("Bring the paired user's assets here"),
  })
  .meta({ id: 'SyncPairingUpdateDto' });

const SyncPairingResponseSchema = z
  .object({
    id: z.uuidv4().describe('Pairing ID'),
    nodeId: z.uuidv4().describe('Sync node ID'),
    localUserId: z.uuidv4().describe('User on this node'),
    remoteUserId: z.uuidv4().describe('Paired user on the peer'),
    remoteUserEmail: z.string().describe('Paired user email on the peer'),
    pushEnabled: z.boolean().describe('Whether local assets are sent to the peer'),
    pullEnabled: z.boolean().describe('Whether remote assets are brought here'),
    lastSyncedAt: z.string().meta({ format: 'date-time' }).nullable().describe('Last successful sync'),
    error: z.string().nullable().describe('Reason the last sync failed'),
    createdAt: z.string().meta({ format: 'date-time' }).describe('Creation date'),
  })
  .meta({ id: 'SyncPairingResponseDto' });

export class SyncNodeCreateDto extends createZodDto(SyncNodeCreateSchema) {}
export class SyncNodeUpdateDto extends createZodDto(SyncNodeUpdateSchema) {}
export class SyncNodeResponseDto extends createZodDto(SyncNodeResponseSchema) {}
export class SyncNodeTestResponseDto extends createZodDto(SyncNodeTestResponseSchema) {}
export class SyncNodeRemoteUserDto extends createZodDto(SyncNodeRemoteUserSchema) {}
export class SyncPairingCreateDto extends createZodDto(SyncPairingCreateSchema) {}
export class SyncPairingUpdateDto extends createZodDto(SyncPairingUpdateSchema) {}
export class SyncPairingResponseDto extends createZodDto(SyncPairingResponseSchema) {}

/** Note the absence of `apiKey`: it is write-only and must never reach a client. */
export function mapSyncNode(entity: Selectable<SyncNodeTable>): SyncNodeResponseDto {
  return {
    id: entity.id,
    name: entity.name,
    url: entity.url,
    isEnabled: entity.isEnabled,
    status: entity.status,
    remoteVersion: entity.remoteVersion,
    lastCheckedAt: entity.lastCheckedAt ? asDateTimeString(entity.lastCheckedAt) : null,
    error: entity.error,
    createdAt: asDateTimeString(entity.createdAt),
    updatedAt: asDateTimeString(entity.updatedAt),
  };
}

export function mapSyncPairing(entity: Selectable<SyncNodeUserTable>): SyncPairingResponseDto {
  return {
    id: entity.id,
    nodeId: entity.nodeId,
    localUserId: entity.localUserId,
    remoteUserId: entity.remoteUserId,
    remoteUserEmail: entity.remoteUserEmail,
    pushEnabled: entity.pushEnabled,
    pullEnabled: entity.pullEnabled,
    lastSyncedAt: entity.lastSyncedAt ? asDateTimeString(entity.lastSyncedAt) : null,
    error: entity.error,
    createdAt: asDateTimeString(entity.createdAt),
  };
}

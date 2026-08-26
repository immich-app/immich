import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NODE_SYNC_MAX_ATTEMPTS, serverVersion } from 'src/constants';
import {
  mapSyncNode,
  mapSyncPairing,
  mapSyncPairingItem,
  SyncNodeCreateDto,
  SyncNodeRemoteUserDto,
  SyncNodeResponseDto,
  SyncNodeTestResponseDto,
  SyncNodeUpdateDto,
  SyncPairingCreateDto,
  SyncPairingItemSearchDto,
  SyncPairingItemsResponseDto,
  SyncPairingResponseDto,
  SyncPairingUpdateDto,
} from 'src/dtos/sync-node.dto';
import { JobName, SyncItemFilter, SyncNodeStatus } from 'src/enum';
import { NodeClientError, NodeCredentials } from 'src/repositories/node-client.repository';
import { BaseService } from 'src/services/base.service';

/**
 * Permissions the peer's API key must carry for a sync to be able to do its job.
 * Checked when a node is added so the failure shows up at configuration time
 * rather than in the middle of a scheduled run.
 */
const REQUIRED_REMOTE_PERMISSIONS = [
  'asset.read',
  'asset.upload',
  'asset.update',
  'asset.delete',
  'album.read',
  'album.create',
  'albumAsset.create',
  'adminUser.read',
];

@Injectable()
export class SyncNodeService extends BaseService {
  async getAll(): Promise<SyncNodeResponseDto[]> {
    const nodes = await this.syncNodeRepository.getAll();
    return nodes.map((node) => mapSyncNode(node));
  }

  async get(id: string): Promise<SyncNodeResponseDto> {
    return mapSyncNode(await this.findOrFail(id));
  }

  async create(dto: SyncNodeCreateDto): Promise<SyncNodeResponseDto> {
    const duplicate = await this.syncNodeRepository.getByName(dto.name);
    if (duplicate) {
      throw new BadRequestException('A sync node with that name already exists');
    }

    const url = normalizeUrl(dto.url);
    const check = await this.check({ url, apiKey: dto.apiKey });
    if (!check.ok) {
      throw new BadRequestException(check.error ?? 'Could not connect to the node');
    }

    const node = await this.syncNodeRepository.create({
      name: dto.name,
      url,
      apiKey: dto.apiKey,
      isEnabled: dto.isEnabled,
      status: check.status,
      remoteVersion: check.remoteVersion,
      lastCheckedAt: new Date(),
      error: null,
    });

    return mapSyncNode(node);
  }

  async update(id: string, dto: SyncNodeUpdateDto): Promise<SyncNodeResponseDto> {
    const existing = await this.findOrFail(id);

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.syncNodeRepository.getByName(dto.name);
      if (duplicate) {
        throw new BadRequestException('A sync node with that name already exists');
      }
    }

    const node = await this.syncNodeRepository.update(id, {
      name: dto.name ?? existing.name,
      url: dto.url ? normalizeUrl(dto.url) : existing.url,
      // An omitted key keeps the stored one, so the UI never round-trips it.
      apiKey: dto.apiKey ?? existing.apiKey,
      isEnabled: dto.isEnabled ?? existing.isEnabled,
    });

    return mapSyncNode(node);
  }

  async remove(id: string): Promise<void> {
    await this.findOrFail(id);
    // Pairings and identity maps cascade. Neither library is touched.
    await this.syncNodeRepository.delete(id);
  }

  async test(id: string): Promise<SyncNodeTestResponseDto> {
    const node = await this.findOrFail(id);
    const result = await this.check({ url: node.url, apiKey: node.apiKey });

    await this.syncNodeRepository.update(id, {
      status: result.status,
      remoteVersion: result.remoteVersion,
      lastCheckedAt: new Date(),
      error: result.error,
    });

    return result;
  }

  async getRemoteUsers(id: string): Promise<SyncNodeRemoteUserDto[]> {
    const node = await this.findOrFail(id);
    const users = await this.nodeClientRepository.searchUsers({ url: node.url, apiKey: node.apiKey });
    return users.map(({ id, email, name }) => ({ id, email, name }));
  }

  async getPairings(id: string): Promise<SyncPairingResponseDto[]> {
    await this.findOrFail(id);
    const pairings = await this.syncNodeRepository.getPairings(id);

    return Promise.all(
      pairings.map(async (pairing) =>
        mapSyncPairing(pairing, await this.syncNodeRepository.getItemCounts(pairing.id, NODE_SYNC_MAX_ATTEMPTS)),
      ),
    );
  }

  async getPairing(pairingId: string): Promise<SyncPairingResponseDto> {
    const pairing = await this.findPairingOrFail(pairingId);
    const counts = await this.syncNodeRepository.getItemCounts(pairingId, NODE_SYNC_MAX_ATTEMPTS);
    return mapSyncPairing(pairing, counts);
  }

  /** The outstanding work for one pairing, so a stalled sync can be looked at item by item. */
  async getPairingItems(pairingId: string, dto: SyncPairingItemSearchDto): Promise<SyncPairingItemsResponseDto> {
    await this.findPairingOrFail(pairingId);

    const filter = dto.filter ?? SyncItemFilter.All;
    const [items, total] = await Promise.all([
      this.syncNodeRepository.getItems(pairingId, {
        maxAttempts: NODE_SYNC_MAX_ATTEMPTS,
        filter,
        take: dto.size,
        skip: (dto.page - 1) * dto.size,
      }),
      this.syncNodeRepository.getItemTotal(pairingId, NODE_SYNC_MAX_ATTEMPTS, filter),
    ]);

    return {
      items: items.map((item) => mapSyncPairingItem(item, NODE_SYNC_MAX_ATTEMPTS)),
      total,
      maxAttempts: NODE_SYNC_MAX_ATTEMPTS,
    };
  }

  async createPairing(id: string, dto: SyncPairingCreateDto): Promise<SyncPairingResponseDto> {
    const node = await this.findOrFail(id);

    const localUser = await this.userRepository.get(dto.localUserId, {});
    if (!localUser) {
      throw new BadRequestException('Local user not found');
    }

    const remoteUsers = await this.nodeClientRepository.searchUsers({ url: node.url, apiKey: node.apiKey });
    const remoteUser = remoteUsers.find((user) => user.id === dto.remoteUserId);
    if (!remoteUser) {
      throw new BadRequestException('User not found on the node');
    }

    const existing = await this.syncNodeRepository.getPairings(id);
    if (existing.some((pairing) => pairing.localUserId === dto.localUserId)) {
      throw new BadRequestException('That user is already paired with this node');
    }

    // Asset endpoints act as whoever owns the key, so a key belonging to anyone
    // else would silently file every pushed asset under the wrong account.
    await this.assertKeyBelongsTo({ url: node.url, apiKey: dto.remoteApiKey }, remoteUser.id);

    const pairing = await this.syncNodeRepository.createPairing({
      nodeId: id,
      localUserId: dto.localUserId,
      remoteUserId: remoteUser.id,
      remoteUserEmail: remoteUser.email,
      apiKey: dto.remoteApiKey,
      pushEnabled: dto.pushEnabled,
      pullEnabled: dto.pullEnabled,
    });

    return mapSyncPairing(pairing);
  }

  async updatePairing(pairingId: string, dto: SyncPairingUpdateDto): Promise<SyncPairingResponseDto> {
    const existing = await this.findPairingOrFail(pairingId);

    if (dto.remoteApiKey) {
      const node = await this.findOrFail(existing.nodeId);
      await this.assertKeyBelongsTo({ url: node.url, apiKey: dto.remoteApiKey }, existing.remoteUserId);
    }

    const pairing = await this.syncNodeRepository.updatePairing(pairingId, {
      // An omitted key keeps the stored one.
      apiKey: dto.remoteApiKey ?? existing.apiKey,
      pushEnabled: dto.pushEnabled ?? existing.pushEnabled,
      pullEnabled: dto.pullEnabled ?? existing.pullEnabled,
    });

    return mapSyncPairing(pairing);
  }

  async removePairing(pairingId: string): Promise<void> {
    await this.findPairingOrFail(pairingId);
    await this.syncNodeRepository.deletePairing(pairingId);
  }

  /** Run one pairing now, rather than waiting for the schedule. */
  async syncPairingNow(pairingId: string): Promise<void> {
    await this.findPairingOrFail(pairingId);
    await this.jobRepository.queue({ name: JobName.NodeSyncPair, data: { pairingId } });
  }

  private async check(credentials: NodeCredentials): Promise<SyncNodeTestResponseDto> {
    try {
      const reachable = await this.nodeClientRepository.ping(credentials);
      if (!reachable) {
        return {
          ok: false,
          status: SyncNodeStatus.Unreachable,
          remoteVersion: null,
          error: 'The node did not respond to a ping',
        };
      }

      const info = await this.nodeClientRepository.getServerInfo(credentials);

      // A peer on a different major is not safe to exchange assets with: the API
      // contract this client is written against may simply not be there.
      if (info.versionMajor !== serverVersion.major) {
        return {
          ok: false,
          status: SyncNodeStatus.Incompatible,
          remoteVersion: info.version,
          error: `The node runs Immich ${info.version}, which is a different major version to this one`,
        };
      }

      const { permissions } = await this.nodeClientRepository.getMyApiKey(credentials);
      const missing = missingPermissions(permissions);
      if (missing.length > 0) {
        return {
          ok: false,
          status: SyncNodeStatus.Unauthorized,
          remoteVersion: info.version,
          error: `The API key is missing required permissions: ${missing.join(', ')}`,
        };
      }

      return { ok: true, status: SyncNodeStatus.Online, remoteVersion: info.version, error: null };
    } catch (error: any) {
      const status =
        error instanceof NodeClientError && (error.status === 401 || error.status === 403)
          ? SyncNodeStatus.Unauthorized
          : SyncNodeStatus.Unreachable;

      this.logger.warn(`Sync node check failed: ${error?.message ?? error}`);
      return { ok: false, status, remoteVersion: null, error: error?.message ?? String(error) };
    }
  }

  /** Confirms a key acts as the user it is meant to, rather than as an admin. */
  private async assertKeyBelongsTo(credentials: NodeCredentials, expectedUserId: string): Promise<void> {
    let me;
    try {
      me = await this.nodeClientRepository.getMe(credentials);
    } catch (error: any) {
      throw new BadRequestException(`That API key was not accepted by the node: ${error?.message ?? error}`);
    }

    if (me.id !== expectedUserId) {
      throw new BadRequestException(
        `That API key belongs to ${me.email}, not to the user being paired. Use an API key created by the paired user.`,
      );
    }
  }

  private async findOrFail(id: string) {
    const node = await this.syncNodeRepository.get(id);
    if (!node) {
      throw new NotFoundException('Sync node not found');
    }
    return node;
  }

  private async findPairingOrFail(id: string) {
    const pairing = await this.syncNodeRepository.getPairing(id);
    if (!pairing) {
      throw new NotFoundException('Pairing not found');
    }
    return pairing;
  }
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function missingPermissions(granted: string[]): string[] {
  if (granted.includes('all')) {
    return [];
  }
  return REQUIRED_REMOTE_PERMISSIONS.filter((permission) => !granted.includes(permission));
}

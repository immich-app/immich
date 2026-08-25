import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  mapStorageTarget,
  mapStorageTransfer,
  StorageTargetConfigDto,
  StorageTargetCreateDto,
  StorageTargetResponseDto,
  StorageTargetSecretDto,
  StorageTargetTestResponseDto,
  StorageTargetUpdateDto,
  StorageTransferCreateDto,
  StorageTransferResponseDto,
  StorageTransferScopeDto,
} from 'src/dtos/storage-target.dto';
import {
  JobName,
  StorageTargetKind,
  StorageTransferDirection,
  StorageTransferScopeType,
  StorageTransferStatus,
} from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { StorageTargetConfig, StorageTargetSecret, StorageTransferScope } from 'src/types';

@Injectable()
export class StorageTargetService extends BaseService {
  async getAll(): Promise<StorageTargetResponseDto[]> {
    const targets = await this.storageTargetRepository.getAll();
    return targets.map((target) => mapStorageTarget(target));
  }

  async get(id: string): Promise<StorageTargetResponseDto> {
    const target = await this.findOrFailTarget(id);
    return mapStorageTarget(target);
  }

  async create(dto: StorageTargetCreateDto): Promise<StorageTargetResponseDto> {
    const config = asConfig(dto.kind, dto.config);
    const secret = asSecret(dto.kind, dto.secret);

    const duplicate = await this.storageTargetRepository.getByName(dto.name);
    if (duplicate) {
      throw new BadRequestException('A storage target with that name already exists');
    }

    const target = await this.storageTargetRepository.create({
      name: dto.name,
      kind: dto.kind,
      config,
      secret,
      isEnabled: dto.isEnabled,
    });

    return mapStorageTarget(target);
  }

  async update(id: string, dto: StorageTargetUpdateDto): Promise<StorageTargetResponseDto> {
    const existing = await this.findOrFailTarget(id);

    // The kind is immutable, so an update always narrows against the stored one.
    const config = dto.config ? asConfig(existing.kind, dto.config) : (existing.config as StorageTargetConfig);

    // An omitted secret means "keep what is stored", so the UI never has to hold
    // credentials it cannot read back.
    const secret = dto.secret ? asSecret(existing.kind, dto.secret) : (existing.secret as StorageTargetSecret);

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.storageTargetRepository.getByName(dto.name);
      if (duplicate) {
        throw new BadRequestException('A storage target with that name already exists');
      }
    }

    const target = await this.storageTargetRepository.update(id, {
      name: dto.name ?? existing.name,
      config,
      secret,
      isEnabled: dto.isEnabled ?? existing.isEnabled,
    });

    this.remoteStorageRepository.evict(id);

    return mapStorageTarget(target);
  }

  async remove(id: string): Promise<void> {
    await this.findOrFailTarget(id);
    await this.storageTargetRepository.delete(id);
    this.remoteStorageRepository.evict(id);
  }

  async test(id: string): Promise<StorageTargetTestResponseDto> {
    const target = await this.findOrFailTarget(id);

    try {
      await this.remoteStorageRepository.test(target);
      return { ok: true };
    } catch (error: any) {
      // A failed connection test is an expected outcome of the admin fixing
      // credentials, not a server fault, so report it in the body rather than
      // as a 500.
      this.logger.warn(`Storage target "${target.name}" failed its connection test: ${error}`);
      return { ok: false, error: error?.message ?? String(error) };
    }
  }

  async getTransfers(id: string): Promise<StorageTransferResponseDto[]> {
    await this.findOrFailTarget(id);
    const transfers = await this.storageTargetRepository.getTransfers(id);
    return transfers.map((transfer) => mapStorageTransfer(transfer));
  }

  startExport(id: string, dto: StorageTransferCreateDto): Promise<StorageTransferResponseDto> {
    return this.startTransfer(id, dto, StorageTransferDirection.Export);
  }

  startImport(id: string, dto: StorageTransferCreateDto): Promise<StorageTransferResponseDto> {
    return this.startTransfer(id, dto, StorageTransferDirection.Import);
  }

  private async startTransfer(
    id: string,
    dto: StorageTransferCreateDto,
    direction: StorageTransferDirection,
  ): Promise<StorageTransferResponseDto> {
    const target = await this.findOrFailTarget(id);

    if (!target.isEnabled) {
      throw new BadRequestException('Storage target is disabled');
    }

    const owner = await this.userRepository.get(dto.ownerId, {});
    if (!owner) {
      throw new BadRequestException('User not found');
    }

    const transfer = await this.storageTargetRepository.createTransfer({
      targetId: id,
      ownerId: dto.ownerId,
      direction,
      status: StorageTransferStatus.Pending,
      scope: asScope(dto.scope),
    });

    await this.jobRepository.queue({
      name:
        direction === StorageTransferDirection.Export
          ? JobName.StorageTargetExportQueue
          : JobName.StorageTargetImportScan,
      data: { transferId: transfer.id },
    });

    return mapStorageTransfer(transfer);
  }

  private async findOrFailTarget(id: string) {
    const target = await this.storageTargetRepository.get(id);
    if (!target) {
      throw new NotFoundException('Storage target not found');
    }
    return target;
  }
}

/**
 * Credentials arrive as a flat bag because the API does not make the client repeat
 * the target kind. This narrows that bag to the kind the config declares, and
 * rejects a bag that is missing what the kind needs.
 */
function asSecret(kind: StorageTargetKind, secret: StorageTargetSecretDto): StorageTargetSecret {
  switch (kind) {
    case StorageTargetKind.S3: {
      if (!secret.accessKeyId || !secret.secretAccessKey) {
        throw new BadRequestException('An S3 target requires accessKeyId and secretAccessKey');
      }
      return { kind, accessKeyId: secret.accessKeyId, secretAccessKey: secret.secretAccessKey };
    }
    case StorageTargetKind.WebDav: {
      if (!secret.username || !secret.password) {
        throw new BadRequestException('A WebDAV target requires username and password');
      }
      return { kind, username: secret.username, password: secret.password };
    }
    case StorageTargetKind.Local: {
      return { kind };
    }
    default: {
      throw new BadRequestException(`Unsupported storage target kind: ${kind}`);
    }
  }
}

/**
 * Connection details arrive as a flat bag so that clients get a usable `kind`
 * enum. This narrows that bag to the declared kind and rejects one that is
 * missing what the kind needs.
 */
function asConfig(kind: StorageTargetKind, config: StorageTargetConfigDto): StorageTargetConfig {
  const { prefix } = config;

  switch (kind) {
    case StorageTargetKind.S3: {
      if (!config.bucket) {
        throw new BadRequestException('An S3 target requires a bucket');
      }
      return {
        kind,
        endpoint: config.endpoint,
        bucket: config.bucket,
        region: config.region,
        forcePathStyle: config.forcePathStyle,
        prefix,
      };
    }
    case StorageTargetKind.WebDav: {
      if (!config.baseUrl) {
        throw new BadRequestException('A WebDAV target requires a base URL');
      }
      return { kind, baseUrl: config.baseUrl, prefix };
    }
    case StorageTargetKind.Local: {
      if (!config.basePath) {
        throw new BadRequestException('A filesystem target requires a path');
      }
      return { kind, basePath: config.basePath, prefix };
    }
    default: {
      throw new BadRequestException(`Unsupported storage target kind: ${kind}`);
    }
  }
}

/** Narrows the flat scope payload to the variant its `type` declares. */
function asScope(scope: StorageTransferScopeDto): StorageTransferScope {
  switch (scope.type) {
    case StorageTransferScopeType.Albums: {
      if (!scope.albumIds?.length) {
        throw new BadRequestException('A transfer scoped to albums requires at least one album');
      }
      return { type: scope.type, albumIds: scope.albumIds };
    }
    case StorageTransferScopeType.Assets: {
      if (!scope.assetIds?.length) {
        throw new BadRequestException('A transfer scoped to assets requires at least one asset');
      }
      return { type: scope.type, assetIds: scope.assetIds };
    }
    default: {
      return { type: StorageTransferScopeType.All };
    }
  }
}

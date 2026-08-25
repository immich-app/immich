import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  mapStorageTarget,
  mapStorageTransfer,
  StorageTargetCreateDto,
  StorageTargetResponseDto,
  StorageTargetTestResponseDto,
  StorageTargetUpdateDto,
  StorageTransferCreateDto,
  StorageTransferResponseDto,
} from 'src/dtos/storage-target.dto';
import { JobName, StorageTransferDirection, StorageTransferStatus } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { StorageTargetConfig, StorageTargetSecret } from 'src/types';

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
    if (dto.config.kind !== dto.secret.kind) {
      throw new BadRequestException('Storage target config and credentials must be for the same kind');
    }

    const duplicate = await this.storageTargetRepository.getByName(dto.name);
    if (duplicate) {
      throw new BadRequestException('A storage target with that name already exists');
    }

    const target = await this.storageTargetRepository.create({
      name: dto.name,
      kind: dto.config.kind,
      config: dto.config as StorageTargetConfig,
      secret: dto.secret as StorageTargetSecret,
      isEnabled: dto.isEnabled,
    });

    return mapStorageTarget(target);
  }

  async update(id: string, dto: StorageTargetUpdateDto): Promise<StorageTargetResponseDto> {
    const existing = await this.findOrFailTarget(id);

    // An omitted secret means "keep what is stored", so the UI never has to hold
    // credentials it cannot read back.
    const config = (dto.config ?? existing.config) as StorageTargetConfig;
    const secret = (dto.secret ?? existing.secret) as StorageTargetSecret;

    if (config.kind !== secret.kind) {
      throw new BadRequestException(
        'Changing the kind of an existing storage target requires supplying matching credentials',
      );
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.storageTargetRepository.getByName(dto.name);
      if (duplicate) {
        throw new BadRequestException('A storage target with that name already exists');
      }
    }

    const target = await this.storageTargetRepository.update(id, {
      name: dto.name ?? existing.name,
      kind: config.kind,
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
      scope: dto.scope,
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

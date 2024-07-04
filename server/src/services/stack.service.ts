import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AccessCore, Permission } from 'src/cores/access.core';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { StackCreateDto, StackResponseDto, StackUpdateDto, mapStack } from 'src/dtos/stack.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStackRepository } from 'src/interfaces/stack.interface';
import { addAssets, removeAssets } from 'src/utils/asset.util';

@Injectable()
export class StackService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) private accessRepository: IAccessRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(IStackRepository) private stackRepository: IStackRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async create(auth: AuthDto, dto: StackCreateDto): Promise<StackResponseDto> {
    await this.access.checkAccess(auth, Permission.ASSET_READ, dto.assetIds);

    const [primaryId, ...assetIds] = dto.assetIds;
    const stack = await this.stackRepository.create({
      primaryAssetId: primaryId,
      assets: assetIds.map((id) => ({ id }) as AssetEntity),
    });

    return mapStack(stack, { auth });
  }

  async get(auth: AuthDto, id: string): Promise<StackResponseDto> {
    await this.access.requirePermission(auth, Permission.STACK_READ, id);
    const stack = await this.findOrFail(id);
    return mapStack(stack, { auth });
  }

  async update(auth: AuthDto, id: string, dto: StackUpdateDto): Promise<StackResponseDto> {
    await this.access.requirePermission(auth, Permission.STACK_WRITE, id);
    let stack = await this.findOrFail(id);

    if (dto.primaryAssetId && !stack.assets.some(({ id }) => id === dto.primaryAssetId)) {
      throw new BadRequestException('Primary asset must be in the stack');
    }

    stack = await this.stackRepository.update({ id, primaryAssetId: dto.primaryAssetId });

    return mapStack(stack, { auth });
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.access.requirePermission(auth, Permission.STACK_DELETE, id);
    await this.stackRepository.delete(id);
  }

  async deleteAll(auth: AuthDto, dto: BulkIdsDto): Promise<void> {
    await this.access.requirePermission(auth, Permission.STACK_DELETE, dto.ids);
    await this.stackRepository.deleteAll(dto.ids);
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.access.requirePermission(auth, Permission.STACK_ADD_ASSET, id);
    return addAssets(
      auth,
      { accessRepository: this.accessRepository, repository: this.stackRepository },
      { parentId: id, assetIds: dto.ids },
    );
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.access.requirePermission(auth, Permission.STACK_REMOVE_ASSET, id);
    const stack = await this.findOrFail(id);

    const results = await removeAssets(
      auth,
      { accessRepository: this.accessRepository, repository: this.stackRepository },
      { parentId: id, assetIds: dto.ids, canAlwaysRemove: Permission.STACK_REMOVE_ASSET },
    );

    const removedIds = results.filter(({ success }) => success).map(({ id }) => id);
    if (removedIds.includes(stack.primaryAssetId)) {
      await this.stackRepository.updatePrimaryAssets();
    }

    return results;
  }

  async merge(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.access.requirePermission(auth, Permission.STACK_WRITE, id);

    const results: BulkIdResponseDto[] = [];
    const mergeIds = dto.ids;
    const allowedIds = await this.access.checkAccess(auth, Permission.STACK_MERGE, mergeIds);

    for (const mergeId of mergeIds) {
      const hasAccess = allowedIds.has(mergeId);
      if (!hasAccess) {
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      try {
        const mergeStack = await this.stackRepository.getById(mergeId);
        if (!mergeStack) {
          results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NOT_FOUND });
          continue;
        }

        await this.stackRepository.addAssetIds(
          id,
          mergeStack.assets.map(({ id }) => id),
        );

        await this.stackRepository.delete(mergeId);

        results.push({ id: mergeId, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to merge ${mergeId} into ${id}: ${error}`, error?.stack);
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }

    return results;
  }

  private async findOrFail(id: string) {
    const stack = await this.stackRepository.getById(id);
    if (!stack) {
      throw new Error('Asset stack not found');
    }

    return stack;
  }
}

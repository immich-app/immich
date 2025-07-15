import { BadRequestException, Injectable } from '@nestjs/common';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { StackCreateDto, StackResponseDto, StackSearchDto, StackUpdateDto, mapStack } from 'src/dtos/stack.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class StackService extends BaseService {
  async search(auth: AuthDto, dto: StackSearchDto): Promise<StackResponseDto[]> {
    const stacks = await this.stackRepository.search({
      ownerId: auth.user.id,
      primaryAssetId: dto.primaryAssetId,
    });

    return stacks.map((stack) => mapStack(stack, { auth }));
  }

  async create(auth: AuthDto, dto: StackCreateDto): Promise<StackResponseDto> {
    await this.requireAccess({ auth, permission: Permission.ASSET_UPDATE, ids: dto.assetIds });

    const stack = await this.stackRepository.create({ ownerId: auth.user.id }, dto.assetIds);

    await this.eventRepository.emit('stack.create', { stackId: stack.id, userId: auth.user.id });

    return mapStack(stack, { auth });
  }

  async get(auth: AuthDto, id: string): Promise<StackResponseDto> {
    await this.requireAccess({ auth, permission: Permission.STACK_READ, ids: [id] });
    const stack = await this.findOrFail(id);
    return mapStack(stack, { auth });
  }

  async update(auth: AuthDto, id: string, dto: StackUpdateDto): Promise<StackResponseDto> {
    await this.requireAccess({ auth, permission: Permission.STACK_UPDATE, ids: [id] });
    const stack = await this.findOrFail(id);
    if (dto.primaryAssetId && !stack.assets.some(({ id }) => id === dto.primaryAssetId)) {
      throw new BadRequestException('Primary asset must be in the stack');
    }

    const updatedStack = await this.stackRepository.update(id, { id, primaryAssetId: dto.primaryAssetId });

    await this.eventRepository.emit('stack.update', { stackId: id, userId: auth.user.id });

    return mapStack(updatedStack, { auth });
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.STACK_DELETE, ids: [id] });
    await this.stackRepository.delete(id);
    await this.eventRepository.emit('stack.delete', { stackId: id, userId: auth.user.id });
  }

  async deleteAll(auth: AuthDto, dto: BulkIdsDto): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.STACK_DELETE, ids: dto.ids });
    await this.stackRepository.deleteAll(dto.ids);
    await this.eventRepository.emit('stacks.delete', { stackIds: dto.ids, userId: auth.user.id });
  }

  async removeAsset(auth: AuthDto, stackId: string, assetId: string): Promise<StackResponseDto> {
    await this.requireAccess({ auth, permission: Permission.STACK_UPDATE, ids: [stackId] });
    await this.requireAccess({ auth, permission: Permission.ASSET_UPDATE, ids: [assetId] });

    //Verify the asset is in the stack
    const asset = await this.assetRepository.getById(assetId);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }
    if (asset?.stackId !== stackId) {
      throw new BadRequestException('Asset not in stack');
    }

    //Verify the stack has more than 2 assets
    const stack = await this.findOrFail(stackId);
    if (stack.assets?.length <= 2) {
      throw new BadRequestException('Cannot remove last or second to last asset');
    }

    //Verify the asset is not the stack's primary asset
    if (stack.primaryAssetId === assetId) {
      throw new BadRequestException("Cannot remove stack's primary asset");
    }

    await this.assetRepository.update({ id: assetId, stackId: null });
    await this.eventRepository.emit('stack.update', { stackId, userId: auth.user.id });

    const updatedStack = {
      ...stack,
      assets: stack.assets?.filter((a) => a.id !== assetId),
    };
    return mapStack(updatedStack, { auth });
  }

  private async findOrFail(id: string) {
    const stack = await this.stackRepository.getById(id);
    if (!stack) {
      throw new Error('Asset stack not found');
    }

    return stack;
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'node:path';
import { OnJob } from 'src/decorators';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { StackCreateDto, StackResponseDto, StackSearchDto, StackUpdateDto, mapStack } from 'src/dtos/stack.dto';
import { JobName, JobStatus, Permission, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { mimeTypes } from 'src/utils/mime-types';
import { UUIDAssetIDParamDto } from 'src/validation';

type StackCandidate = {
  id: string;
  originalFileName: string;
};

const getStackName = (filename: string) => {
  const extension = extname(filename);
  const stem = filename.slice(0, -extension.length);
  const match = /^(.*?)(?:-(\d+))?$/.exec(stem);
  const name = match?.[1]?.normalize('NFKC').toLowerCase();

  if (!extension || !name) {
    return;
  }

  return {
    extension: extension.toLowerCase(),
    name,
    number: match?.[2] === undefined ? -1 : Number(match[2]),
  };
};

const getFormatRank = (filename: string) => {
  if (mimeTypes.lookup(filename) === 'image/jpeg') {
    return 0;
  }

  if (mimeTypes.isHeifImage(filename)) {
    return 1;
  }

  return mimeTypes.isRaw(filename) ? 3 : 2;
};

const compareStackCandidates = (a: StackCandidate, b: StackCandidate) => {
  const aName = getStackName(a.originalFileName)!;
  const bName = getStackName(b.originalFileName)!;

  return (
    getFormatRank(a.originalFileName) - getFormatRank(b.originalFileName) ||
    aName.number - bName.number ||
    aName.extension.localeCompare(bName.extension) ||
    a.originalFileName.localeCompare(b.originalFileName) ||
    a.id.localeCompare(b.id)
  );
};

@Injectable()
export class StackService extends BaseService {
  @OnJob({ name: JobName.AssetStacking, queue: QueueName.AssetStacking })
  async handleAutomaticStacking(): Promise<JobStatus> {
    const groups = new Map<string, { ownerId: string; assets: StackCandidate[] }>();

    for await (const asset of this.stackRepository.streamForAutomaticStacking()) {
      const stackName = getStackName(asset.originalFileName);
      if (!stackName) {
        continue;
      }

      const captureDate = asset.localDateTime.toISOString().slice(0, 10);
      const key = `${asset.ownerId}\0${asset.visibility}\0${captureDate}\0${stackName.name}`;
      const group = groups.get(key) ?? { ownerId: asset.ownerId, assets: [] };
      group.assets.push(asset);
      groups.set(key, group);
    }

    let created = 0;
    for (const { ownerId, assets } of groups.values()) {
      if (assets.length < 2) {
        continue;
      }

      assets.sort(compareStackCandidates);
      const stack = await this.stackRepository.create(
        { ownerId },
        assets.map(({ id }) => id),
      );
      await this.eventRepository.emit('StackCreate', { stackId: stack.id, userId: ownerId });
      created++;
    }

    this.logger.log(`Automatically created ${created} asset stack${created === 1 ? '' : 's'}`);
    return JobStatus.Success;
  }

  async search(auth: AuthDto, dto: StackSearchDto): Promise<StackResponseDto[]> {
    const stacks = await this.stackRepository.search({
      ownerId: auth.user.id,
      primaryAssetId: dto.primaryAssetId,
    });

    return stacks.map((stack) => mapStack(stack, { auth }));
  }

  async create(auth: AuthDto, dto: StackCreateDto): Promise<StackResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: dto.assetIds });

    const stack = await this.stackRepository.create({ ownerId: auth.user.id }, dto.assetIds);

    await this.eventRepository.emit('StackCreate', { stackId: stack.id, userId: auth.user.id });

    return mapStack(stack, { auth });
  }

  async get(auth: AuthDto, id: string): Promise<StackResponseDto> {
    await this.requireAccess({ auth, permission: Permission.StackRead, ids: [id] });
    const stack = await this.findOrFail(id);
    return mapStack(stack, { auth });
  }

  async update(auth: AuthDto, id: string, dto: StackUpdateDto): Promise<StackResponseDto> {
    await this.requireAccess({ auth, permission: Permission.StackUpdate, ids: [id] });
    const stack = await this.findOrFail(id);
    if (dto.primaryAssetId && stack.assets.every(({ id }) => id !== dto.primaryAssetId)) {
      throw new BadRequestException('Primary asset must be in the stack');
    }

    const updatedStack = await this.stackRepository.update(id, { id, primaryAssetId: dto.primaryAssetId });

    await this.eventRepository.emit('StackUpdate', { stackId: id, userId: auth.user.id });

    return mapStack(updatedStack, { auth });
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.StackDelete, ids: [id] });
    await this.stackRepository.delete(id);
    await this.eventRepository.emit('StackDelete', { stackId: id, userId: auth.user.id });
  }

  async deleteAll(auth: AuthDto, dto: BulkIdsDto): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.StackDelete, ids: dto.ids });
    await this.stackRepository.deleteAll(dto.ids);
    await this.eventRepository.emit('StackDeleteAll', { stackIds: dto.ids, userId: auth.user.id });
  }

  async removeAsset(auth: AuthDto, dto: UUIDAssetIDParamDto): Promise<void> {
    const { id: stackId, assetId } = dto;
    await this.requireAccess({ auth, permission: Permission.StackUpdate, ids: [stackId] });

    const stack = await this.stackRepository.getForAssetRemoval(assetId);

    if (!stack?.id || stack.id !== stackId) {
      throw new BadRequestException('Asset not in stack');
    }

    if (stack.primaryAssetId === assetId) {
      throw new BadRequestException("Cannot remove stack's primary asset");
    }

    await this.assetRepository.update({ id: assetId, stackId: null });
    await this.eventRepository.emit('StackUpdate', { stackId, userId: auth.user.id });
  }

  private async findOrFail(id: string) {
    const stack = await this.stackRepository.getById(id);
    if (!stack) {
      throw new Error('Asset stack not found');
    }

    return stack;
  }
}

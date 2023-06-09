import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssetResponseDto, mapAsset } from '../asset';
import { AuthUserDto } from '../auth';
import { IJobRepository, JobName } from '../job';
import { ImmichReadStream, IStorageRepository } from '../storage';
import { PersonUpdateDto } from './dto';
import { IPersonRepository } from './person.repository';
import { mapPerson, PersonResponseDto } from './response-dto';

@Injectable()
export class PersonService {
  readonly logger = new Logger(PersonService.name);

  constructor(
    @Inject(IPersonRepository) private repository: IPersonRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {}

  async getAll(authUser: AuthUserDto): Promise<PersonResponseDto[]> {
    const people = await this.repository.getAll(authUser.id, { minimumFaceCount: 1 });
    const named = people.filter((person) => !!person.name);
    const unnamed = people.filter((person) => !person.name);
    return (
      [...named, ...unnamed]
        // with thumbnails
        .filter((person) => !!person.thumbnailPath)
        .map((person) => mapPerson(person))
    );
  }

  async getById(authUser: AuthUserDto, personId: string): Promise<PersonResponseDto> {
    const person = await this.repository.getById(authUser.id, personId);
    if (!person) {
      throw new BadRequestException();
    }

    return mapPerson(person);
  }

  async getThumbnail(authUser: AuthUserDto, personId: string): Promise<ImmichReadStream> {
    const person = await this.repository.getById(authUser.id, personId);
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return this.storageRepository.createReadStream(person.thumbnailPath, 'image/jpeg');
  }

  async getAssets(authUser: AuthUserDto, personId: string): Promise<AssetResponseDto[]> {
    const assets = await this.repository.getAssets(authUser.id, personId);
    return assets.map(mapAsset);
  }

  async update(authUser: AuthUserDto, personId: string, dto: PersonUpdateDto): Promise<PersonResponseDto> {
    const exists = await this.repository.getById(authUser.id, personId);
    if (!exists) {
      throw new BadRequestException();
    }

    const person = await this.repository.update({ id: personId, name: dto.name });

    const relatedAsset = await this.getAssets(authUser, personId);
    const assetIds = relatedAsset.map((asset) => asset.id);
    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: assetIds } });

    return mapPerson(person);
  }

  async handlePersonCleanup() {
    const people = await this.repository.getAllWithoutFaces();
    for (const person of people) {
      this.logger.debug(`Person ${person.name || person.id} no longer has any faces, deleting.`);
      try {
        await this.repository.delete(person);
        await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files: [person.thumbnailPath] } });
      } catch (error: Error | any) {
        this.logger.error(`Unable to delete person: ${error}`, error?.stack);
      }
    }

    return true;
  }
}

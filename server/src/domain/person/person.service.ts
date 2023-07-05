import { PersonEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssetResponseDto, mapAsset } from '../asset';
import { AuthUserDto } from '../auth';
import { IJobRepository, JobName } from '../job';
import { ImmichReadStream, IStorageRepository } from '../storage';
import { mapPerson, MergePersonDto, PersonResponseDto, PersonUpdateDto } from './person.dto';
import { IPersonRepository } from './person.repository';

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
    // TODO: clean up with findorFail
    const person = await this.repository.getById(authUser.id, personId);
    if (!person) {
      throw new BadRequestException();
    }

    return mapPerson(person);
  }

  async getThumbnail(authUser: AuthUserDto, personId: string): Promise<ImmichReadStream> {
    // TODO: clean up with findorFail
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
    // TODO: clean up with findorFail
    let person = await this.repository.getById(authUser.id, personId);
    if (!person) {
      throw new BadRequestException();
    }

    if (dto.name) {
      person = await this.updateName(authUser, personId, dto.name);
    }

    if (dto.featureFaceAssetId) {
      await this.updateFaceThumbnail(personId, dto.featureFaceAssetId);
    }

    return mapPerson(person);
  }

  private async updateName(authUser: AuthUserDto, personId: string, name: string): Promise<PersonEntity> {
    const person = await this.repository.update({ id: personId, name });

    const relatedAsset = await this.getAssets(authUser, personId);
    const assetIds = relatedAsset.map((asset) => asset.id);
    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: assetIds } });

    return person;
  }

  private async updateFaceThumbnail(personId: string, assetId: string): Promise<void> {
    const face = await this.repository.getFaceById({ assetId, personId });

    if (!face) {
      throw new BadRequestException();
    }

    return await this.jobRepository.queue({
      name: JobName.GENERATE_FACE_THUMBNAIL,
      data: {
        assetId: assetId,
        personId,
        boundingBox: {
          x1: face.boundingBoxX1,
          x2: face.boundingBoxX2,
          y1: face.boundingBoxY1,
          y2: face.boundingBoxY2,
        },
        imageHeight: face.imageHeight,
        imageWidth: face.imageWidth,
      },
    });
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

  async mergePerson(authUser: AuthUserDto, personId: string, dto: MergePersonDto) {
    const mergeIds = dto.ids;
    const primaryPerson = await this.findOrFail(authUser, personId);

    for (const mergeId of mergeIds) {
      const mergePerson = await this.findOrFail(authUser, mergeId);

      // Find and remove duplicated entry in asset_faces table
      const identicalAssetIds = await this.repository.deleteFacesForSharedAssets({
        oldPersonId: mergeId,
        newPersonId: personId,
      });

      // Remove record of duplicated entry in asset_faces table
      // and Typesense database belong to merge person
      if (identicalAssetIds.length > 0) {
        for (const assetId of identicalAssetIds) {
          await this.jobRepository.queue({
            name: JobName.SEARCH_REMOVE_FACE,
            data: { assetId, personId: mergeId },
          });
        }
        this.logger.debug(`Deleted ${identicalAssetIds.length} faces preparing for person merge`);
      }

      const affectedUpdate = await this.repository.reassignFaces({
        oldPersonId: mergeId,
        newPersonId: personId,
      });

      this.logger.debug(
        `Merged person ${mergePerson.name ?? mergeId} into ${
          primaryPerson.name == '' ? primaryPerson.id : primaryPerson.name
        } - ${affectedUpdate} assets updated`,
      );

      // Delete merge person
      await this.repository.delete(mergePerson);
      this.logger.debug(`Deleted person ${mergeId} (${mergePerson.name})`);
    }
  }

  private async findOrFail(authUser: AuthUserDto, id: string) {
    const person = await this.repository.getById(authUser.id, id);
    if (!person) {
      throw new BadRequestException('Person not found');
    }
    return person;
  }
}

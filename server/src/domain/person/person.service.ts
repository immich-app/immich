import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssetResponseDto, BulkIdErrorReason, BulkIdResponseDto, mapAsset } from '../asset';
import { AuthUserDto } from '../auth';
import { mimeTypes } from '../domain.constant';
import { IJobRepository, JobName } from '../job';
import { ImmichReadStream, IStorageRepository } from '../storage';
import {
  mapPerson,
  MergePersonDto,
  PeopleResponseDto,
  PeopleUpdateDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonUpdateDto,
} from './person.dto';
import { IPersonRepository, UpdateFacesData } from './person.repository';

@Injectable()
export class PersonService {
  readonly logger = new Logger(PersonService.name);

  constructor(
    @Inject(IPersonRepository) private repository: IPersonRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {}

  async getAll(authUser: AuthUserDto, dto: PersonSearchDto): Promise<PeopleResponseDto> {
    const people = await this.repository.getAll(authUser.id, { minimumFaceCount: 1 });

    const persons: PersonResponseDto[] = people
      // with thumbnails
      .filter((person) => !!person.thumbnailPath)
      .map((person) => mapPerson(person));

    return {
      people: persons.filter((person) => dto.withHidden || !person.isHidden),
      total: persons.length,
      visible: persons.filter((person: PersonResponseDto) => !person.isHidden).length,
    };
  }

  getById(authUser: AuthUserDto, id: string): Promise<PersonResponseDto> {
    return this.findOrFail(authUser, id).then(mapPerson);
  }

  async getThumbnail(authUser: AuthUserDto, id: string): Promise<ImmichReadStream> {
    const person = await this.repository.getById(authUser.id, id);
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return this.storageRepository.createReadStream(person.thumbnailPath, mimeTypes.lookup(person.thumbnailPath));
  }

  async getAssets(authUser: AuthUserDto, id: string): Promise<AssetResponseDto[]> {
    const assets = await this.repository.getAssets(authUser.id, id);
    return assets.map(mapAsset);
  }

  async update(authUser: AuthUserDto, id: string, dto: PersonUpdateDto): Promise<PersonResponseDto> {
    let person = await this.findOrFail(authUser, id);

    if (dto.name != undefined || dto.isHidden !== undefined) {
      person = await this.repository.update({ id, name: dto.name, isHidden: dto.isHidden });
      const assets = await this.repository.getAssets(authUser.id, id);
      const ids = assets.map((asset) => asset.id);
      await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids } });
    }

    if (dto.featureFaceAssetId) {
      const assetId = dto.featureFaceAssetId;
      const face = await this.repository.getFaceById({ personId: id, assetId });
      if (!face) {
        throw new BadRequestException('Invalid assetId for feature face');
      }

      await this.jobRepository.queue({
        name: JobName.GENERATE_FACE_THUMBNAIL,
        data: {
          personId: id,
          assetId,
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

    return mapPerson(person);
  }

  async updatePeople(authUser: AuthUserDto, dto: PeopleUpdateDto): Promise<BulkIdResponseDto[]> {
    const results: BulkIdResponseDto[] = [];
    for (const person of dto.people) {
      try {
        await this.update(authUser, person.id, {
          isHidden: person.isHidden,
          name: person.name,
          featureFaceAssetId: person.featureFaceAssetId,
        }),
          results.push({ id: person.id, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to update ${person.id} : ${error}`, error?.stack);
        results.push({ id: person.id, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }
    return results;
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

  async mergePerson(authUser: AuthUserDto, id: string, dto: MergePersonDto): Promise<BulkIdResponseDto[]> {
    const mergeIds = dto.ids;
    const primaryPerson = await this.findOrFail(authUser, id);
    const primaryName = primaryPerson.name || primaryPerson.id;

    const results: BulkIdResponseDto[] = [];

    for (const mergeId of mergeIds) {
      try {
        const mergePerson = await this.repository.getById(authUser.id, mergeId);
        if (!mergePerson) {
          results.push({ id: mergeId, success: false, error: BulkIdErrorReason.NOT_FOUND });
          continue;
        }

        const mergeName = mergePerson.name || mergePerson.id;
        const mergeData: UpdateFacesData = { oldPersonId: mergeId, newPersonId: id };
        this.logger.log(`Merging ${mergeName} into ${primaryName}`);

        const assetIds = await this.repository.prepareReassignFaces(mergeData);
        for (const assetId of assetIds) {
          await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_FACE, data: { assetId, personId: mergeId } });
        }
        await this.repository.reassignFaces(mergeData);
        await this.repository.delete(mergePerson);

        this.logger.log(`Merged ${mergeName} into ${primaryName}`);
        results.push({ id: mergeId, success: true });
      } catch (error: Error | any) {
        this.logger.error(`Unable to merge ${mergeId} into ${id}: ${error}`, error?.stack);
        results.push({ id: mergeId, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }

    // Re-index all faces in typesense for up-to-date search results
    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_FACES });

    return results;
  }

  private async findOrFail(authUser: AuthUserDto, id: string) {
    const person = await this.repository.getById(authUser.id, id);
    if (!person) {
      throw new BadRequestException('Person not found');
    }
    return person;
  }
}

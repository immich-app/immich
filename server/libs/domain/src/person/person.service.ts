import { AssetEntity } from '@app/infra/entities';
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
    const people = await this.repository.getAll(authUser.id);
    return people.map((person) => mapPerson(person));
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
    const person = await this.repository.getById(authUser.id, personId);
    if (!person) {
      throw new BadRequestException();
    }

    const updatedPerson = await this.repository.update({ ...person, name: dto.name });

    const relatedAsset = await this.getAssets(authUser, personId);
    const assetIds = relatedAsset.map((asset) => asset.id);
    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: assetIds } });

    return mapPerson(updatedPerson);
  }

  async removePersonWithNoFaceData(asset: AssetEntity): Promise<void> {
    if (!asset.faces.length) {
      return;
    }

    asset.faces.forEach(async (assetFaces) => {
      const facesCount = await this.repository.getFacesCountById(assetFaces.personId);

      if (facesCount === 0) {
        const person = await this.repository.getById(asset.ownerId, assetFaces.personId);
        if (!person) {
          return;
        }

        this.logger.debug(
          `Removing person ${assetFaces.personId} ${assetFaces.person.name} because it has no faces associated`,
        );
        await this.repository.delete(person);
      }
    });
  }
}

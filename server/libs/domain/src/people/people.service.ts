import { PersonEntity } from '@app/infra/entities';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssetResponseDto, mapAsset, PersonResponseDto } from '../asset';
import { ImmichReadStream, IStorageRepository } from '../storage';
import { IPeopleRepository } from './people.repository';

@Injectable()
export class PeopleService {
  private logger = new Logger(PeopleService.name);

  constructor(
    @Inject(IPeopleRepository) private repository: IPeopleRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {}

  async getFaceThumbnail(userId: string, personId: string): Promise<ImmichReadStream> {
    const person = await this.repository.getById(userId, personId);
    if (!person || !person.thumbnailPath) {
      throw new NotFoundException();
    }

    return this.storageRepository.createReadStream(person.thumbnailPath, 'image/jpeg');
  }

  async getAllPeople(userId: string): Promise<PersonResponseDto[]> {
    const people = await this.repository.getAll(userId);
    return people.map(this.mapPerson);
  }

  async getPersonById(userId: string, personId: string): Promise<PersonResponseDto> {
    const person = await this.repository.getById(userId, personId);
    if (!person) {
      throw new NotFoundException();
    }

    return this.mapPerson(person);
  }

  async getPersonAssets(personId: string): Promise<AssetResponseDto[]> {
    const assets = await this.repository.getPersonAssets(personId);
    return assets.map(mapAsset);
  }

  private mapPerson(person: PersonEntity): PersonResponseDto {
    const personResponseDto = new PersonResponseDto();
    personResponseDto.id = person.id;
    personResponseDto.name = person.name;
    personResponseDto.thumbnailPath = person.thumbnailPath;

    return personResponseDto;
  }
}

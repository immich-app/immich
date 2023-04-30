import { PersonEntity } from '@app/infra/entities';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdatePersonDto } from 'apps/immich/src/controllers/dto/update-person.dto';
import { AssetResponseDto, mapAsset, PersonResponseDto } from '../asset';
import { ImmichReadStream, IStorageRepository } from '../storage';
import { IPersonRepository } from './person.repository';

@Injectable()
export class PersonService {
  private logger = new Logger(PersonService.name);

  constructor(
    @Inject(IPersonRepository) private repository: IPersonRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {}

  async update(userId: string, personId: string, dto: UpdatePersonDto): Promise<PersonResponseDto> {
    const person = await this.repository.getById(userId, personId);
    if (!person) {
      throw new NotFoundException();
    }

    person.name = dto.name;
    await this.repository.update(person);

    return this.mapPerson(person);
  }

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

  async getAssets(personId: string): Promise<AssetResponseDto[]> {
    const assets = await this.repository.getAssets(personId);
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

import { Insertable, Selectable, Updateable } from 'kysely';
import { AssetFaces, FaceSearch, Person } from 'src/db';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { SourceType } from 'src/enum';
import { Paginated, PaginationOptions } from 'src/utils/pagination';
import { FindOptionsRelations } from 'typeorm';

export const IPersonRepository = 'IPersonRepository';

export interface PersonSearchOptions {
  minimumFaceCount: number;
  withHidden: boolean;
  closestFaceAssetId?: string;
}

export interface PersonNameSearchOptions {
  withHidden?: boolean;
}

export interface PersonNameResponse {
  id: string;
  name: string;
}

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface UpdateFacesData {
  oldPersonId?: string;
  faceIds?: string[];
  newPersonId: string;
}

export interface PersonStatistics {
  assets: number;
}

export interface PeopleStatistics {
  total: number;
  hidden: number;
}

export interface DeleteFacesOptions {
  sourceType: SourceType;
}

export type UnassignFacesOptions = DeleteFacesOptions;

export type SelectFaceOptions = (keyof Selectable<AssetFaces>)[];

export interface IPersonRepository {
  getAll(options?: Partial<PersonEntity>): AsyncIterableIterator<PersonEntity>;
  getAllForUser(pagination: PaginationOptions, userId: string, options: PersonSearchOptions): Paginated<PersonEntity>;
  getAllWithoutFaces(): Promise<PersonEntity[]>;
  getById(personId: string): Promise<PersonEntity | null>;
  getByName(userId: string, personName: string, options: PersonNameSearchOptions): Promise<PersonEntity[]>;
  getDistinctNames(userId: string, options: PersonNameSearchOptions): Promise<PersonNameResponse[]>;

  create(person: Insertable<Person>): Promise<PersonEntity>;
  createAll(people: Insertable<Person>[]): Promise<string[]>;
  delete(entities: PersonEntity[]): Promise<void>;
  deleteFaces(options: DeleteFacesOptions): Promise<void>;
  refreshFaces(
    facesToAdd: Insertable<AssetFaces>[],
    faceIdsToRemove: string[],
    embeddingsToAdd?: Insertable<FaceSearch>[],
  ): Promise<void>;
  getAllFaces(options?: Partial<AssetFaceEntity>): AsyncIterableIterator<AssetFaceEntity>;
  getFaceById(id: string): Promise<AssetFaceEntity>;
  getFaceByIdWithAssets(
    id: string,
    relations?: FindOptionsRelations<AssetFaceEntity>,
    select?: SelectFaceOptions,
  ): Promise<AssetFaceEntity | undefined>;
  getFaces(assetId: string): Promise<AssetFaceEntity[]>;
  getFacesByIds(ids: AssetFaceId[]): Promise<AssetFaceEntity[]>;
  getRandomFace(personId: string): Promise<AssetFaceEntity | undefined>;
  getStatistics(personId: string): Promise<PersonStatistics>;
  reassignFace(assetFaceId: string, newPersonId: string): Promise<number>;
  getNumberOfPeople(userId: string): Promise<PeopleStatistics>;
  reassignFaces(data: UpdateFacesData): Promise<number>;
  unassignFaces(options: UnassignFacesOptions): Promise<void>;
  update(person: Updateable<Person> & { id: string }): Promise<PersonEntity>;
  updateAll(people: Insertable<Person>[]): Promise<void>;
  getLatestFaceDate(): Promise<string | undefined>;
}

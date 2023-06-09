import { AssetFaceEntity, PersonEntity } from '@app/infra/entities';

export class PersonResponseDto {
  id!: string;
  name!: string;
  thumbnailPath!: string;
}

export function mapPerson(person: PersonEntity): PersonResponseDto {
  return {
    id: person.id,
    name: person.name,
    thumbnailPath: person.thumbnailPath,
  };
}

export function mapFace(face: AssetFaceEntity): PersonResponseDto {
  return mapPerson(face.person);
}

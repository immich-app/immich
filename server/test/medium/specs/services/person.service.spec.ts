import { Kysely } from 'kysely';
import { DB } from 'src/db';
import { PersonService } from 'src/services/person.service';
import { mediumFactory, newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

describe.concurrent(PersonService.name, () => {
  let defaultDatabase: Kysely<DB>;

  const createSut = (db?: Kysely<DB>) => {
    return newMediumService(PersonService, {
      database: db || defaultDatabase,
      repos: {
        access: 'real',
        database: 'real',
        person: 'real',
        storage: 'mock',
      },
    });
  };

  beforeEach(async () => {
    defaultDatabase = await getKyselyDB();
  });

  describe('delete', () => {
    it('should throw an error when there is no access', async () => {
      const { sut } = createSut();
      const auth = factory.auth();
      const personId = factory.uuid();
      await expect(sut.delete(auth, personId)).rejects.toThrow('Not found or no person.delete access');
    });

    it('should delete the person', async () => {
      const { sut, getRepository, mocks } = createSut();

      const user = mediumFactory.userInsert();
      const auth = factory.auth({ user });
      const person = mediumFactory.personInsert({ ownerId: auth.user.id });
      mocks.storage.unlink.mockResolvedValue();

      const userRepo = getRepository('user');
      await userRepo.create(user);

      const personRepo = getRepository('person');
      await personRepo.create(person);

      await expect(personRepo.getById(person.id)).resolves.toEqual(expect.objectContaining({ id: person.id }));
      await expect(sut.delete(auth, person.id)).resolves.toBeUndefined();
      await expect(personRepo.getById(person.id)).resolves.toBeUndefined();

      expect(mocks.storage.unlink).toHaveBeenCalledWith(person.thumbnailPath);
    });
  });

  describe('deleteAll', () => {
    it('should throw an error when there is no access', async () => {
      const { sut } = createSut();
      const auth = factory.auth();
      const personId = factory.uuid();
      await expect(sut.deleteAll(auth, { ids: [personId] })).rejects.toThrow('Not found or no person.delete access');
    });

    it('should delete the person', async () => {
      const { sut, getRepository, mocks } = createSut();

      const user = mediumFactory.userInsert();
      const auth = factory.auth({ user });
      const person1 = mediumFactory.personInsert({ ownerId: auth.user.id });
      const person2 = mediumFactory.personInsert({ ownerId: auth.user.id });
      mocks.storage.unlink.mockResolvedValue();

      const userRepo = getRepository('user');
      await userRepo.create(user);

      const personRepo = getRepository('person');
      await personRepo.create(person1);
      await personRepo.create(person2);

      await expect(sut.deleteAll(auth, { ids: [person1.id, person2.id] })).resolves.toBeUndefined();
      await expect(personRepo.getById(person1.id)).resolves.toBeUndefined();
      await expect(personRepo.getById(person2.id)).resolves.toBeUndefined();

      expect(mocks.storage.unlink).toHaveBeenCalledTimes(2);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(person1.thumbnailPath);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(person2.thumbnailPath);
    });
  });
});

import { Kysely } from "kysely";
import { JobStatus } from "src/enum";
import { AccessRepository } from "src/repositories/access.repository";
import { EventRepository } from "src/repositories/event.repository";
import { LoggingRepository } from "src/repositories/logging.repository";
import { StorageRepository } from "src/repositories/storage.repository";
import { TagRepository } from "src/repositories/tag.repository";
import { DB } from "src/schema";
import { TagService } from "src/services/tag.service";
import { newMediumService } from "test/medium.factory";
import { factory } from "test/small.factory";
import { getKyselyDB } from "test/utils";

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(TagService, {
    database: db || defaultDatabase,
    real: [TagRepository, AccessRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

// single tag exists, connected to one asset, and is not deleted
// hierarchical tag exists, and the parent is connected to an asset, and the child is deleted
// hierarchical tag exists, and only the child is connected to an asset, and nothing is deleted

describe(TagService.name, () => {
  describe('deleteEmptyTags', () => {
    it('single tag exists, not connected to any assets, and is deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { tag } = await ctx.newTag({ userId: user.id, value: 'tag-1' });
      const tagRepo = ctx.get(TagRepository);
      
      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toEqual(expect.objectContaining({ id: tag.id }));
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toBeUndefined();
    });

    it('single tag exists, connected to one asset, and is not deleted', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { tag } = await ctx.newTag({ userId: user.id, value: 'tag-1' });
      const tagRepo = ctx.get(TagRepository);
      
      await ctx.newTagAsset({ tagIds: [tag.id], assetIds: [asset.id] });
      
      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toEqual(expect.objectContaining({ id: tag.id }));
      await expect(sut.handleTagCleanup()).resolves.toBe(JobStatus.Success);
      await expect(tagRepo.getByValue(user.id, 'tag-1')).resolves.toEqual(expect.objectContaining({ id: tag.id }));
    })

  })
})
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AssetType, AssetVisibility } from 'src/enum';
import { TimelineService } from 'src/services/timeline.service';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(TimelineService.name, () => {
  let sut: TimelineService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(TimelineService));
  });

  describe('getTimeBuckets', () => {
    it("should return buckets if userId and albumId aren't set", async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

      await expect(sut.getTimeBuckets(authStub.admin, {})).resolves.toEqual(
        expect.arrayContaining([{ timeBucket: 'bucket', count: 1 }]),
      );
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith({
        userIds: [authStub.admin.user.id],
      });
    });

    it('should pass bbox options to repository when all bbox fields are provided', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

      await sut.getTimeBuckets(authStub.admin, {
        bbox: {
          west: -70,
          south: -30,
          east: 120,
          north: 55,
        },
      });

      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith({
        userIds: [authStub.admin.user.id],
        bbox: { west: -70, south: -30, east: 120, north: 55 },
      });
    });

    describe('shared space access (spaceId)', () => {
      it('should check shared space member access when spaceId is provided', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

        await sut.getTimeBuckets(authStub.admin, { spaceId: 'space-id' });

        expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(
          authStub.admin.user.id,
          new Set(['space-id']),
        );
      });

      it('should not set userIds when spaceId is provided', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

        await sut.getTimeBuckets(authStub.admin, { spaceId: 'space-id' });

        expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ spaceId: 'space-id' }));
        const calledWith = mocks.asset.getTimeBuckets.mock.calls[0][0];
        expect(calledWith.userIds).toBeUndefined();
      });

      it('should throw when user is not a space member', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set());

        await expect(sut.getTimeBuckets(authStub.admin, { spaceId: 'space-id' })).rejects.toThrow(BadRequestException);
      });

      it('should pass spaceId to asset repository', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

        await sut.getTimeBuckets(authStub.admin, { spaceId: 'space-id' });

        expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ spaceId: 'space-id' }));
      });

      it('should not check timeline read access when spaceId is provided', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

        await sut.getTimeBuckets(authStub.admin, { spaceId: 'space-id' });

        expect(mocks.access.timeline.checkPartnerAccess).not.toHaveBeenCalled();
      });

      it('should not set userId to auth user when spaceId is provided', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

        await sut.getTimeBuckets(authStub.user1, { spaceId: 'space-id' });

        const calledWith = mocks.asset.getTimeBuckets.mock.calls[0][0];
        expect(calledWith.userIds).toBeUndefined();
      });

      it('should return the time buckets when user is a space member', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        mocks.asset.getTimeBuckets.mockResolvedValue([
          { timeBucket: '2024-01-01', count: 5 },
          { timeBucket: '2024-02-01', count: 3 },
        ]);

        const result = await sut.getTimeBuckets(authStub.admin, { spaceId: 'space-id' });

        expect(result).toEqual([
          { timeBucket: '2024-01-01', count: 5 },
          { timeBucket: '2024-02-01', count: 3 },
        ]);
      });

      it('should work with non-admin users', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

        await expect(sut.getTimeBuckets(authStub.user1, { spaceId: 'space-id' })).resolves.toEqual([
          { timeBucket: 'bucket', count: 1 },
        ]);

        expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(
          authStub.user1.user.id,
          new Set(['space-id']),
        );
      });
    });

    describe('withSharedSpaces', () => {
      it('should resolve space IDs and pass them as timelineSpaceIds', async () => {
        mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([{ spaceId: 'space-1' }, { spaceId: 'space-2' }]);
        mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

        await sut.getTimeBuckets(authStub.admin, {
          withSharedSpaces: true,
          visibility: AssetVisibility.Timeline,
        });

        expect(mocks.sharedSpace.getSpaceIdsForTimeline).toHaveBeenCalledWith(authStub.admin.user.id);
        expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(
          expect.objectContaining({
            userIds: [authStub.admin.user.id],
            timelineSpaceIds: ['space-1', 'space-2'],
          }),
        );
      });

      it('should not pass timelineSpaceIds when user has no enabled spaces', async () => {
        mocks.sharedSpace.getSpaceIdsForTimeline.mockResolvedValue([]);
        mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

        await sut.getTimeBuckets(authStub.admin, {
          withSharedSpaces: true,
          visibility: AssetVisibility.Timeline,
        });

        const calledWith = mocks.asset.getTimeBuckets.mock.calls[0][0];
        expect(calledWith.timelineSpaceIds).toBeUndefined();
      });

      it('should throw when combined with archive visibility', async () => {
        await expect(
          sut.getTimeBuckets(authStub.admin, {
            withSharedSpaces: true,
            visibility: AssetVisibility.Archive,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw when combined with undefined visibility', async () => {
        await expect(
          sut.getTimeBuckets(authStub.admin, {
            withSharedSpaces: true,
            visibility: undefined,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw when combined with isFavorite', async () => {
        await expect(
          sut.getTimeBuckets(authStub.admin, {
            withSharedSpaces: true,
            isFavorite: true,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw when combined with isTrashed', async () => {
        await expect(
          sut.getTimeBuckets(authStub.admin, {
            withSharedSpaces: true,
            isTrashed: true,
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('getTimeBucket', () => {
    it('should return the assets for a album time bucket if user has album.read', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      const json = `[{ id: ['asset-id'] }]`;
      mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

      await expect(sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', albumId: 'album-id' })).resolves.toEqual(
        json,
      );

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-id']));
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        {
          timeBucket: 'bucket',
          albumId: 'album-id',
        },
        authStub.admin,
      );
    });

    it('should return the assets for a archive time bucket if user has archive.read', async () => {
      const json = `[{ id: ['asset-id'] }]`;
      mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          visibility: AssetVisibility.Archive,
          userId: authStub.admin.user.id,
        }),
      ).resolves.toEqual(json);
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        expect.objectContaining({
          timeBucket: 'bucket',
          visibility: AssetVisibility.Archive,
          userIds: [authStub.admin.user.id],
        }),
        authStub.admin,
      );
    });

    it('should include partner shared assets', async () => {
      const json = `[{ id: ['asset-id'] }]`;
      mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });
      mocks.partner.getAll.mockResolvedValue([]);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          visibility: AssetVisibility.Timeline,
          userId: authStub.admin.user.id,
          withPartners: true,
        }),
      ).resolves.toEqual(json);
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        {
          timeBucket: 'bucket',
          visibility: AssetVisibility.Timeline,
          withPartners: true,
          userIds: [authStub.admin.user.id],
        },
        authStub.admin,
      );
    });

    it('should check permissions to read tag', async () => {
      const json = `[{ id: ['asset-id'] }]`;
      mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-123']));

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          userId: authStub.admin.user.id,
          tagId: 'tag-123',
        }),
      ).resolves.toEqual(json);
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        {
          tagIds: ['tag-123'],
          timeBucket: 'bucket',
          userIds: [authStub.admin.user.id],
        },
        authStub.admin,
      );
    });

    it('should return the assets for a library time bucket if user has library.read', async () => {
      const json = `[{ id: ['asset-id'] }]`;
      mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          userId: authStub.admin.user.id,
        }),
      ).resolves.toEqual(json);
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        expect.objectContaining({
          timeBucket: 'bucket',
          userIds: [authStub.admin.user.id],
        }),
        authStub.admin,
      );
    });

    it('should throw an error if withParners is true and visibility true or undefined', async () => {
      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          visibility: AssetVisibility.Archive,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          visibility: undefined,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if withParners is true and isFavorite is either true or false', async () => {
      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          isFavorite: true,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          isFavorite: false,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if withParners is true and isTrash is true', async () => {
      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          isTrashed: true,
          withPartners: true,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when visibility is Locked and no elevated permission', async () => {
      await expect(
        sut.getTimeBucket(authStub.admin, {
          timeBucket: 'bucket',
          visibility: AssetVisibility.Locked,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for getTimeBuckets when visibility is Locked and no elevated permission', async () => {
      await expect(
        sut.getTimeBuckets(authStub.admin, {
          visibility: AssetVisibility.Locked,
          userId: authStub.admin.user.id,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    describe('shared space access (spaceId)', () => {
      it('should check shared space member access when spaceId is provided', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        const json = `[{ id: ['asset-id'] }]`;
        mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

        await sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', spaceId: 'space-id' });

        expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(
          authStub.admin.user.id,
          new Set(['space-id']),
        );
      });

      it('should not set userIds when spaceId is provided', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        const json = `[{ id: ['asset-id'] }]`;
        mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

        await sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', spaceId: 'space-id' });

        const calledWith = mocks.asset.getTimeBucket.mock.calls[0][1];
        expect(calledWith.userIds).toBeUndefined();
      });

      it('should throw when user is not a space member', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set());

        await expect(sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', spaceId: 'space-id' })).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should pass spaceId to asset repository', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        const json = `[{ id: ['asset-id'] }]`;
        mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

        await sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', spaceId: 'space-id' });

        expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
          'bucket',
          expect.objectContaining({ spaceId: 'space-id' }),
          authStub.admin,
        );
      });

      it('should not check timeline read access when spaceId is provided', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        const json = `[{ id: ['asset-id'] }]`;
        mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

        await sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', spaceId: 'space-id' });

        expect(mocks.access.timeline.checkPartnerAccess).not.toHaveBeenCalled();
      });

      it('should return the assets json when user is a space member', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        const json = `[{ id: ['asset-id'] }]`;
        mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

        const result = await sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', spaceId: 'space-id' });

        expect(result).toEqual(json);
      });

      it('should not set userId to auth user when spaceId is provided', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        const json = `[{ id: ['asset-id'] }]`;
        mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

        await sut.getTimeBucket(authStub.user1, { timeBucket: 'bucket', spaceId: 'space-id' });

        const calledWith = mocks.asset.getTimeBucket.mock.calls[0][1];
        expect(calledWith.userIds).toBeUndefined();
      });

      it('should work with non-admin users', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        const json = `[{ id: ['asset-id'] }]`;
        mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

        await expect(sut.getTimeBucket(authStub.user1, { timeBucket: 'bucket', spaceId: 'space-id' })).resolves.toEqual(
          json,
        );

        expect(mocks.access.sharedSpace.checkMemberAccess).toHaveBeenCalledWith(
          authStub.user1.user.id,
          new Set(['space-id']),
        );
      });

      it('should pass the correct timeBucket string to the repository', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        const json = `[{ id: ['asset-id'] }]`;
        mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

        await sut.getTimeBucket(authStub.admin, { timeBucket: '2024-01-01', spaceId: 'space-id' });

        expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
          '2024-01-01',
          expect.objectContaining({ spaceId: 'space-id', timeBucket: '2024-01-01' }),
          authStub.admin,
        );
      });

      it('should not check album access when spaceId is provided', async () => {
        mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
        const json = `[{ id: ['asset-id'] }]`;
        mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

        await sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', spaceId: 'space-id' });

        expect(mocks.access.album.checkOwnerAccess).not.toHaveBeenCalled();
        expect(mocks.access.album.checkSharedAlbumAccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('spacePersonId filtering', () => {
    it('should normalize spacePersonId to spacePersonIds for getTimeBuckets', async () => {
      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
      mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

      await sut.getTimeBuckets(authStub.admin, { spaceId: 'space-id', spacePersonId: 'person-id' });

      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(
        expect.objectContaining({ spaceId: 'space-id', spacePersonIds: ['person-id'] }),
      );
    });

    it('should normalize spacePersonId to spacePersonIds for getTimeBucket', async () => {
      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
      const json = `[{ id: ['asset-id'] }]`;
      mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

      await sut.getTimeBucket(authStub.admin, {
        timeBucket: 'bucket',
        spaceId: 'space-id',
        spacePersonId: 'person-id',
      });

      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        expect.objectContaining({ spaceId: 'space-id', spacePersonIds: ['person-id'] }),
        authStub.admin,
      );
    });
  });

  describe('multi-select filter passthrough', () => {
    it('should pass city filter to time bucket options', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, { city: 'Munich' });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ city: 'Munich' }));
    });

    it('should pass rating filter to time bucket options', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, { rating: 3 });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ rating: 3 }));
    });

    it('should accept deprecated personId and normalize to personIds', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, { personId: 'person-1' });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ personIds: ['person-1'] }));
    });

    it('should pass personIds array to time bucket options', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, { personIds: ['person-1', 'person-2'] });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(
        expect.objectContaining({ personIds: ['person-1', 'person-2'] }),
      );
    });

    it('should pass type as assetType to time bucket options', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, { type: AssetType.Image });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ assetType: AssetType.Image }));
    });

    it('should check tag access for each tagId in tagIds array', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1', 'tag-2']));
      await sut.getTimeBuckets(authStub.admin, { tagIds: ['tag-1', 'tag-2'] });
      expect(mocks.access.tag.checkOwnerAccess).toHaveBeenCalled();
    });

    it('should pass spacePersonIds array through to asset repository for getTimeBuckets', async () => {
      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, { spaceId: 'space-id', spacePersonIds: ['sp-1', 'sp-2'] });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(
        expect.objectContaining({ spacePersonIds: ['sp-1', 'sp-2'] }),
      );
    });

    it('should pass tagIds array through to asset repository for getTimeBuckets', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1', 'tag-2']));
      await sut.getTimeBuckets(authStub.admin, { tagIds: ['tag-1', 'tag-2'] });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ tagIds: ['tag-1', 'tag-2'] }));
    });

    it('should accept deprecated spacePersonId and normalize to spacePersonIds', async () => {
      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, { spaceId: 'space-id', spacePersonId: 'sp-1' });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ spacePersonIds: ['sp-1'] }));
    });

    it('should accept deprecated tagId and normalize to tagIds', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1']));
      await sut.getTimeBuckets(authStub.admin, { tagId: 'tag-1' });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ tagIds: ['tag-1'] }));
    });
  });

  describe('edge cases', () => {
    it('should not interfere when albumId is provided instead of spaceId', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

      await sut.getTimeBuckets(authStub.admin, { albumId: 'album-id' });

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-id']));
      expect(mocks.access.sharedSpace.checkMemberAccess).not.toHaveBeenCalled();
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(expect.objectContaining({ albumId: 'album-id' }));
    });

    it('should use default userId when neither albumId nor spaceId is provided', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

      await sut.getTimeBuckets(authStub.admin, {});

      expect(mocks.access.sharedSpace.checkMemberAccess).not.toHaveBeenCalled();
      expect(mocks.access.album.checkOwnerAccess).not.toHaveBeenCalled();
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith({
        userIds: [authStub.admin.user.id],
      });
    });

    it('should use default userId for getTimeBucket when neither albumId nor spaceId is provided', async () => {
      const json = `[{ id: ['asset-id'] }]`;
      mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

      await sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket' });

      expect(mocks.access.sharedSpace.checkMemberAccess).not.toHaveBeenCalled();
      expect(mocks.access.album.checkOwnerAccess).not.toHaveBeenCalled();
      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        'bucket',
        expect.objectContaining({
          userIds: [authStub.admin.user.id],
        }),
        authStub.admin,
      );
    });

    it('should not interfere when albumId is provided for getTimeBucket', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      const json = `[{ id: ['asset-id'] }]`;
      mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

      await sut.getTimeBucket(authStub.admin, { timeBucket: 'bucket', albumId: 'album-id' });

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-id']));
      expect(mocks.access.sharedSpace.checkMemberAccess).not.toHaveBeenCalled();
    });

    it('should not set userIds when albumId is provided for getTimeBuckets', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-id']));
      mocks.asset.getTimeBuckets.mockResolvedValue([{ timeBucket: 'bucket', count: 1 }]);

      await sut.getTimeBuckets(authStub.admin, { albumId: 'album-id' });

      const calledWith = mocks.asset.getTimeBuckets.mock.calls[0][0];
      expect(calledWith.userIds).toBeUndefined();
    });
  });

  describe('takenAfter / takenBefore date range filtering', () => {
    it('should pass takenAfter to time bucket options for getTimeBuckets', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, { takenAfter: '2023-01-01T00:00:00.000Z' });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(
        expect.objectContaining({ takenAfter: '2023-01-01T00:00:00.000Z' }),
      );
    });

    it('should pass takenBefore to time bucket options for getTimeBuckets', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, { takenBefore: '2023-12-31T23:59:59.999Z' });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(
        expect.objectContaining({ takenBefore: '2023-12-31T23:59:59.999Z' }),
      );
    });

    it('should pass both takenAfter and takenBefore for getTimeBuckets', async () => {
      mocks.asset.getTimeBuckets.mockResolvedValue([]);
      await sut.getTimeBuckets(authStub.admin, {
        takenAfter: '2023-08-01T00:00:00.000Z',
        takenBefore: '2023-08-31T23:59:59.999Z',
      });
      expect(mocks.asset.getTimeBuckets).toHaveBeenCalledWith(
        expect.objectContaining({
          takenAfter: '2023-08-01T00:00:00.000Z',
          takenBefore: '2023-08-31T23:59:59.999Z',
        }),
      );
    });

    it('should pass takenAfter and takenBefore through for getTimeBucket', async () => {
      mocks.access.sharedSpace.checkMemberAccess.mockResolvedValue(new Set(['space-id']));
      const json = `[{ id: ['asset-id'] }]`;
      mocks.asset.getTimeBucket.mockResolvedValue({ assets: json });

      await sut.getTimeBucket(authStub.admin, {
        timeBucket: '2023-08-01',
        spaceId: 'space-id',
        takenAfter: '2023-08-01T00:00:00.000Z',
        takenBefore: '2023-08-31T23:59:59.999Z',
      });

      expect(mocks.asset.getTimeBucket).toHaveBeenCalledWith(
        '2023-08-01',
        expect.objectContaining({
          takenAfter: '2023-08-01T00:00:00.000Z',
          takenBefore: '2023-08-31T23:59:59.999Z',
        }),
        authStub.admin,
      );
    });
  });
});

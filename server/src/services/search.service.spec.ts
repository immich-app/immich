import { mapAsset } from 'src/dtos/asset-response.dto';
import { SearchSuggestionType } from 'src/dtos/search.dto';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { SearchService } from 'src/services/search.service';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { personStub } from 'test/fixtures/person.stub';
import { newTestService } from 'test/utils';
import { Mocked, beforeEach, vitest } from 'vitest';

vitest.useFakeTimers();

describe(SearchService.name, () => {
  let sut: SearchService;

  let albumMock: Mocked<IAlbumRepository>;
  let assetMock: Mocked<IAssetRepository>;
  let personMock: Mocked<IPersonRepository>;
  let searchMock: Mocked<ISearchRepository>;

  beforeEach(() => {
    ({ sut, albumMock, assetMock, personMock, searchMock } = newTestService(SearchService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('searchPerson', () => {
    it('should pass options to search', async () => {
      personMock.getByName.mockResolvedValue({
        items: [personStub.withName],
        hasNextPage: false,
      });
      const { name } = personStub.withName;

      await sut.searchPerson(authStub.user1, {
        name,
        withHidden: false,
        page: 1,
        size: 500,
      });

      expect(personMock.getByName).toHaveBeenCalledWith(
        {
          skip: 0,
          take: 500,
          withCount: true,
        },
        authStub.user1.user.id,
        name,
        { withHidden: false },
      );

      await sut.searchPerson(authStub.user1, { name, withHidden: true, page: 1, size: 500 });

      expect(personMock.getByName).toHaveBeenCalledWith(
        {
          skip: 0,
          take: 500,
          withCount: true,
        },
        authStub.user1.user.id,
        name,
        { withHidden: true },
      );
    });
  });

  describe('searchAlbum', () => {
    it('should pass options to search', async () => {
      albumMock.getByName.mockResolvedValue({
        items: [albumStub.twoAssets],
        hasNextPage: false,
      });
      albumMock.getMetadataForIds.mockResolvedValue([
        { albumId: albumStub.twoAssets.id, assetCount: 2, startDate: undefined, endDate: undefined },
      ]);
      const { albumName } = albumStub.twoAssets;

      await sut.searchAlbum(authStub.user1, {
        name: albumName,
        shared: true,
        page: 1,
        size: 500,
      });

      expect(albumMock.getByName).toHaveBeenCalledWith(
        {
          skip: 0,
          take: 500,
          withCount: true,
        },
        authStub.user1.user.id,
        albumName,
        true,
      );

      await sut.searchAlbum(authStub.user1, {
        name: albumName,
        shared: false,
        page: 1,
        size: 500,
      });

      expect(albumMock.getByName).toHaveBeenCalledWith(
        {
          skip: 0,
          take: 500,
          withCount: true,
        },
        authStub.user1.user.id,
        albumName,
        false,
      );
    });
  });

  describe('getExploreData', () => {
    it('should get assets by city and tag', async () => {
      assetMock.getAssetIdByCity.mockResolvedValue({
        fieldName: 'exifInfo.city',
        items: [{ value: 'Paris', data: assetStub.image.id }],
      });
      assetMock.getAssetIdByTag.mockResolvedValue({
        fieldName: 'smartInfo.tags',
        items: [{ value: 'train', data: assetStub.imageFrom2015.id }],
      });
      assetMock.getByIdsWithAllRelations.mockResolvedValue([assetStub.image, assetStub.imageFrom2015]);
      const expectedResponse = [
        { fieldName: 'exifInfo.city', items: [{ value: 'Paris', data: mapAsset(assetStub.image) }] },
        { fieldName: 'smartInfo.tags', items: [{ value: 'train', data: mapAsset(assetStub.imageFrom2015) }] },
      ];

      const result = await sut.getExploreData(authStub.user1);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions (including null)', async () => {
      searchMock.getCountries.mockResolvedValue(['USA', null]);
      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: true, type: SearchSuggestionType.COUNTRY }),
      ).resolves.toEqual(['USA', null]);
      expect(searchMock.getCountries).toHaveBeenCalledWith([authStub.user1.user.id]);
    });

    it('should return search suggestions (without null)', async () => {
      searchMock.getCountries.mockResolvedValue(['USA', null]);
      await expect(
        sut.getSearchSuggestions(authStub.user1, { includeNull: false, type: SearchSuggestionType.COUNTRY }),
      ).resolves.toEqual(['USA']);
      expect(searchMock.getCountries).toHaveBeenCalledWith([authStub.user1.user.id]);
    });
  });
});

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/services/entity.service.dart';
import 'package:mocktail/mocktail.dart';
import '../fixtures/asset.stub.dart';
import '../fixtures/user.stub.dart';
import '../repository.mocks.dart';

void main() {
  late EntityService sut;
  late MockAssetRepository assetRepository;
  late MockUserRepository userRepository;

  setUp(() {
    assetRepository = MockAssetRepository();
    userRepository = MockUserRepository();
    sut = EntityService(assetRepository, userRepository);
  });

  group('fillAlbumWithDatabaseEntities', () {
    test('remote album with owner, thumbnail, sharedUsers and assets',
        () async {
      final Album album = Album(
        name: "album-with-two-assets-and-two-users",
        localId: "album-with-two-assets-and-two-users-local",
        remoteId: "album-with-two-assets-and-two-users-remote",
        createdAt: DateTime(2001),
        modifiedAt: DateTime(2010),
        shared: true,
        activityEnabled: true,
        startDate: DateTime(2019),
        endDate: DateTime(2020),
      )
        ..remoteThumbnailAssetId = AssetStub.image1.remoteId
        ..assets.addAll([AssetStub.image1, AssetStub.image1])
        ..owner.value = UserStub.user1
        ..sharedUsers.addAll([UserStub.admin, UserStub.admin]);

      when(() => userRepository.get(album.ownerId!))
          .thenAnswer((_) async => UserStub.admin);

      when(() => assetRepository.getByRemoteId(AssetStub.image1.remoteId!))
          .thenAnswer((_) async => AssetStub.image1);

      when(() => userRepository.getByIds(any()))
          .thenAnswer((_) async => [UserStub.user1, UserStub.user2]);

      when(() => assetRepository.getAllByRemoteId(any()))
          .thenAnswer((_) async => [AssetStub.image1, AssetStub.image2]);

      await sut.fillAlbumWithDatabaseEntities(album);
      expect(album.owner.value, UserStub.admin);
      expect(album.thumbnail.value, AssetStub.image1);
      expect(album.remoteUsers.toSet(), {UserStub.user1, UserStub.user2});
      expect(album.remoteAssets.toSet(), {AssetStub.image1, AssetStub.image2});
    });

    test('remote album without any info', () async {
      makeEmptyAlbum() => Album(
            name: "album-without-info",
            localId: "album-without-info-local",
            remoteId: "album-without-info-remote",
            createdAt: DateTime(2001),
            modifiedAt: DateTime(2010),
            shared: false,
            activityEnabled: false,
          );

      final album = makeEmptyAlbum();
      await sut.fillAlbumWithDatabaseEntities(album);
      verifyNoMoreInteractions(assetRepository);
      verifyNoMoreInteractions(userRepository);
      expect(album, makeEmptyAlbum());
    });
  });
}

import 'dart:typed_data';

import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:mocktail/mocktail.dart' as mock;
import 'package:mocktail/mocktail.dart';

import '../domain/service.mock.dart';
import '../infrastructure/repository.mock.dart';
import 'factories/local_album_factory.dart';
import 'factories/local_asset_factory.dart';
import 'factories/user_factory.dart';

class RepositoryMocks {
  final localAlbum = MockLocalAlbumRepository();
  final localAsset = MockDriftLocalAssetRepository();
  final trashedAsset = MockTrashedLocalAssetRepository();

  final nativeApi = MockNativeSyncApi();

  RepositoryMocks() {
    resetAll();
  }

  void resetAll() {
    _registerFallbacks();
    reset(localAlbum);
    reset(localAsset);
    reset(trashedAsset);
    reset(nativeApi);
  }
}

class ServiceMocks {
  final PartnerStub partner = PartnerStub(MockPartnerService());
  final UserStub user = UserStub(MockUserService());
  final asset = AssetStub(MockAssetService());

  ServiceMocks() {
    resetAll();
  }

  void resetAll() {
    _registerFallbacks();
    partner.reset();
    user.reset();
    asset.reset();
    _stubUserService();
    _stubPartnerService();
    _stubAssetService();
  }

  void _stubUserService() {
    when(user.getMyUser).thenReturn(UserFactory.createDto());
    when(user.tryGetMyUser).thenReturn(null);
    when(user.watchMyUser).thenAnswer((_) => const Stream.empty());
    when(user.refreshMyUser).thenAnswer((_) async => null);
    when(user.createProfileImage).thenAnswer((_) async => null);
  }

  void _stubPartnerService() {
    registerFallbackValue(PartnerDirection.sharedBy);
    when(partner.getCandidates).thenAnswer((_) => const Stream.empty());
    when(partner.search).thenAnswer((_) => const Stream.empty());
    when(partner.update).thenAnswer((_) async {});
    when(partner.create).thenAnswer((_) async {});
    when(partner.delete).thenAnswer((_) async {});
  }

  void _stubAssetService() {
    when(asset.updateFavorite).thenAnswer((_) async {});
  }
}

void _registerFallbacks() {
  registerFallbackValue(LocalAlbumFactory.create());
  registerFallbackValue(LocalAssetFactory.create());
  registerFallbackValue(Uint8List(0));
}

extension type const Stub<T extends Mock>(T mockedService) {
  void reset() => mock.reset(mockedService);
}

extension type const PartnerStub(MockPartnerService service) implements Stub<MockPartnerService> {
  Stream<Iterable<User>> Function() get getCandidates =>
      () => service.getCandidates(any());

  Stream<Iterable<Partner>> Function() get search =>
      () => service.search(any(), any());

  Future<void> Function() get create =>
      () => service.create(
        sharedById: any(named: 'sharedById'),
        sharedWithId: any(named: 'sharedWithId'),
        inTimeline: any(named: 'inTimeline'),
      );

  Future<void> Function() get update =>
      () => service.update(
        sharedById: any(named: 'sharedById'),
        sharedWithId: any(named: 'sharedWithId'),
        inTimeline: any(named: 'inTimeline'),
      );

  Future<void> Function() get delete =>
      () => service.delete(
        sharedById: any(named: 'sharedById'),
        sharedWithId: any(named: 'sharedWithId'),
      );
}

extension type const UserStub(MockUserService service) implements Stub<MockUserService> {
  UserDto Function() get getMyUser =>
      () => service.getMyUser();

  UserDto? Function() get tryGetMyUser =>
      () => service.tryGetMyUser();

  Stream<UserDto?> Function() get watchMyUser =>
      () => service.watchMyUser();

  Future<UserDto?> Function() get refreshMyUser =>
      () => service.refreshMyUser();

  Future<String?> Function() get createProfileImage =>
      () => service.createProfileImage(any(), any());
}

extension type const AssetStub(MockAssetService service) implements Stub<MockAssetService> {
  Future<void> Function() get updateFavorite =>
      () => service.updateFavorite(any(), any());
}

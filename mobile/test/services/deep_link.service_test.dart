import 'package:auto_route/auto_route.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/asset.service.dart' as beta_asset_service;
import 'package:immich_mobile/domain/services/memory.service.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/services/deep_link.service.dart';
import 'package:immich_mobile/services/memory.service.dart';
import 'package:mocktail/mocktail.dart';

import '../utils/action_button_utils_test.dart';

class MockMemoryService extends Mock implements MemoryService {}

class MockAssetService extends Mock implements AssetService {}

class MockAlbumService extends Mock implements AlbumService {}

class MockCurrentAsset extends Mock implements CurrentAsset {}

class MockCurrentAlbum extends Mock implements CurrentAlbum {}

class MockTimelineFactory extends Mock implements TimelineFactory {}

class MockBetaAssetService extends Mock implements beta_asset_service.AssetService {}

class MockRemoteAlbumService extends Mock implements RemoteAlbumService {}

class MockDriftMemoryService extends Mock implements DriftMemoryService {}

class MockPlatformDeepLink extends Mock implements PlatformDeepLink {
  final Uri _uri;

  MockPlatformDeepLink(this._uri);

  @override
  Uri get uri => _uri;
}

class MockWidgetRef extends Mock implements WidgetRef {}

void main() {
  late DeepLinkService sut;
  late MockMemoryService mockMemoryService;
  late MockAssetService mockAssetService;
  late MockAlbumService mockAlbumService;
  late MockCurrentAsset mockCurrentAsset;
  late MockCurrentAlbum mockCurrentAlbum;
  late MockTimelineFactory mockTimelineFactory;
  late MockBetaAssetService mockBetaAssetService;
  late MockRemoteAlbumService mockRemoteAlbumService;
  late MockDriftMemoryService mockDriftMemoryService;
  late ProviderContainer container;

  setUp(() {
    mockMemoryService = MockMemoryService();
    mockAssetService = MockAssetService();
    mockAlbumService = MockAlbumService();
    mockCurrentAsset = MockCurrentAsset();
    mockCurrentAlbum = MockCurrentAlbum();
    mockTimelineFactory = MockTimelineFactory();
    mockBetaAssetService = MockBetaAssetService();
    mockRemoteAlbumService = MockRemoteAlbumService();
    mockDriftMemoryService = MockDriftMemoryService();

    sut = DeepLinkService(
      mockMemoryService,
      mockAssetService,
      mockAlbumService,
      mockCurrentAsset,
      mockCurrentAlbum,
      mockTimelineFactory,
      mockBetaAssetService,
      mockRemoteAlbumService,
      mockDriftMemoryService,
    );

    container = ProviderContainer();
  });

  tearDown(() {
    container.dispose();
  });

  group('handleScheme - activity', () {
    test('should return DeepLink with DriftActivitiesRoute when album exists and isActivityEnabled is true', () async {
      final albumId = 'test-album-id';
      final album = createRemoteAlbum(id: albumId, name: 'Test Album', isActivityEnabled: true);
      final link = MockPlatformDeepLink(Uri.parse('immich://activity?albumId=$albumId'));
      final ref = MockWidgetRef();

      when(() => mockRemoteAlbumService.get(albumId)).thenAnswer((_) async => album);

      final result = await sut.handleScheme(link, ref, false);

      expect(result, isNotNull);
      expect(result, isA<DeepLink>());
      // DeepLink is a list-like structure, we can check it's not none or defaultPath
      expect(result, isNot(equals(DeepLink.none)));
      expect(result, isNot(equals(DeepLink.defaultPath)));
      verify(() => mockRemoteAlbumService.get(albumId)).called(1);
    });

    test('should return DeepLink.none when album does not exist', () async {
      final albumId = 'non-existent-album-id';
      final link = MockPlatformDeepLink(Uri.parse('immich://activity?albumId=$albumId'));
      final ref = MockWidgetRef();

      when(() => mockRemoteAlbumService.get(albumId)).thenAnswer((_) async => null);

      final result = await sut.handleScheme(link, ref, false);

      expect(result, equals(DeepLink.none));
      verify(() => mockRemoteAlbumService.get(albumId)).called(1);
    });

    test('should return DeepLink.none when album exists but isActivityEnabled is false', () async {
      final albumId = 'test-album-id';
      final album = createRemoteAlbum(id: albumId, name: 'Test Album', isActivityEnabled: false);
      final link = MockPlatformDeepLink(Uri.parse('immich://activity?albumId=$albumId'));
      final ref = MockWidgetRef();

      when(() => mockRemoteAlbumService.get(albumId)).thenAnswer((_) async => album);

      final result = await sut.handleScheme(link, ref, false);

      expect(result, equals(DeepLink.none));
      verify(() => mockRemoteAlbumService.get(albumId)).called(1);
    });

    test('should return DeepLink.defaultPath when album does not exist and isColdStart is true', () async {
      final albumId = 'non-existent-album-id';
      final link = MockPlatformDeepLink(Uri.parse('immich://activity?albumId=$albumId'));
      final ref = MockWidgetRef();

      when(() => mockRemoteAlbumService.get(albumId)).thenAnswer((_) async => null);

      final result = await sut.handleScheme(link, ref, true);

      expect(result, equals(DeepLink.defaultPath));
      verify(() => mockRemoteAlbumService.get(albumId)).called(1);
    });

    test(
      'should return DeepLink.defaultPath when album exists but isActivityEnabled is false and isColdStart is true',
      () async {
        final albumId = 'test-album-id';
        final album = createRemoteAlbum(id: albumId, name: 'Test Album', isActivityEnabled: false);
        final link = MockPlatformDeepLink(Uri.parse('immich://activity?albumId=$albumId'));
        final ref = MockWidgetRef();

        when(() => mockRemoteAlbumService.get(albumId)).thenAnswer((_) async => album);

        final result = await sut.handleScheme(link, ref, true);

        expect(result, equals(DeepLink.defaultPath));
        verify(() => mockRemoteAlbumService.get(albumId)).called(1);
      },
    );
  });
}

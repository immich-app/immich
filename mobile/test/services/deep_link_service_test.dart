import 'package:auto_route/auto_route.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/memory.service.dart';
import 'package:immich_mobile/domain/services/people.service.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/deep_link.service.dart';
import 'package:mocktail/mocktail.dart';

class MockTimelineFactory extends Mock implements TimelineFactory {}

class MockAssetService extends Mock implements AssetService {}

class MockRemoteAlbumService extends Mock implements RemoteAlbumService {}

class MockDriftMemoryService extends Mock implements DriftMemoryService {}

class MockDriftPeopleService extends Mock implements DriftPeopleService {}

class MockPlatformDeepLink extends Mock implements PlatformDeepLink {}

class MockWidgetRef extends Mock implements WidgetRef {}

class MockAssetViewerStateNotifier extends Mock implements AssetViewerStateNotifier {}

const _assetId = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
const _albumId = 'cccccccc-4444-5555-6666-dddddddddddd';

final _asset = RemoteAsset(
  id: _assetId,
  name: 'photo.jpg',
  ownerId: 'user-1',
  checksum: 'checksum-1',
  type: AssetType.image,
  createdAt: DateTime(2026, 6, 12),
  updatedAt: DateTime(2026, 6, 12),
  isEdited: false,
);

final _album = RemoteAlbum(
  id: _albumId,
  name: 'Shared Album',
  ownerId: 'user-1',
  description: '',
  createdAt: DateTime(2026, 6, 12),
  updatedAt: DateTime(2026, 6, 12),
  isActivityEnabled: true,
  isShared: true,
  order: AlbumAssetOrder.asc,
  assetCount: 1,
  ownerName: 'Owner',
);

void main() {
  late MockTimelineFactory timelineFactory;
  late MockAssetService assetService;
  late MockRemoteAlbumService remoteAlbumService;
  late MockWidgetRef ref;
  late List<TimelineService> createdTimelineServices;
  late DeepLinkService sut;

  setUp(() {
    timelineFactory = MockTimelineFactory();
    assetService = MockAssetService();
    remoteAlbumService = MockRemoteAlbumService();
    ref = MockWidgetRef();
    createdTimelineServices = [];

    when(() => timelineFactory.fromAssets(any(), TimelineOrigin.deepLink)).thenAnswer((invocation) {
      final assets = List<BaseAsset>.from(invocation.positionalArguments[0] as List<BaseAsset>);
      final timelineService = TimelineService((
        assetSource: (index, count) async => assets.skip(index).take(count).toList(),
        bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
        origin: TimelineOrigin.deepLink,
      ));
      createdTimelineServices.add(timelineService);
      return timelineService;
    });

    when(() => ref.read(assetViewerProvider.notifier)).thenReturn(MockAssetViewerStateNotifier());

    sut = DeepLinkService(
      timelineFactory,
      assetService,
      remoteAlbumService,
      MockDriftMemoryService(),
      MockDriftPeopleService(),
      null,
    );

    addTearDown(() async {
      for (final timelineService in createdTimelineServices) {
        await timelineService.dispose();
      }
    });
  });

  PlatformDeepLink link(String path) {
    final deepLink = MockPlatformDeepLink();
    when(() => deepLink.uri).thenReturn(Uri.parse('https://my.immich.app$path'));
    return deepLink;
  }

  test('album photo link carries the album into the viewer route', () async {
    when(() => assetService.getRemoteAsset(_assetId)).thenAnswer((_) async => _asset);
    when(() => remoteAlbumService.get(_albumId)).thenAnswer((_) async => _album);

    final route = await sut.handleMyImmichApp(link('/albums/$_albumId/photos/$_assetId'), ref);

    expect(route, isA<AssetViewerRoute>());
    expect((route!.args as AssetViewerRouteArgs).currentAlbum, _album);
  });

  test('still opens the viewer when the album cannot be resolved', () async {
    when(() => assetService.getRemoteAsset(_assetId)).thenAnswer((_) async => _asset);
    when(() => remoteAlbumService.get(_albumId)).thenAnswer((_) async => null);

    final route = await sut.handleMyImmichApp(link('/albums/$_albumId/photos/$_assetId'), ref);

    expect(route, isA<AssetViewerRoute>());
    expect((route!.args as AssetViewerRouteArgs).currentAlbum, isNull);
  });

  test('plain photo link has no album', () async {
    when(() => assetService.getRemoteAsset(_assetId)).thenAnswer((_) async => _asset);

    final route = await sut.handleMyImmichApp(link('/photos/$_assetId'), ref);

    expect(route, isA<AssetViewerRoute>());
    expect((route!.args as AssetViewerRouteArgs).currentAlbum, isNull);
    verifyNever(() => remoteAlbumService.get(any()));
  });
}

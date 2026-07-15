import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/platform/remote_image_api.g.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail_tile.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

import '../../../test_utils.dart';

class _TimelineService implements TimelineService {
  final BaseAsset asset;

  const _TimelineService(this.asset);

  @override
  bool hasRange(int index, int count) => true;

  @override
  List<BaseAsset> getAssets(int index, int count) => [asset];

  @override
  TimelineOrigin get origin => TimelineOrigin.main;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _ReadOnlyModeNotifier extends ReadOnlyModeNotifier {
  @override
  bool build() => false;
}

void main() {
  late Drift db;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
    await StoreService.I.put(StoreKey.serverEndpoint, 'https://example.test');
  });

  tearDownAll(() async {
    await StoreService.I.dispose();
    await db.close();
  });

  test('uses the physical tile size', () {
    expect(getThumbnailResolution(const Size.square(214), 3), const Size.square(642));
    expect(getThumbnailResolution(const Size.square(186.5), 3), const Size.square(560));
    expect(getThumbnailResolution(const Size(321, 214), 3), const Size(963, 642));
  });

  test('does not cap large physical tiles', () {
    expect(getThumbnailResolution(const Size(500, 250), 3), const Size(1500, 750));
  });

  test('marks invalid tile sizes as not ready', () {
    expect(getThumbnailResolution(Size.zero, 3), Size.zero);
    expect(getThumbnailResolution(const Size(double.infinity, 100), 3), Size.zero);
  });

  test('changes only timeline remote thumbnail size', () {
    final remote = TestUtils.createRemoteAsset(id: 'remote');
    final local = TestUtils.createLocalAsset(id: 'local');
    final grid = Thumbnail.fromAsset(asset: remote, remoteSize: const Size.square(642));
    final other = Thumbnail.fromAsset(asset: remote);
    final localGrid = Thumbnail.fromAsset(asset: local, remoteSize: const Size.square(642));
    final viewer = getFullImageProvider(remote, remoteThumbnailSize: const Size.square(642));

    expect((grid.imageProvider! as RemoteImageProvider).size, const Size.square(642));
    expect((other.imageProvider! as RemoteImageProvider).size, Size.zero);
    expect((localGrid.imageProvider! as LocalThumbProvider).size, kThumbnailResolution);
    expect((viewer as RemoteFullImageProvider).thumbnailSize, const Size.square(642));
  });

  testWidgets('keeps the tile while its remote decode size is unavailable', (tester) async {
    const channel = BasicMessageChannel<Object?>(
      'dev.flutter.pigeon.immich_mobile.RemoteImageApi.requestImage',
      RemoteImageApi.pigeonChannelCodec,
    );
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler(
      channel,
      (_) async => <Object?>[null],
    );
    addTearDown(
      () =>
          TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler(channel, null),
    );
    final asset = TestUtils.createRemoteAsset(id: 'remote');
    final service = _TimelineService(asset);
    const segment = FixedSegment(
      firstIndex: 0,
      lastIndex: 1,
      startOffset: 0,
      endOffset: 100,
      firstAssetIndex: 0,
      bucket: Bucket(assetCount: 1),
      tileHeight: 100,
      columnCount: 4,
      headerExtent: 0,
      spacing: 0,
      header: HeaderType.none,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          timelineServiceProvider.overrideWithValue(service),
          timelineArgsProvider.overrideWithValue(const TimelineArgs(maxWidth: 100, maxHeight: 100)),
          appConfigProvider.overrideWithValue(const AppConfig()),
          readonlyModeProvider.overrideWith(_ReadOnlyModeNotifier.new),
        ],
        child: MaterialApp(
          home: Align(
            alignment: Alignment.topLeft,
            child: SizedBox.square(
              dimension: 100,
              child: MediaQuery(
                data: const MediaQueryData(devicePixelRatio: 0),
                child: Builder(builder: (context) => segment.builder(context, 1)),
              ),
            ),
          ),
        ),
      ),
    );

    expect(find.byType(ThumbnailTile), findsOneWidget);
    expect(tester.widget<ThumbnailTile>(find.byType(ThumbnailTile)).remoteSize, null);
  });
}

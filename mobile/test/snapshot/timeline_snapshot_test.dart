import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

import '../unit/presentation/presentation_context.dart';
import 'snapshot.dart';
import 'util/fake_thumbnails.dart';

final _assets = <BaseAsset>[
  for (var i = 0; i < 14; i++) _asset(id: 'jun-15-$i', createdAt: DateTime(2019, 6, 15, 12)),
  for (var i = 0; i < 9; i++) _asset(id: 'jun-14-$i', createdAt: DateTime(2019, 6, 14, 9)),
  _asset(id: 'jun-02-single', createdAt: DateTime(2019, 6, 2, 18)),
];

final _buckets = [
  TimeBucket(date: DateTime(2019, 6, 15), assetCount: 14),
  TimeBucket(date: DateTime(2019, 6, 14), assetCount: 9),
  TimeBucket(date: DateTime(2019, 6, 2), assetCount: 1),
];

RemoteAsset _asset({required String id, required DateTime createdAt}) => RemoteAsset(
  id: id,
  name: '$id.jpg',
  ownerId: 'owner',
  checksum: id,
  type: AssetType.image,
  createdAt: createdAt,
  updatedAt: createdAt,
  width: 4032,
  height: 3024,
  thumbHash: 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw==',
  isEdited: false,
);

void main() {
  late PresentationContext context;

  setUp(() async => context = await PresentationContext.create());
  tearDown(() => context.dispose());

  pageSnapshotTest(
    'timeline.loading.thumbnails',
    _timeline,
    overrides: () => _overrides(context),
    beforeCapture: (tester) async {
      // Segments and assets each need a frame
      await tester.pump();
      await tester.pump();
    },
  );

  pageSnapshotTest(
    'timeline.populated.thumbnails',
    _timeline,
    overrides: () => _overrides(context, fakeThumbnails: true),
    beforeCapture: (tester) async {
      // Segments and assets each need a frame
      await tester.pump();
      await tester.pump();
    },
  );
}

List<Override> _overrides(PresentationContext context, {bool fakeThumbnails = false}) {
  if (fakeThumbnails) {
    useFakeThumbnails();
  } else {
    useUnresolvedThumbnails();
  }

  final service = TimelineService((
    assetSource: (i, n) async => _assets.sublist(i, math.min(i + n, _assets.length)),
    bucketSource: () => Stream.value(_buckets),
    origin: TimelineOrigin.main,
  ));

  addTearDown(service.dispose);

  return [
    ...context.overrides,
    timelineServiceProvider.overrideWithValue(service),
    appConfigProvider.overrideWithValue(const AppConfig()),
  ];
}

Widget _timeline() =>
    const Timeline(withScrubber: true, readOnly: true, groupBy: GroupAssetsBy.day, loadingWidget: SizedBox.shrink());

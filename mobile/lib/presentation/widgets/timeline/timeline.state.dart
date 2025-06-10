import 'dart:async';
import 'dart:math' as math;

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/segment_builder.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/header.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/utils/async_mutex.dart';

typedef TimelineAssetProvider = Future<List<BaseAsset>> Function(
  int index,
  int count,
);

class TimelineStateArgs {
  final bool showHeader;
  final BoxConstraints constraints;
  final double spacing;
  final int columnCount;
  final TimelineAssetProvider assetProvider;

  const TimelineStateArgs({
    required this.constraints,
    this.showHeader = true,
    this.spacing = kTimelineSpacing,
    this.columnCount = kTimelineColumnCount,
    required this.assetProvider,
  });

  @override
  bool operator ==(covariant TimelineStateArgs other) {
    return showHeader == other.showHeader &&
        spacing == other.spacing &&
        constraints == other.constraints &&
        columnCount == other.columnCount &&
        assetProvider == other.assetProvider;
  }

  @override
  int get hashCode =>
      showHeader.hashCode ^
      constraints.hashCode ^
      spacing.hashCode ^
      columnCount.hashCode ^
      assetProvider.hashCode;
}

class TimelineState {
  final bool isScrubbing;
  final AsyncValue<List<Segment>> segments;

  const TimelineState({this.isScrubbing = false, required this.segments});

  @override
  bool operator ==(covariant TimelineState other) {
    return segments.valueOrNull?.lastOrNull?.endOffset ==
            other.segments.valueOrNull?.lastOrNull?.endOffset &&
        isScrubbing == other.isScrubbing;
  }

  @override
  int get hashCode => segments.valueOrNull.hashCode ^ isScrubbing.hashCode;

  TimelineState copyWith({bool? isScrubbing}) {
    return TimelineState(
      isScrubbing: isScrubbing ?? this.isScrubbing,
      // Segments are immutable, so we can just use the same instance.
      segments: segments,
    );
  }
}

class TimelineStateNotifier extends Notifier<TimelineState> {
  TimelineStateNotifier();

  late TimelineAssetProvider _assetProvider;
  int _bufferOffset = 0;
  List<BaseAsset> _buffer = [];
  final AsyncMutex _mutex = AsyncMutex();

  Future<List<BaseAsset>> loadAssets(int index, int count) =>
      _mutex.run(() => _loadAssets(index, count));

  Future<List<BaseAsset>> _loadAssets(int index, int count) async {
    if (hasRange(index, count)) {
      return getAssets(index, count);
    }

    // if the requested offset is greater than the cached offset, the user scrolls forward "down"
    final bool forward = _bufferOffset < index;

    // make sure to load a meaningful amount of data (and not only the requested slice)
    // otherwise, each call to [loadAssets] would result in DB call trashing performance
    // fills small requests to [kTimelineAssetLoadBatchSize], adds some legroom into the opposite scroll direction for large requests
    final len = math.max(
      kTimelineAssetLoadBatchSize,
      count + kTimelineAssetLoadOppositeSize,
    );
    // when scrolling forward, start shortly before the requested offset
    // when scrolling backward, end shortly after the requested offset to guard against the user scrolling
    // in the other direction a tiny bit resulting in another required load from the DB
    final start = math.max(
      0,
      forward
          ? index - kTimelineAssetLoadOppositeSize
          : (len > kTimelineAssetLoadBatchSize ? index : index + count - len),
    );

    final assets = await _assetProvider(start, len);
    _buffer = assets;
    _bufferOffset = start;

    return getAssets(index, count);
  }

  bool hasRange(int index, int count) =>
      index >= _bufferOffset && index + count <= _bufferOffset + _buffer.length;

  List<BaseAsset> getAssets(int index, int count) {
    if (index < _bufferOffset ||
        index + count > _bufferOffset + _buffer.length) {
      throw RangeError('TimelineStateNotifier::getRange Index out of range');
    }
    int start = index - _bufferOffset;
    return _buffer.slice(start, start + count);
  }

  void setScrubbing(bool isScrubbing) {
    state = state.copyWith(isScrubbing: isScrubbing);
  }

  @override
  TimelineState build() {
    // TODO: Optimize this to not be called every time
    final buckets = ref.watch(timelineBucketProvider);
    final args = ref.watch(timelineArgsProvider);
    _assetProvider = args.assetProvider;
    final columnCount = args.columnCount;
    final spacing = args.spacing;
    final availableTileWidth =
        args.constraints.maxWidth - (spacing * (columnCount - 1));
    final tileExtent = math.max(0, availableTileWidth) / columnCount;

    return TimelineState(
      isScrubbing: false,
      segments: buckets.whenData(
        (value) => FixedSegmentBuilder(
          buckets: value,
          tileHeight: tileExtent,
          columnCount: columnCount,
          spacing: spacing,
          headerExtent: args.showHeader ? 80 : 0,
          headerBuilder: (_, bucket, height) =>
              TimelineHeader(bucket: bucket, height: height),
          tileBuilder: (asset, size) => ImThumbnail(asset: asset, size: size),
        ).build(),
      ),
    );
  }
}

final timelineArgsProvider = Provider.autoDispose<TimelineStateArgs>(
  (ref) =>
      throw UnimplementedError('Will be overridden through a ProviderScope.'),
);

final timelineBucketProvider = StreamProvider<List<Bucket>>(
  (ref) =>
      throw UnimplementedError('Will be overridden through a ProviderScope.'),
);

final timelineStateProvider =
    NotifierProvider<TimelineStateNotifier, TimelineState>(
  TimelineStateNotifier.new,
  dependencies: [timelineBucketProvider, timelineArgsProvider],
);

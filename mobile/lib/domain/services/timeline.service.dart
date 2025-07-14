import 'dart:async';
import 'dart:math' as math;

import 'package:collection/collection.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/utils/async_mutex.dart';

typedef TimelineAssetSource = Future<List<BaseAsset>> Function(
  int index,
  int count,
);

typedef TimelineBucketSource = Stream<List<Bucket>> Function();

typedef TimelineQuery = ({
  TimelineAssetSource assetSource,
  TimelineBucketSource bucketSource,
});

class TimelineFactory {
  final DriftTimelineRepository _timelineRepository;
  final SettingsService _settingsService;

  const TimelineFactory({
    required DriftTimelineRepository timelineRepository,
    required SettingsService settingsService,
  })  : _timelineRepository = timelineRepository,
        _settingsService = settingsService;

  GroupAssetsBy get groupBy =>
      GroupAssetsBy.values[_settingsService.get(Setting.groupAssetsBy)];

  TimelineService main(List<String> timelineUsers) =>
      TimelineService(_timelineRepository.main(timelineUsers, groupBy));

  TimelineService localAlbum({required String albumId}) =>
      TimelineService(_timelineRepository.localAlbum(albumId, groupBy));

  TimelineService remoteAlbum({required String albumId}) =>
      TimelineService(_timelineRepository.remoteAlbum(albumId, groupBy));

  TimelineService remoteAssets(String userId) =>
      TimelineService(_timelineRepository.remote(userId, groupBy));

  TimelineService favorite(String userId) =>
      TimelineService(_timelineRepository.favorite(userId, groupBy));

  TimelineService trash(String userId) =>
      TimelineService(_timelineRepository.trash(userId, groupBy));

  TimelineService archive(String userId) =>
      TimelineService(_timelineRepository.archived(userId, groupBy));

  TimelineService lockedFolder(String userId) =>
      TimelineService(_timelineRepository.locked(userId, groupBy));

  TimelineService video(String userId) =>
      TimelineService(_timelineRepository.video(userId, groupBy));
}

class TimelineService {
  final TimelineAssetSource _assetSource;
  final TimelineBucketSource _bucketSource;
  final AsyncMutex _mutex = AsyncMutex();
  int _bufferOffset = 0;
  List<BaseAsset> _buffer = [];
  StreamSubscription? _bucketSubscription;

  int _totalAssets = 0;
  int get totalAssets => _totalAssets;

  TimelineService(TimelineQuery query)
      : this._(
          assetSource: query.assetSource,
          bucketSource: query.bucketSource,
        );

  TimelineService._({
    required TimelineAssetSource assetSource,
    required TimelineBucketSource bucketSource,
  })  : _assetSource = assetSource,
        _bucketSource = bucketSource {
    _bucketSubscription = _bucketSource().listen((buckets) {
      _mutex.run(() async {
        final totalAssets =
            buckets.fold<int>(0, (acc, bucket) => acc + bucket.assetCount);

        if (totalAssets == 0) {
          _bufferOffset = 0;
          _buffer.clear();
        } else {
          final int offset;
          final int count;
          // When the buffer is empty or the old bufferOffset is greater than the new total assets,
          // we need to reset the buffer and load the first batch of assets.
          if (_bufferOffset >= totalAssets || _buffer.isEmpty) {
            offset = 0;
            count = kTimelineAssetLoadBatchSize;
          } else {
            offset = _bufferOffset;
            count = math.min(
              _buffer.length,
              totalAssets - _bufferOffset,
            );
          }
          _buffer = await _assetSource(offset, count);
          _bufferOffset = offset;
        }

        // change the state's total assets count only after the buffer is reloaded
        _totalAssets = totalAssets;
        EventStream.shared.emit(const TimelineReloadEvent());
      });
    });
  }

  Stream<List<Bucket>> Function() get watchBuckets => _bucketSource;

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

    _buffer = await _assetSource(start, len);
    _bufferOffset = start;

    return getAssets(index, count);
  }

  bool hasRange(int index, int count) =>
      index >= 0 &&
      index < _totalAssets &&
      index >= _bufferOffset &&
      index + count <= _bufferOffset + _buffer.length &&
      index + count <= _totalAssets;

  List<BaseAsset> getAssets(int index, int count) {
    if (!hasRange(index, count)) {
      throw RangeError('TimelineService::getAssets Index out of range');
    }
    int start = index - _bufferOffset;
    return _buffer.slice(start, start + count);
  }

  // Pre-cache assets around the given index for asset viewer
  Future<void> preCacheAssets(int index) =>
      _mutex.run(() => _loadAssets(index, math.min(5, _totalAssets - index)));

  BaseAsset getRandomAsset() =>
      _buffer.elementAt(math.Random().nextInt(_buffer.length));

  BaseAsset getAsset(int index) {
    if (!hasRange(index, 1)) {
      throw RangeError(
        'TimelineService::getAsset Index $index not in buffer range [$_bufferOffset, ${_bufferOffset + _buffer.length})',
      );
    }
    return _buffer.elementAt(index - _bufferOffset);
  }

  Future<void> dispose() async {
    await _bucketSubscription?.cancel();
    _bucketSubscription = null;
    _buffer.clear();
    _bufferOffset = 0;
  }
}

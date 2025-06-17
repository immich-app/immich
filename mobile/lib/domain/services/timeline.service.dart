import 'dart:async';
import 'dart:math' as math;

import 'package:collection/collection.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/timeline.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/utils/async_mutex.dart';

typedef TimelineAssetSource = Future<List<BaseAsset>> Function(
  int index,
  int count,
);

typedef TimelineBucketSource = Stream<List<Bucket>> Function();

class TimelineFactory {
  final ITimelineRepository _timelineRepository;
  final SettingsService _settingsService;

  const TimelineFactory({
    required ITimelineRepository timelineRepository,
    required SettingsService settingsService,
  })  : _timelineRepository = timelineRepository,
        _settingsService = settingsService;

  GroupAssetsBy get groupBy =>
      GroupAssetsBy.values[_settingsService.get(Setting.groupAssetsBy)];

  TimelineService main(List<String> timelineUsers) => TimelineService(
        assetSource: (offset, count) => _timelineRepository
            .getMainBucketAssets(timelineUsers, offset: offset, count: count),
        bucketSource: () => _timelineRepository.watchMainBucket(
          timelineUsers,
          groupBy: groupBy,
        ),
      );

  TimelineService localAlbum({required String albumId}) => TimelineService(
        assetSource: (offset, count) => _timelineRepository
            .getLocalBucketAssets(albumId, offset: offset, count: count),
        bucketSource: () =>
            _timelineRepository.watchLocalBucket(albumId, groupBy: groupBy),
      );
}

class TimelineService {
  final TimelineAssetSource _assetSource;
  final TimelineBucketSource _bucketSource;

  TimelineService({
    required TimelineAssetSource assetSource,
    required TimelineBucketSource bucketSource,
  })  : _assetSource = assetSource,
        _bucketSource = bucketSource {
    _bucketSubscription =
        _bucketSource().listen((_) => unawaited(_reloadBucket()));
  }

  final AsyncMutex _mutex = AsyncMutex();
  int _bufferOffset = 0;
  List<BaseAsset> _buffer = [];
  StreamSubscription? _bucketSubscription;

  Stream<List<Bucket>> Function() get watchBuckets => _bucketSource;

  Future<void> _reloadBucket() => _mutex.run(() async {
        _buffer = await _assetSource(_bufferOffset, _buffer.length);
      });

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

    final assets = await _assetSource(start, len);
    _buffer = assets;
    _bufferOffset = start;

    return getAssets(index, count);
  }

  bool hasRange(int index, int count) =>
      index >= _bufferOffset && index + count <= _bufferOffset + _buffer.length;

  List<BaseAsset> getAssets(int index, int count) {
    if (!hasRange(index, count)) {
      throw RangeError('TimelineService::getAssets Index out of range');
    }
    int start = index - _bufferOffset;
    return _buffer.slice(start, start + count);
  }

  Future<void> dispose() async {
    await _bucketSubscription?.cancel();
    _bucketSubscription = null;
    _buffer.clear();
    _bufferOffset = 0;
  }
}

import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';

abstract interface class ITimelineRepository implements IDatabaseRepository {
  Stream<List<Bucket>> watchMainBucket(
    List<String> timelineUsers, {
    GroupAssetsBy groupBy = GroupAssetsBy.day,
  });

  Future<List<BaseAsset>> getMainBucketAssets(
    List<String> timelineUsers, {
    required int offset,
    required int count,
  });

  Stream<List<Bucket>> watchLocalBucket(
    String albumId, {
    GroupAssetsBy groupBy = GroupAssetsBy.day,
  });

  Future<List<BaseAsset>> getLocalBucketAssets(
    String albumId, {
    required int offset,
    required int count,
  });
}

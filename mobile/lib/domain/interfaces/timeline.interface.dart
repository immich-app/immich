import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';

abstract interface class ITimelineRepository implements IDatabaseRepository {
  Stream<List<Bucket>> watchMainBucket();

  Future<List<BaseAsset>> getMainBucketAssets({
    required int index,
    required int count,
  });

  Stream<List<Bucket>> watchLocalBucket(String albumId);

  Future<List<BaseAsset>> getLocalBucketAssets(
    String albumId, {
    required int index,
    required int count,
  });
}

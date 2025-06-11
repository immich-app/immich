import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';

abstract interface class ITimelineRepository implements IDatabaseRepository {
  Stream<List<Bucket>> watchLocalAlbumBuckets(String albumId);

  Future<List<BaseAsset>> getLocalAlbumBucket(
    String albumId, {
    required int index,
    required int count,
  });
}

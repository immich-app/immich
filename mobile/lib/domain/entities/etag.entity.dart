import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'etag.entity.g.dart';

@Collection(inheritance: false)
class ETag {
  ETag({required this.id, this.assetCount, this.time});
  Id get isarId => fastHash(id);
  @Index(unique: true, replace: true, type: IndexType.hash)
  String id;
  int? assetCount;
  DateTime? time;
}

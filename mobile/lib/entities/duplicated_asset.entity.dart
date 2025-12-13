import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'duplicated_asset.entity.g.dart';

@Collection(inheritance: false)
class DuplicatedAsset {
  String id;
  DuplicatedAsset(this.id);
  Id get isarId => fastHash(id);
}

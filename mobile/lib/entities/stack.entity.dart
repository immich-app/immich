import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'stack.entity.g.dart';

@Collection(inheritance: false)
class Stack {
  Stack({
    required this.id,
    required this.primaryAssetId,
    required this.assetCount,
  });

  Id get isarId => fastHash(id);

  @Index(unique: true, replace: false, type: IndexType.hash)
  String id;

  String primaryAssetId;

  int assetCount;

  final assets = IsarLinks<Asset>();
}

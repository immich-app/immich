import 'package:isar/isar.dart';

/// Base class for Asset on iOS
/// iOS uses Strings for the local asset ID
abstract class BaseAsset {
  BaseAsset(this.localId);

  @Index(
    unique: false,
    replace: false,
    type: IndexType.hash,
  )
  String? localId;
}

typedef BaseLocalId = String;

BaseLocalId localIdFromString(String id) => id;

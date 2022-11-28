import 'package:isar/isar.dart';

/// Base class for Asset on Android
/// Android uses 64-bit integers for the local asset ID
abstract class BaseAsset {
  BaseAsset(this.localId);

  @Index(
    unique: false,
    replace: false,
    type: IndexType.value,
  )
  int? localId;
}

typedef BaseLocalId = int;

BaseLocalId localIdFromString(String id) => int.parse(id);

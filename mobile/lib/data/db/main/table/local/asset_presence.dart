import 'package:drift/drift.dart';

class LocalAssetPresenceEntity extends Table {
  const LocalAssetPresenceEntity();

  TextColumn get ownerId => text()();
  TextColumn get checksum => text()();

  @override
  Set<Column> get primaryKey => {ownerId, checksum};
}

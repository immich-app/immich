import 'package:drift/drift.dart';

@TableIndex(name: 'deviceassethash_localId', columns: {#localId})
@TableIndex(name: 'deviceassethash_hash', columns: {#hash})
class DeviceAssetToHash extends Table {
  const DeviceAssetToHash();

  IntColumn get id => integer().autoIncrement()();

  TextColumn get localId => text().unique()();
  TextColumn get hash => text()();
  DateTimeColumn get modifiedTime =>
      dateTime().withDefault(currentDateAndTime)();
}

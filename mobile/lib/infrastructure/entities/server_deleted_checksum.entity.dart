import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class ServerDeletedChecksumEntity extends Table with DriftDefaultsMixin {
  const ServerDeletedChecksumEntity();

  TextColumn get checksum => text()();

  @override
  Set<Column> get primaryKey => {checksum};

  @override
  String get tableName => "server_deleted_checksum";
}

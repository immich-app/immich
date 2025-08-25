import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';
import 'package:isar/isar.dart';

part 'store.entity.g.dart';

/// Internal class for `Store`, do not use elsewhere.
@Collection(inheritance: false)
class StoreValue {
  final Id id;
  final int? intValue;
  final String? strValue;

  const StoreValue(this.id, {this.intValue, this.strValue});
}

class StoreEntity extends Table with DriftDefaultsMixin {
  IntColumn get id => integer()();

  TextColumn get stringValue => text().nullable()();
  IntColumn get intValue => integer().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

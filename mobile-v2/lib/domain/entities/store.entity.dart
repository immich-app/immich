import 'package:drift/drift.dart';

class Store extends Table {
  const Store();

  @override
  String get tableName => 'store';

  IntColumn get id => integer()();
  IntColumn get intValue => integer().nullable()();
  TextColumn get stringValue => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

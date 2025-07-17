// dart format width=80
// GENERATED CODE, DO NOT EDIT BY HAND.
// ignore_for_file: type=lint
import 'package:drift/drift.dart';
import 'package:drift/internal/migrations.dart';
import 'schema_v1.dart' as v1;
import 'schema_v2.dart' as v2;

class GeneratedHelper implements SchemaInstantiationHelper {
  @override
  GeneratedDatabase databaseForVersion(QueryExecutor db, int version) {
    switch (version) {
      case 1:
        return v1.DatabaseAtV1(db);
      case 2:
        return v2.DatabaseAtV2(db);
      default:
        throw MissingSchemaException(version, versions);
    }
  }

  static const versions = const [1, 2];
}

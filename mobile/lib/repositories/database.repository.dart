import 'package:isar/isar.dart';

abstract class DataBaseRepository {
  final Isar db;
  DataBaseRepository(this.db);
}

extension Asd<T> on QueryBuilder<T, dynamic, dynamic> {
  QueryBuilder<T, T, O> noOp<O>() {
    // ignore: invalid_use_of_protected_member
    return QueryBuilder.apply(this, (query) => query);
  }
}

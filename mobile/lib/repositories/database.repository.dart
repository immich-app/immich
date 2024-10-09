import 'dart:async';

import 'package:immich_mobile/interfaces/database.interface.dart';
import 'package:isar/isar.dart';

/// copied from Isar; needed to check if an async transaction is already active
const Symbol _zoneTxn = #zoneTxn;

abstract class DatabaseRepository implements IDatabaseRepository {
  final Isar db;
  DatabaseRepository(this.db);

  bool get inTxn => Zone.current[_zoneTxn] != null;

  Future<T> txn<T>(Future<T> Function() callback) =>
      inTxn ? callback() : transaction(callback);

  @override
  Future<T> transaction<T>(Future<T> Function() callback) =>
      db.writeTxn(callback);
}

extension Asd<T> on QueryBuilder<T, dynamic, dynamic> {
  QueryBuilder<T, T, O> noOp<O>() {
    // ignore: invalid_use_of_protected_member
    return QueryBuilder.apply(this, (query) => query);
  }
}

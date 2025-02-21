import 'dart:async';

import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:isar/isar.dart';

// #zoneTxn is the symbol used by Isar to mark a transaction within the current zone
// ref: isar/isar_common.dart
const Symbol _kzoneTxn = #zoneTxn;

class IsarDatabaseRepository implements IDatabaseRepository {
  final Isar _db;
  const IsarDatabaseRepository(Isar db) : _db = db;

  // Isar do not support nested transactions. This is a workaround to prevent us from making nested transactions
  // Reuse the current transaction if it is already active, else start a new transaction
  @override
  Future<T> transaction<T>(Future<T> Function() callback) =>
      Zone.current[_kzoneTxn] == null ? _db.writeTxn(callback) : callback();
}

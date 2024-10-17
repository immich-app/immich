abstract interface class IDatabaseRepository {
  /// Runs the [action] in a transaction
  Future<T> txn<T>(Future<T> Function() action);
}

abstract interface class IDatabaseRepository {
  Future<T> nestTxn<T>(Future<T> Function() callback);

  Future<T> txn<T>(Future<T> Function() callback);
}

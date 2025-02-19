abstract interface class IDatabaseRepository {
  Future<T> transaction<T>(Future<T> Function() callback);
}

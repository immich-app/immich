abstract interface class ISyncApiRepository {
  Stream<String> getChanges();
  Future<void> confirmChages(String changeId);
}

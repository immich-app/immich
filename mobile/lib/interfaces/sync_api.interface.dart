abstract interface class ISyncApiRepository {
  Stream<Map<String, dynamic>> getChanges();
  Future<void> confirmChages(String changeId);
}

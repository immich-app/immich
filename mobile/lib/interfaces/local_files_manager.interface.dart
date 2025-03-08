abstract interface class ILocalFilesManager {
  Future<bool> moveToTrash(String fileName);
  Future<bool> restoreFromTrash(String fileName);
}

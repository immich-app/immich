abstract interface class ILocalFilesManager {
  Future<bool> moveToTrash(List<String> mediaUrls);
  Future<bool> restoreFromTrash(String fileName, int type);
  Future<bool> requestManageMediaPermission();
}

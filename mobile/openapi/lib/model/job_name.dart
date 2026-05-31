// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Job name
enum JobName {
  assetDelete._(r'AssetDelete'),
  assetDeleteCheck._(r'AssetDeleteCheck'),
  assetDetectFacesQueueAll._(r'AssetDetectFacesQueueAll'),
  assetDetectFaces._(r'AssetDetectFaces'),
  assetDetectDuplicatesQueueAll._(r'AssetDetectDuplicatesQueueAll'),
  assetDetectDuplicates._(r'AssetDetectDuplicates'),
  assetEditThumbnailGeneration._(r'AssetEditThumbnailGeneration'),
  assetEncodeVideoQueueAll._(r'AssetEncodeVideoQueueAll'),
  assetEncodeVideo._(r'AssetEncodeVideo'),
  assetEmptyTrash._(r'AssetEmptyTrash'),
  assetExtractMetadataQueueAll._(r'AssetExtractMetadataQueueAll'),
  assetExtractMetadata._(r'AssetExtractMetadata'),
  assetFileMigration._(r'AssetFileMigration'),
  assetGenerateThumbnailsQueueAll._(r'AssetGenerateThumbnailsQueueAll'),
  assetGenerateThumbnails._(r'AssetGenerateThumbnails'),
  auditTableCleanup._(r'AuditTableCleanup'),
  databaseBackup._(r'DatabaseBackup'),
  facialRecognitionQueueAll._(r'FacialRecognitionQueueAll'),
  facialRecognition._(r'FacialRecognition'),
  fileDelete._(r'FileDelete'),
  fileMigrationQueueAll._(r'FileMigrationQueueAll'),
  libraryDeleteCheck._(r'LibraryDeleteCheck'),
  libraryDelete._(r'LibraryDelete'),
  libraryRemoveAsset._(r'LibraryRemoveAsset'),
  libraryScanAssetsQueueAll._(r'LibraryScanAssetsQueueAll'),
  librarySyncAssets._(r'LibrarySyncAssets'),
  librarySyncFilesQueueAll._(r'LibrarySyncFilesQueueAll'),
  librarySyncFiles._(r'LibrarySyncFiles'),
  libraryScanQueueAll._(r'LibraryScanQueueAll'),
  memoryCleanup._(r'MemoryCleanup'),
  memoryGenerate._(r'MemoryGenerate'),
  notificationsCleanup._(r'NotificationsCleanup'),
  notifyUserSignup._(r'NotifyUserSignup'),
  notifyAlbumInvite._(r'NotifyAlbumInvite'),
  notifyAlbumUpdate._(r'NotifyAlbumUpdate'),
  userDelete._(r'UserDelete'),
  userDeleteCheck._(r'UserDeleteCheck'),
  userSyncUsage._(r'UserSyncUsage'),
  personCleanup._(r'PersonCleanup'),
  personFileMigration._(r'PersonFileMigration'),
  personGenerateThumbnail._(r'PersonGenerateThumbnail'),
  sessionCleanup._(r'SessionCleanup'),
  sendMail._(r'SendMail'),
  sidecarQueueAll._(r'SidecarQueueAll'),
  sidecarCheck._(r'SidecarCheck'),
  sidecarWrite._(r'SidecarWrite'),
  smartSearchQueueAll._(r'SmartSearchQueueAll'),
  smartSearch._(r'SmartSearch'),
  storageTemplateMigration._(r'StorageTemplateMigration'),
  storageTemplateMigrationSingle._(r'StorageTemplateMigrationSingle'),
  tagCleanup._(r'TagCleanup'),
  versionCheck._(r'VersionCheck'),
  ocrQueueAll._(r'OcrQueueAll'),
  ocr._(r'Ocr'),
  workflowAssetTrigger._(r'WorkflowAssetTrigger'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const JobName._(this.value);

  final String value;

  static JobName? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

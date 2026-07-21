//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

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
  hlsSessionCleanup._(r'HlsSessionCleanup'),
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
  integrityUntrackedFilesQueueAll._(r'IntegrityUntrackedFilesQueueAll'),
  integrityUntrackedFiles._(r'IntegrityUntrackedFiles'),
  integrityUntrackedRefresh._(r'IntegrityUntrackedRefresh'),
  integrityMissingFilesQueueAll._(r'IntegrityMissingFilesQueueAll'),
  integrityMissingFiles._(r'IntegrityMissingFiles'),
  integrityMissingFilesRefresh._(r'IntegrityMissingFilesRefresh'),
  integrityChecksumFiles._(r'IntegrityChecksumFiles'),
  integrityChecksumFilesRefresh._(r'IntegrityChecksumFilesRefresh'),
  integrityDeleteReportType._(r'IntegrityDeleteReportType'),
  integrityDeleteReports._(r'IntegrityDeleteReports'),
  ;

  /// Instantiate a new enum with the provided value.
  const JobName._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [JobName] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static JobName? fromJson(dynamic value) => JobNameTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [JobName]
  /// that were successfully decoded from the passed [JSON][json].
  static List<JobName> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobName>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobName.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [JobName] to String,
/// and [decode] dynamic data back to [JobName].
class JobNameTypeTransformer {
  factory JobNameTypeTransformer() => _instance ??= const JobNameTypeTransformer._();

  const JobNameTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(JobName data) => data._value;

  /// Returns the instance of [JobName] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  JobName? decode(dynamic data, {bool allowNull = true}) {
    if (data is JobName) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'AssetDelete': return JobName.assetDelete;
        case r'AssetDeleteCheck': return JobName.assetDeleteCheck;
        case r'AssetDetectFacesQueueAll': return JobName.assetDetectFacesQueueAll;
        case r'AssetDetectFaces': return JobName.assetDetectFaces;
        case r'AssetDetectDuplicatesQueueAll': return JobName.assetDetectDuplicatesQueueAll;
        case r'AssetDetectDuplicates': return JobName.assetDetectDuplicates;
        case r'AssetEditThumbnailGeneration': return JobName.assetEditThumbnailGeneration;
        case r'AssetEncodeVideoQueueAll': return JobName.assetEncodeVideoQueueAll;
        case r'AssetEncodeVideo': return JobName.assetEncodeVideo;
        case r'AssetEmptyTrash': return JobName.assetEmptyTrash;
        case r'AssetExtractMetadataQueueAll': return JobName.assetExtractMetadataQueueAll;
        case r'AssetExtractMetadata': return JobName.assetExtractMetadata;
        case r'AssetFileMigration': return JobName.assetFileMigration;
        case r'AssetGenerateThumbnailsQueueAll': return JobName.assetGenerateThumbnailsQueueAll;
        case r'AssetGenerateThumbnails': return JobName.assetGenerateThumbnails;
        case r'AuditTableCleanup': return JobName.auditTableCleanup;
        case r'DatabaseBackup': return JobName.databaseBackup;
        case r'FacialRecognitionQueueAll': return JobName.facialRecognitionQueueAll;
        case r'FacialRecognition': return JobName.facialRecognition;
        case r'FileDelete': return JobName.fileDelete;
        case r'FileMigrationQueueAll': return JobName.fileMigrationQueueAll;
        case r'LibraryDeleteCheck': return JobName.libraryDeleteCheck;
        case r'LibraryDelete': return JobName.libraryDelete;
        case r'LibraryRemoveAsset': return JobName.libraryRemoveAsset;
        case r'LibraryScanAssetsQueueAll': return JobName.libraryScanAssetsQueueAll;
        case r'LibrarySyncAssets': return JobName.librarySyncAssets;
        case r'LibrarySyncFilesQueueAll': return JobName.librarySyncFilesQueueAll;
        case r'LibrarySyncFiles': return JobName.librarySyncFiles;
        case r'LibraryScanQueueAll': return JobName.libraryScanQueueAll;
        case r'HlsSessionCleanup': return JobName.hlsSessionCleanup;
        case r'MemoryCleanup': return JobName.memoryCleanup;
        case r'MemoryGenerate': return JobName.memoryGenerate;
        case r'NotificationsCleanup': return JobName.notificationsCleanup;
        case r'NotifyUserSignup': return JobName.notifyUserSignup;
        case r'NotifyAlbumInvite': return JobName.notifyAlbumInvite;
        case r'NotifyAlbumUpdate': return JobName.notifyAlbumUpdate;
        case r'UserDelete': return JobName.userDelete;
        case r'UserDeleteCheck': return JobName.userDeleteCheck;
        case r'UserSyncUsage': return JobName.userSyncUsage;
        case r'PersonCleanup': return JobName.personCleanup;
        case r'PersonFileMigration': return JobName.personFileMigration;
        case r'PersonGenerateThumbnail': return JobName.personGenerateThumbnail;
        case r'SessionCleanup': return JobName.sessionCleanup;
        case r'SendMail': return JobName.sendMail;
        case r'SidecarQueueAll': return JobName.sidecarQueueAll;
        case r'SidecarCheck': return JobName.sidecarCheck;
        case r'SidecarWrite': return JobName.sidecarWrite;
        case r'SmartSearchQueueAll': return JobName.smartSearchQueueAll;
        case r'SmartSearch': return JobName.smartSearch;
        case r'StorageTemplateMigration': return JobName.storageTemplateMigration;
        case r'StorageTemplateMigrationSingle': return JobName.storageTemplateMigrationSingle;
        case r'TagCleanup': return JobName.tagCleanup;
        case r'VersionCheck': return JobName.versionCheck;
        case r'OcrQueueAll': return JobName.ocrQueueAll;
        case r'Ocr': return JobName.ocr;
        case r'WorkflowAssetTrigger': return JobName.workflowAssetTrigger;
        case r'IntegrityUntrackedFilesQueueAll': return JobName.integrityUntrackedFilesQueueAll;
        case r'IntegrityUntrackedFiles': return JobName.integrityUntrackedFiles;
        case r'IntegrityUntrackedRefresh': return JobName.integrityUntrackedRefresh;
        case r'IntegrityMissingFilesQueueAll': return JobName.integrityMissingFilesQueueAll;
        case r'IntegrityMissingFiles': return JobName.integrityMissingFiles;
        case r'IntegrityMissingFilesRefresh': return JobName.integrityMissingFilesRefresh;
        case r'IntegrityChecksumFiles': return JobName.integrityChecksumFiles;
        case r'IntegrityChecksumFilesRefresh': return JobName.integrityChecksumFilesRefresh;
        case r'IntegrityDeleteReportType': return JobName.integrityDeleteReportType;
        case r'IntegrityDeleteReports': return JobName.integrityDeleteReports;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static JobNameTypeTransformer? _instance;
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class JobName {
  /// Instantiate a new enum with the provided [value].
  const JobName._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const assetDelete = JobName._(r'AssetDelete');
  static const assetDeleteCheck = JobName._(r'AssetDeleteCheck');
  static const assetDetectFacesQueueAll = JobName._(r'AssetDetectFacesQueueAll');
  static const assetDetectFaces = JobName._(r'AssetDetectFaces');
  static const assetDetectDuplicatesQueueAll = JobName._(r'AssetDetectDuplicatesQueueAll');
  static const assetDetectDuplicates = JobName._(r'AssetDetectDuplicates');
  static const assetEditThumbnailGeneration = JobName._(r'AssetEditThumbnailGeneration');
  static const assetEncodeVideoQueueAll = JobName._(r'AssetEncodeVideoQueueAll');
  static const assetEncodeVideo = JobName._(r'AssetEncodeVideo');
  static const assetEmptyTrash = JobName._(r'AssetEmptyTrash');
  static const assetExtractMetadataQueueAll = JobName._(r'AssetExtractMetadataQueueAll');
  static const assetExtractMetadata = JobName._(r'AssetExtractMetadata');
  static const assetFileMigration = JobName._(r'AssetFileMigration');
  static const assetGenerateThumbnailsQueueAll = JobName._(r'AssetGenerateThumbnailsQueueAll');
  static const assetGenerateThumbnails = JobName._(r'AssetGenerateThumbnails');
  static const auditLogCleanup = JobName._(r'AuditLogCleanup');
  static const auditTableCleanup = JobName._(r'AuditTableCleanup');
  static const databaseBackup = JobName._(r'DatabaseBackup');
  static const facialRecognitionQueueAll = JobName._(r'FacialRecognitionQueueAll');
  static const facialRecognition = JobName._(r'FacialRecognition');
  static const fileDelete = JobName._(r'FileDelete');
  static const fileMigrationQueueAll = JobName._(r'FileMigrationQueueAll');
  static const libraryDeleteCheck = JobName._(r'LibraryDeleteCheck');
  static const libraryDelete = JobName._(r'LibraryDelete');
  static const libraryRemoveAsset = JobName._(r'LibraryRemoveAsset');
  static const libraryScanAssetsQueueAll = JobName._(r'LibraryScanAssetsQueueAll');
  static const librarySyncAssets = JobName._(r'LibrarySyncAssets');
  static const librarySyncFilesQueueAll = JobName._(r'LibrarySyncFilesQueueAll');
  static const librarySyncFiles = JobName._(r'LibrarySyncFiles');
  static const libraryScanQueueAll = JobName._(r'LibraryScanQueueAll');
  static const memoryCleanup = JobName._(r'MemoryCleanup');
  static const memoryGenerate = JobName._(r'MemoryGenerate');
  static const notificationsCleanup = JobName._(r'NotificationsCleanup');
  static const notifyUserSignup = JobName._(r'NotifyUserSignup');
  static const notifyAlbumInvite = JobName._(r'NotifyAlbumInvite');
  static const notifyAlbumUpdate = JobName._(r'NotifyAlbumUpdate');
  static const userDelete = JobName._(r'UserDelete');
  static const userDeleteCheck = JobName._(r'UserDeleteCheck');
  static const userSyncUsage = JobName._(r'UserSyncUsage');
  static const personCleanup = JobName._(r'PersonCleanup');
  static const personFileMigration = JobName._(r'PersonFileMigration');
  static const personGenerateThumbnail = JobName._(r'PersonGenerateThumbnail');
  static const sessionCleanup = JobName._(r'SessionCleanup');
  static const sendMail = JobName._(r'SendMail');
  static const sidecarQueueAll = JobName._(r'SidecarQueueAll');
  static const sidecarCheck = JobName._(r'SidecarCheck');
  static const sidecarWrite = JobName._(r'SidecarWrite');
  static const smartSearchQueueAll = JobName._(r'SmartSearchQueueAll');
  static const smartSearch = JobName._(r'SmartSearch');
  static const storageTemplateMigration = JobName._(r'StorageTemplateMigration');
  static const storageTemplateMigrationSingle = JobName._(r'StorageTemplateMigrationSingle');
  static const tagCleanup = JobName._(r'TagCleanup');
  static const versionCheck = JobName._(r'VersionCheck');
  static const ocrQueueAll = JobName._(r'OcrQueueAll');
  static const ocr = JobName._(r'Ocr');
  static const workflowRun = JobName._(r'WorkflowRun');

  /// List of all possible values in this [enum][JobName].
  static const values = <JobName>[
    assetDelete,
    assetDeleteCheck,
    assetDetectFacesQueueAll,
    assetDetectFaces,
    assetDetectDuplicatesQueueAll,
    assetDetectDuplicates,
    assetEditThumbnailGeneration,
    assetEncodeVideoQueueAll,
    assetEncodeVideo,
    assetEmptyTrash,
    assetExtractMetadataQueueAll,
    assetExtractMetadata,
    assetFileMigration,
    assetGenerateThumbnailsQueueAll,
    assetGenerateThumbnails,
    auditLogCleanup,
    auditTableCleanup,
    databaseBackup,
    facialRecognitionQueueAll,
    facialRecognition,
    fileDelete,
    fileMigrationQueueAll,
    libraryDeleteCheck,
    libraryDelete,
    libraryRemoveAsset,
    libraryScanAssetsQueueAll,
    librarySyncAssets,
    librarySyncFilesQueueAll,
    librarySyncFiles,
    libraryScanQueueAll,
    memoryCleanup,
    memoryGenerate,
    notificationsCleanup,
    notifyUserSignup,
    notifyAlbumInvite,
    notifyAlbumUpdate,
    userDelete,
    userDeleteCheck,
    userSyncUsage,
    personCleanup,
    personFileMigration,
    personGenerateThumbnail,
    sessionCleanup,
    sendMail,
    sidecarQueueAll,
    sidecarCheck,
    sidecarWrite,
    smartSearchQueueAll,
    smartSearch,
    storageTemplateMigration,
    storageTemplateMigrationSingle,
    tagCleanup,
    versionCheck,
    ocrQueueAll,
    ocr,
    workflowRun,
  ];

  static JobName? fromJson(dynamic value) => JobNameTypeTransformer().decode(value);

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

  String encode(JobName data) => data.value;

  /// Decodes a [dynamic value][data] to a JobName.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  JobName? decode(dynamic data, {bool allowNull = true}) {
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
        case r'AuditLogCleanup': return JobName.auditLogCleanup;
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
        case r'WorkflowRun': return JobName.workflowRun;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [JobNameTypeTransformer] instance.
  static JobNameTypeTransformer? _instance;
}


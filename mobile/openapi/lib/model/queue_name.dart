// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Queue name
enum QueueName {
  thumbnailGeneration._(r'thumbnailGeneration'),
  metadataExtraction._(r'metadataExtraction'),
  videoConversion._(r'videoConversion'),
  faceDetection._(r'faceDetection'),
  facialRecognition._(r'facialRecognition'),
  smartSearch._(r'smartSearch'),
  duplicateDetection._(r'duplicateDetection'),
  backgroundTask._(r'backgroundTask'),
  storageTemplateMigration._(r'storageTemplateMigration'),
  migration._(r'migration'),
  search._(r'search'),
  sidecar._(r'sidecar'),
  library$._(r'library'),
  notifications._(r'notifications'),
  backupDatabase._(r'backupDatabase'),
  ocr._(r'ocr'),
  workflow._(r'workflow'),
  editor._(r'editor'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const QueueName._(this.value);

  final String value;

  static QueueName? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

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
  library_._(r'library'),
  notifications._(r'notifications'),
  backupDatabase._(r'backupDatabase'),
  ocr._(r'ocr'),
  workflow._(r'workflow'),
  integrityCheck._(r'integrityCheck'),
  editor._(r'editor'),
  ;

  /// Instantiate a new enum with the provided value.
  const QueueName._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [QueueName] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static QueueName? fromJson(dynamic value) => QueueNameTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [QueueName]
  /// that were successfully decoded from the passed [JSON][json].
  static List<QueueName> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueName>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueName.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [QueueName] to String,
/// and [decode] dynamic data back to [QueueName].
class QueueNameTypeTransformer {
  factory QueueNameTypeTransformer() => _instance ??= const QueueNameTypeTransformer._();

  const QueueNameTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(QueueName data) => data._value;

  /// Returns the instance of [QueueName] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  QueueName? decode(dynamic data, {bool allowNull = true}) {
    if (data is QueueName) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'thumbnailGeneration': return QueueName.thumbnailGeneration;
        case r'metadataExtraction': return QueueName.metadataExtraction;
        case r'videoConversion': return QueueName.videoConversion;
        case r'faceDetection': return QueueName.faceDetection;
        case r'facialRecognition': return QueueName.facialRecognition;
        case r'smartSearch': return QueueName.smartSearch;
        case r'duplicateDetection': return QueueName.duplicateDetection;
        case r'backgroundTask': return QueueName.backgroundTask;
        case r'storageTemplateMigration': return QueueName.storageTemplateMigration;
        case r'migration': return QueueName.migration;
        case r'search': return QueueName.search;
        case r'sidecar': return QueueName.sidecar;
        case r'library': return QueueName.library_;
        case r'notifications': return QueueName.notifications;
        case r'backupDatabase': return QueueName.backupDatabase;
        case r'ocr': return QueueName.ocr;
        case r'workflow': return QueueName.workflow;
        case r'integrityCheck': return QueueName.integrityCheck;
        case r'editor': return QueueName.editor;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static QueueNameTypeTransformer? _instance;
}


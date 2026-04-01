//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class QueueName {
  /// Instantiate a new enum with the provided [value].
  const QueueName._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const thumbnailGeneration = QueueName._(r'thumbnailGeneration');
  static const metadataExtraction = QueueName._(r'metadataExtraction');
  static const videoConversion = QueueName._(r'videoConversion');
  static const faceDetection = QueueName._(r'faceDetection');
  static const facialRecognition = QueueName._(r'facialRecognition');
  static const smartSearch = QueueName._(r'smartSearch');
  static const duplicateDetection = QueueName._(r'duplicateDetection');
  static const backgroundTask = QueueName._(r'backgroundTask');
  static const storageTemplateMigration = QueueName._(r'storageTemplateMigration');
  static const migration = QueueName._(r'migration');
  static const search = QueueName._(r'search');
  static const sidecar = QueueName._(r'sidecar');
  static const library_ = QueueName._(r'library');
  static const notifications = QueueName._(r'notifications');
  static const backupDatabase = QueueName._(r'backupDatabase');
  static const ocr = QueueName._(r'ocr');
  static const workflow = QueueName._(r'workflow');
  static const editor = QueueName._(r'editor');

  /// List of all possible values in this [enum][QueueName].
  static const values = <QueueName>[
    thumbnailGeneration,
    metadataExtraction,
    videoConversion,
    faceDetection,
    facialRecognition,
    smartSearch,
    duplicateDetection,
    backgroundTask,
    storageTemplateMigration,
    migration,
    search,
    sidecar,
    library_,
    notifications,
    backupDatabase,
    ocr,
    workflow,
    editor,
  ];

  static QueueName? fromJson(dynamic value) => QueueNameTypeTransformer().decode(value);

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

  String encode(QueueName data) => data.value;

  /// Decodes a [dynamic value][data] to a QueueName.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  QueueName? decode(dynamic data, {bool allowNull = true}) {
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
        case r'editor': return QueueName.editor;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [QueueNameTypeTransformer] instance.
  static QueueNameTypeTransformer? _instance;
}


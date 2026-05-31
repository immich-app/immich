// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class QueuesResponseLegacyDto {
  const QueuesResponseLegacyDto({
    required this.backgroundTask,
    required this.backupDatabase,
    required this.duplicateDetection,
    required this.editor,
    required this.faceDetection,
    required this.facialRecognition,
    required this.library$,
    required this.metadataExtraction,
    required this.migration,
    required this.notifications,
    required this.ocr,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.storageTemplateMigration,
    required this.thumbnailGeneration,
    required this.videoConversion,
    required this.workflow,
  });

  final QueueResponseLegacyDto backgroundTask;

  final QueueResponseLegacyDto backupDatabase;

  final QueueResponseLegacyDto duplicateDetection;

  final QueueResponseLegacyDto editor;

  final QueueResponseLegacyDto faceDetection;

  final QueueResponseLegacyDto facialRecognition;

  final QueueResponseLegacyDto library$;

  final QueueResponseLegacyDto metadataExtraction;

  final QueueResponseLegacyDto migration;

  final QueueResponseLegacyDto notifications;

  final QueueResponseLegacyDto ocr;

  final QueueResponseLegacyDto search;

  final QueueResponseLegacyDto sidecar;

  final QueueResponseLegacyDto smartSearch;

  final QueueResponseLegacyDto storageTemplateMigration;

  final QueueResponseLegacyDto thumbnailGeneration;

  final QueueResponseLegacyDto videoConversion;

  final QueueResponseLegacyDto workflow;

  static QueuesResponseLegacyDto? fromJson(dynamic value) {
    ApiCompat.upgrade<QueuesResponseLegacyDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      backgroundTask: (QueueResponseLegacyDto.fromJson(json[r'backgroundTask']))!,
      backupDatabase: (QueueResponseLegacyDto.fromJson(json[r'backupDatabase']))!,
      duplicateDetection: (QueueResponseLegacyDto.fromJson(json[r'duplicateDetection']))!,
      editor: (QueueResponseLegacyDto.fromJson(json[r'editor']))!,
      faceDetection: (QueueResponseLegacyDto.fromJson(json[r'faceDetection']))!,
      facialRecognition: (QueueResponseLegacyDto.fromJson(json[r'facialRecognition']))!,
      library$: (QueueResponseLegacyDto.fromJson(json[r'library']))!,
      metadataExtraction: (QueueResponseLegacyDto.fromJson(json[r'metadataExtraction']))!,
      migration: (QueueResponseLegacyDto.fromJson(json[r'migration']))!,
      notifications: (QueueResponseLegacyDto.fromJson(json[r'notifications']))!,
      ocr: (QueueResponseLegacyDto.fromJson(json[r'ocr']))!,
      search: (QueueResponseLegacyDto.fromJson(json[r'search']))!,
      sidecar: (QueueResponseLegacyDto.fromJson(json[r'sidecar']))!,
      smartSearch: (QueueResponseLegacyDto.fromJson(json[r'smartSearch']))!,
      storageTemplateMigration: (QueueResponseLegacyDto.fromJson(json[r'storageTemplateMigration']))!,
      thumbnailGeneration: (QueueResponseLegacyDto.fromJson(json[r'thumbnailGeneration']))!,
      videoConversion: (QueueResponseLegacyDto.fromJson(json[r'videoConversion']))!,
      workflow: (QueueResponseLegacyDto.fromJson(json[r'workflow']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'backgroundTask'] = backgroundTask.toJson();
    json[r'backupDatabase'] = backupDatabase.toJson();
    json[r'duplicateDetection'] = duplicateDetection.toJson();
    json[r'editor'] = editor.toJson();
    json[r'faceDetection'] = faceDetection.toJson();
    json[r'facialRecognition'] = facialRecognition.toJson();
    json[r'library'] = library$.toJson();
    json[r'metadataExtraction'] = metadataExtraction.toJson();
    json[r'migration'] = migration.toJson();
    json[r'notifications'] = notifications.toJson();
    json[r'ocr'] = ocr.toJson();
    json[r'search'] = search.toJson();
    json[r'sidecar'] = sidecar.toJson();
    json[r'smartSearch'] = smartSearch.toJson();
    json[r'storageTemplateMigration'] = storageTemplateMigration.toJson();
    json[r'thumbnailGeneration'] = thumbnailGeneration.toJson();
    json[r'videoConversion'] = videoConversion.toJson();
    json[r'workflow'] = workflow.toJson();
    return json;
  }

  QueuesResponseLegacyDto copyWith({
    QueueResponseLegacyDto? backgroundTask,
    QueueResponseLegacyDto? backupDatabase,
    QueueResponseLegacyDto? duplicateDetection,
    QueueResponseLegacyDto? editor,
    QueueResponseLegacyDto? faceDetection,
    QueueResponseLegacyDto? facialRecognition,
    QueueResponseLegacyDto? library$,
    QueueResponseLegacyDto? metadataExtraction,
    QueueResponseLegacyDto? migration,
    QueueResponseLegacyDto? notifications,
    QueueResponseLegacyDto? ocr,
    QueueResponseLegacyDto? search,
    QueueResponseLegacyDto? sidecar,
    QueueResponseLegacyDto? smartSearch,
    QueueResponseLegacyDto? storageTemplateMigration,
    QueueResponseLegacyDto? thumbnailGeneration,
    QueueResponseLegacyDto? videoConversion,
    QueueResponseLegacyDto? workflow,
  }) {
    return .new(
      backgroundTask: backgroundTask ?? this.backgroundTask,
      backupDatabase: backupDatabase ?? this.backupDatabase,
      duplicateDetection: duplicateDetection ?? this.duplicateDetection,
      editor: editor ?? this.editor,
      faceDetection: faceDetection ?? this.faceDetection,
      facialRecognition: facialRecognition ?? this.facialRecognition,
      library$: library$ ?? this.library$,
      metadataExtraction: metadataExtraction ?? this.metadataExtraction,
      migration: migration ?? this.migration,
      notifications: notifications ?? this.notifications,
      ocr: ocr ?? this.ocr,
      search: search ?? this.search,
      sidecar: sidecar ?? this.sidecar,
      smartSearch: smartSearch ?? this.smartSearch,
      storageTemplateMigration: storageTemplateMigration ?? this.storageTemplateMigration,
      thumbnailGeneration: thumbnailGeneration ?? this.thumbnailGeneration,
      videoConversion: videoConversion ?? this.videoConversion,
      workflow: workflow ?? this.workflow,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is QueuesResponseLegacyDto &&
            backgroundTask == other.backgroundTask &&
            backupDatabase == other.backupDatabase &&
            duplicateDetection == other.duplicateDetection &&
            editor == other.editor &&
            faceDetection == other.faceDetection &&
            facialRecognition == other.facialRecognition &&
            library$ == other.library$ &&
            metadataExtraction == other.metadataExtraction &&
            migration == other.migration &&
            notifications == other.notifications &&
            ocr == other.ocr &&
            search == other.search &&
            sidecar == other.sidecar &&
            smartSearch == other.smartSearch &&
            storageTemplateMigration == other.storageTemplateMigration &&
            thumbnailGeneration == other.thumbnailGeneration &&
            videoConversion == other.videoConversion &&
            workflow == other.workflow);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      backgroundTask,
      backupDatabase,
      duplicateDetection,
      editor,
      faceDetection,
      facialRecognition,
      library$,
      metadataExtraction,
      migration,
      notifications,
      ocr,
      search,
      sidecar,
      smartSearch,
      storageTemplateMigration,
      thumbnailGeneration,
      videoConversion,
      workflow,
    ]);
  }

  @override
  String toString() =>
      'QueuesResponseLegacyDto(backgroundTask=$backgroundTask, backupDatabase=$backupDatabase, duplicateDetection=$duplicateDetection, editor=$editor, faceDetection=$faceDetection, facialRecognition=$facialRecognition, library\$=${library$}, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, ocr=$ocr, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, storageTemplateMigration=$storageTemplateMigration, thumbnailGeneration=$thumbnailGeneration, videoConversion=$videoConversion, workflow=$workflow)';
}

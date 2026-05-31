// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigJobDto {
  const SystemConfigJobDto({
    required this.backgroundTask,
    required this.editor,
    required this.faceDetection,
    required this.library$,
    required this.metadataExtraction,
    required this.migration,
    required this.notifications,
    required this.ocr,
    required this.search,
    required this.sidecar,
    required this.smartSearch,
    required this.thumbnailGeneration,
    required this.videoConversion,
    required this.workflow,
  });

  final JobSettingsDto backgroundTask;

  final JobSettingsDto editor;

  final JobSettingsDto faceDetection;

  final JobSettingsDto library$;

  final JobSettingsDto metadataExtraction;

  final JobSettingsDto migration;

  final JobSettingsDto notifications;

  final JobSettingsDto ocr;

  final JobSettingsDto search;

  final JobSettingsDto sidecar;

  final JobSettingsDto smartSearch;

  final JobSettingsDto thumbnailGeneration;

  final JobSettingsDto videoConversion;

  final JobSettingsDto workflow;

  static SystemConfigJobDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigJobDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      backgroundTask: (JobSettingsDto.fromJson(json[r'backgroundTask']))!,
      editor: (JobSettingsDto.fromJson(json[r'editor']))!,
      faceDetection: (JobSettingsDto.fromJson(json[r'faceDetection']))!,
      library$: (JobSettingsDto.fromJson(json[r'library']))!,
      metadataExtraction: (JobSettingsDto.fromJson(json[r'metadataExtraction']))!,
      migration: (JobSettingsDto.fromJson(json[r'migration']))!,
      notifications: (JobSettingsDto.fromJson(json[r'notifications']))!,
      ocr: (JobSettingsDto.fromJson(json[r'ocr']))!,
      search: (JobSettingsDto.fromJson(json[r'search']))!,
      sidecar: (JobSettingsDto.fromJson(json[r'sidecar']))!,
      smartSearch: (JobSettingsDto.fromJson(json[r'smartSearch']))!,
      thumbnailGeneration: (JobSettingsDto.fromJson(json[r'thumbnailGeneration']))!,
      videoConversion: (JobSettingsDto.fromJson(json[r'videoConversion']))!,
      workflow: (JobSettingsDto.fromJson(json[r'workflow']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'backgroundTask'] = backgroundTask.toJson();
    json[r'editor'] = editor.toJson();
    json[r'faceDetection'] = faceDetection.toJson();
    json[r'library'] = library$.toJson();
    json[r'metadataExtraction'] = metadataExtraction.toJson();
    json[r'migration'] = migration.toJson();
    json[r'notifications'] = notifications.toJson();
    json[r'ocr'] = ocr.toJson();
    json[r'search'] = search.toJson();
    json[r'sidecar'] = sidecar.toJson();
    json[r'smartSearch'] = smartSearch.toJson();
    json[r'thumbnailGeneration'] = thumbnailGeneration.toJson();
    json[r'videoConversion'] = videoConversion.toJson();
    json[r'workflow'] = workflow.toJson();
    return json;
  }

  SystemConfigJobDto copyWith({
    JobSettingsDto? backgroundTask,
    JobSettingsDto? editor,
    JobSettingsDto? faceDetection,
    JobSettingsDto? library$,
    JobSettingsDto? metadataExtraction,
    JobSettingsDto? migration,
    JobSettingsDto? notifications,
    JobSettingsDto? ocr,
    JobSettingsDto? search,
    JobSettingsDto? sidecar,
    JobSettingsDto? smartSearch,
    JobSettingsDto? thumbnailGeneration,
    JobSettingsDto? videoConversion,
    JobSettingsDto? workflow,
  }) {
    return .new(
      backgroundTask: backgroundTask ?? this.backgroundTask,
      editor: editor ?? this.editor,
      faceDetection: faceDetection ?? this.faceDetection,
      library$: library$ ?? this.library$,
      metadataExtraction: metadataExtraction ?? this.metadataExtraction,
      migration: migration ?? this.migration,
      notifications: notifications ?? this.notifications,
      ocr: ocr ?? this.ocr,
      search: search ?? this.search,
      sidecar: sidecar ?? this.sidecar,
      smartSearch: smartSearch ?? this.smartSearch,
      thumbnailGeneration: thumbnailGeneration ?? this.thumbnailGeneration,
      videoConversion: videoConversion ?? this.videoConversion,
      workflow: workflow ?? this.workflow,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigJobDto &&
            backgroundTask == other.backgroundTask &&
            editor == other.editor &&
            faceDetection == other.faceDetection &&
            library$ == other.library$ &&
            metadataExtraction == other.metadataExtraction &&
            migration == other.migration &&
            notifications == other.notifications &&
            ocr == other.ocr &&
            search == other.search &&
            sidecar == other.sidecar &&
            smartSearch == other.smartSearch &&
            thumbnailGeneration == other.thumbnailGeneration &&
            videoConversion == other.videoConversion &&
            workflow == other.workflow);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      backgroundTask,
      editor,
      faceDetection,
      library$,
      metadataExtraction,
      migration,
      notifications,
      ocr,
      search,
      sidecar,
      smartSearch,
      thumbnailGeneration,
      videoConversion,
      workflow,
    ]);
  }

  @override
  String toString() =>
      'SystemConfigJobDto(backgroundTask=$backgroundTask, editor=$editor, faceDetection=$faceDetection, library\$=${library$}, metadataExtraction=$metadataExtraction, migration=$migration, notifications=$notifications, ocr=$ocr, search=$search, sidecar=$sidecar, smartSearch=$smartSearch, thumbnailGeneration=$thumbnailGeneration, videoConversion=$videoConversion, workflow=$workflow)';
}

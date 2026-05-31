// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigNightlyTasksDto {
  const SystemConfigNightlyTasksDto({
    required this.clusterNewFaces,
    required this.databaseCleanup,
    required this.generateMemories,
    required this.missingThumbnails,
    required this.startTime,
    required this.syncQuotaUsage,
  });

  /// Cluster new faces
  final bool clusterNewFaces;

  /// Database cleanup
  final bool databaseCleanup;

  /// Generate memories
  final bool generateMemories;

  /// Missing thumbnails
  final bool missingThumbnails;

  /// Start time
  final String startTime;

  /// Sync quota usage
  final bool syncQuotaUsage;

  static SystemConfigNightlyTasksDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigNightlyTasksDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      clusterNewFaces: json[r'clusterNewFaces'] as bool,
      databaseCleanup: json[r'databaseCleanup'] as bool,
      generateMemories: json[r'generateMemories'] as bool,
      missingThumbnails: json[r'missingThumbnails'] as bool,
      startTime: json[r'startTime'] as String,
      syncQuotaUsage: json[r'syncQuotaUsage'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'clusterNewFaces'] = clusterNewFaces;
    json[r'databaseCleanup'] = databaseCleanup;
    json[r'generateMemories'] = generateMemories;
    json[r'missingThumbnails'] = missingThumbnails;
    json[r'startTime'] = startTime;
    json[r'syncQuotaUsage'] = syncQuotaUsage;
    return json;
  }

  SystemConfigNightlyTasksDto copyWith({
    bool? clusterNewFaces,
    bool? databaseCleanup,
    bool? generateMemories,
    bool? missingThumbnails,
    String? startTime,
    bool? syncQuotaUsage,
  }) {
    return .new(
      clusterNewFaces: clusterNewFaces ?? this.clusterNewFaces,
      databaseCleanup: databaseCleanup ?? this.databaseCleanup,
      generateMemories: generateMemories ?? this.generateMemories,
      missingThumbnails: missingThumbnails ?? this.missingThumbnails,
      startTime: startTime ?? this.startTime,
      syncQuotaUsage: syncQuotaUsage ?? this.syncQuotaUsage,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigNightlyTasksDto &&
            clusterNewFaces == other.clusterNewFaces &&
            databaseCleanup == other.databaseCleanup &&
            generateMemories == other.generateMemories &&
            missingThumbnails == other.missingThumbnails &&
            startTime == other.startTime &&
            syncQuotaUsage == other.syncQuotaUsage);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      clusterNewFaces,
      databaseCleanup,
      generateMemories,
      missingThumbnails,
      startTime,
      syncQuotaUsage,
    ]);
  }

  @override
  String toString() =>
      'SystemConfigNightlyTasksDto(clusterNewFaces=$clusterNewFaces, databaseCleanup=$databaseCleanup, generateMemories=$generateMemories, missingThumbnails=$missingThumbnails, startTime=$startTime, syncQuotaUsage=$syncQuotaUsage)';
}

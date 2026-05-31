// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerVersionHistoryResponseDto {
  const ServerVersionHistoryResponseDto({required this.createdAt, required this.id, required this.version});

  /// When this version was first seen
  final DateTime createdAt;

  /// Version history entry ID
  final String id;

  /// Version string
  final String version;

  static ServerVersionHistoryResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerVersionHistoryResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      id: json[r'id'] as String,
      version: json[r'version'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'id'] = id;
    json[r'version'] = version;
    return json;
  }

  ServerVersionHistoryResponseDto copyWith({DateTime? createdAt, String? id, String? version}) {
    return .new(createdAt: createdAt ?? this.createdAt, id: id ?? this.id, version: version ?? this.version);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ServerVersionHistoryResponseDto &&
            createdAt == other.createdAt &&
            id == other.id &&
            version == other.version);
  }

  @override
  int get hashCode {
    return Object.hashAll([createdAt, id, version]);
  }

  @override
  String toString() => 'ServerVersionHistoryResponseDto(createdAt=$createdAt, id=$id, version=$version)';
}

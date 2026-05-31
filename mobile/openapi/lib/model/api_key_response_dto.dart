// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ApiKeyResponseDto {
  const ApiKeyResponseDto({
    required this.createdAt,
    required this.id,
    required this.name,
    required this.permissions,
    required this.updatedAt,
  });

  /// Creation date
  final DateTime createdAt;

  /// API key ID
  final String id;

  /// API key name
  final String name;

  /// List of permissions
  final List<Permission> permissions;

  /// Last update date
  final DateTime updatedAt;

  static ApiKeyResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ApiKeyResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      id: json[r'id'] as String,
      name: json[r'name'] as String,
      permissions: ((json[r'permissions'] as List?)?.map(($e) => (Permission.fromJson($e))!).toList(growable: false))!,
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'id'] = id;
    json[r'name'] = name;
    json[r'permissions'] = permissions.map(($e) => $e.toJson()).toList(growable: false);
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    return json;
  }

  ApiKeyResponseDto copyWith({
    DateTime? createdAt,
    String? id,
    String? name,
    List<Permission>? permissions,
    DateTime? updatedAt,
  }) {
    return .new(
      createdAt: createdAt ?? this.createdAt,
      id: id ?? this.id,
      name: name ?? this.name,
      permissions: permissions ?? this.permissions,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ApiKeyResponseDto &&
            createdAt == other.createdAt &&
            id == other.id &&
            name == other.name &&
            const DeepCollectionEquality().equals(permissions, other.permissions) &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([createdAt, id, name, const DeepCollectionEquality().hash(permissions), updatedAt]);
  }

  @override
  String toString() =>
      'ApiKeyResponseDto(createdAt=$createdAt, id=$id, name=$name, permissions=$permissions, updatedAt=$updatedAt)';
}

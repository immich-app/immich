// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ApiKeyCreateDto {
  const ApiKeyCreateDto({this.name = const Optional.absent(), required this.permissions});

  /// API key name
  final Optional<String> name;

  /// List of permissions
  final List<Permission> permissions;

  static ApiKeyCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ApiKeyCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      name: json.containsKey(r'name') ? Optional.present(json[r'name'] as String) : const Optional.absent(),
      permissions: ((json[r'permissions'] as List?)?.map(($e) => (Permission.fromJson($e))!).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (name case Present(:final value)) {
      json[r'name'] = value;
    }
    json[r'permissions'] = permissions.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  ApiKeyCreateDto copyWith({Optional<String>? name, List<Permission>? permissions}) {
    return .new(name: name ?? this.name, permissions: permissions ?? this.permissions);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ApiKeyCreateDto &&
            name == other.name &&
            const DeepCollectionEquality().equals(permissions, other.permissions));
  }

  @override
  int get hashCode {
    return Object.hashAll([name, const DeepCollectionEquality().hash(permissions)]);
  }

  @override
  String toString() => 'ApiKeyCreateDto(name=$name, permissions=$permissions)';
}

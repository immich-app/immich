// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ApiKeyUpdateDto {
  const ApiKeyUpdateDto({this.name = const Optional.absent(), this.permissions = const Optional.absent()});

  /// API key name
  final Optional<String> name;

  /// List of permissions
  final Optional<List<Permission>> permissions;

  static ApiKeyUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ApiKeyUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      name: json.containsKey(r'name') ? Optional.present(json[r'name'] as String) : const Optional.absent(),
      permissions: json.containsKey(r'permissions')
          ? Optional.present(
              ((json[r'permissions'] as List?)?.map(($e) => (Permission.fromJson($e))!).toList(growable: false))!,
            )
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (name case Present(:final value)) {
      json[r'name'] = value;
    }
    if (permissions case Present(:final value)) {
      json[r'permissions'] = value.map(($e) => $e.toJson()).toList(growable: false);
    }
    return json;
  }

  ApiKeyUpdateDto copyWith({Optional<String>? name, Optional<List<Permission>>? permissions}) {
    return .new(name: name ?? this.name, permissions: permissions ?? this.permissions);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ApiKeyUpdateDto && name == other.name && permissions == other.permissions);
  }

  @override
  int get hashCode {
    return Object.hashAll([name, permissions]);
  }

  @override
  String toString() => 'ApiKeyUpdateDto(name=$name, permissions=$permissions)';
}

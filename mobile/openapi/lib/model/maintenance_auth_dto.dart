// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MaintenanceAuthDto {
  const MaintenanceAuthDto({required this.username});

  /// Maintenance username
  final String username;

  static MaintenanceAuthDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MaintenanceAuthDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(username: json[r'username'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'username'] = username;
    return json;
  }

  MaintenanceAuthDto copyWith({String? username}) {
    return .new(username: username ?? this.username);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is MaintenanceAuthDto && username == other.username);
  }

  @override
  int get hashCode {
    return Object.hashAll([username]);
  }

  @override
  String toString() => 'MaintenanceAuthDto(username=$username)';
}

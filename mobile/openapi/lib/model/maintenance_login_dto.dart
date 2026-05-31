// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MaintenanceLoginDto {
  const MaintenanceLoginDto({this.token = const Optional.absent()});

  /// Maintenance token
  final Optional<String> token;

  static MaintenanceLoginDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MaintenanceLoginDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      token: json.containsKey(r'token') ? Optional.present(json[r'token'] as String) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (token case Present(:final value)) {
      json[r'token'] = value;
    }
    return json;
  }

  MaintenanceLoginDto copyWith({Optional<String>? token}) {
    return .new(token: token ?? this.token);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is MaintenanceLoginDto && token == other.token);
  }

  @override
  int get hashCode {
    return Object.hashAll([token]);
  }

  @override
  String toString() => 'MaintenanceLoginDto(token=$token)';
}

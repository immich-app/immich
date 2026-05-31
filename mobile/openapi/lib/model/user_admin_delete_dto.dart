// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UserAdminDeleteDto {
  const UserAdminDeleteDto({this.force = const Optional.absent()});

  /// Force delete even if user has assets
  final Optional<bool> force;

  static UserAdminDeleteDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UserAdminDeleteDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(force: json.containsKey(r'force') ? Optional.present(json[r'force'] as bool) : const Optional.absent());
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (force case Present(:final value)) {
      json[r'force'] = value;
    }
    return json;
  }

  UserAdminDeleteDto copyWith({Optional<bool>? force}) {
    return .new(force: force ?? this.force);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is UserAdminDeleteDto && force == other.force);
  }

  @override
  int get hashCode {
    return Object.hashAll([force]);
  }

  @override
  String toString() => 'UserAdminDeleteDto(force=$force)';
}

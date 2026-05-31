// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SharedLinkLoginDto {
  const SharedLinkLoginDto({required this.password});

  /// Shared link password
  final String password;

  static SharedLinkLoginDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SharedLinkLoginDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(password: json[r'password'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'password'] = password;
    return json;
  }

  SharedLinkLoginDto copyWith({String? password}) {
    return .new(password: password ?? this.password);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SharedLinkLoginDto && password == other.password);
  }

  @override
  int get hashCode {
    return Object.hashAll([password]);
  }

  @override
  String toString() => 'SharedLinkLoginDto(password=$password)';
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ValidateAccessTokenResponseDto {
  const ValidateAccessTokenResponseDto({required this.authStatus});

  /// Authentication status
  final bool authStatus;

  static ValidateAccessTokenResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ValidateAccessTokenResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(authStatus: json[r'authStatus'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'authStatus'] = authStatus;
    return json;
  }

  ValidateAccessTokenResponseDto copyWith({bool? authStatus}) {
    return .new(authStatus: authStatus ?? this.authStatus);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is ValidateAccessTokenResponseDto && authStatus == other.authStatus);
  }

  @override
  int get hashCode {
    return Object.hashAll([authStatus]);
  }

  @override
  String toString() => 'ValidateAccessTokenResponseDto(authStatus=$authStatus)';
}

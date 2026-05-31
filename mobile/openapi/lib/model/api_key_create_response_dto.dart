// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ApiKeyCreateResponseDto {
  const ApiKeyCreateResponseDto({required this.apiKey, required this.secret});

  final ApiKeyResponseDto apiKey;

  /// API key secret (only shown once)
  final String secret;

  static ApiKeyCreateResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ApiKeyCreateResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(apiKey: (ApiKeyResponseDto.fromJson(json[r'apiKey']))!, secret: json[r'secret'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'apiKey'] = apiKey.toJson();
    json[r'secret'] = secret;
    return json;
  }

  ApiKeyCreateResponseDto copyWith({ApiKeyResponseDto? apiKey, String? secret}) {
    return .new(apiKey: apiKey ?? this.apiKey, secret: secret ?? this.secret);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ApiKeyCreateResponseDto && apiKey == other.apiKey && secret == other.secret);
  }

  @override
  int get hashCode {
    return Object.hashAll([apiKey, secret]);
  }

  @override
  String toString() => 'ApiKeyCreateResponseDto(apiKey=$apiKey, secret=$secret)';
}

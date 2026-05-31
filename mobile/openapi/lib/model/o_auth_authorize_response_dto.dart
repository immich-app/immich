// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class OAuthAuthorizeResponseDto {
  const OAuthAuthorizeResponseDto({required this.url});

  /// OAuth authorization URL
  final String url;

  static OAuthAuthorizeResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<OAuthAuthorizeResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(url: json[r'url'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'url'] = url;
    return json;
  }

  OAuthAuthorizeResponseDto copyWith({String? url}) {
    return .new(url: url ?? this.url);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is OAuthAuthorizeResponseDto && url == other.url);
  }

  @override
  int get hashCode {
    return Object.hashAll([url]);
  }

  @override
  String toString() => 'OAuthAuthorizeResponseDto(url=$url)';
}

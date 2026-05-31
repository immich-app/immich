// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class RatingsResponse {
  const RatingsResponse({required this.enabled});

  /// Whether ratings are enabled
  final bool enabled;

  static RatingsResponse? fromJson(dynamic value) {
    ApiCompat.upgrade<RatingsResponse>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: json[r'enabled'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    return json;
  }

  RatingsResponse copyWith({bool? enabled}) {
    return .new(enabled: enabled ?? this.enabled);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is RatingsResponse && enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled]);
  }

  @override
  String toString() => 'RatingsResponse(enabled=$enabled)';
}

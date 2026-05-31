// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class CastResponse {
  const CastResponse({required this.gCastEnabled});

  /// Whether Google Cast is enabled
  final bool gCastEnabled;

  static CastResponse? fromJson(dynamic value) {
    ApiCompat.upgrade<CastResponse>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(gCastEnabled: json[r'gCastEnabled'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'gCastEnabled'] = gCastEnabled;
    return json;
  }

  CastResponse copyWith({bool? gCastEnabled}) {
    return .new(gCastEnabled: gCastEnabled ?? this.gCastEnabled);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is CastResponse && gCastEnabled == other.gCastEnabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([gCastEnabled]);
  }

  @override
  String toString() => 'CastResponse(gCastEnabled=$gCastEnabled)';
}

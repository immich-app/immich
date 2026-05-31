// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class RatingsUpdate {
  const RatingsUpdate({this.enabled});

  /// Whether ratings are enabled
  final bool? enabled;

  static const _undefined = Object();

  static RatingsUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<RatingsUpdate>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: (json[r'enabled'] as bool?));
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (enabled != null) {
      json[r'enabled'] = enabled!;
    }
    return json;
  }

  RatingsUpdate copyWith({Object? enabled = _undefined}) {
    return .new(enabled: identical(enabled, _undefined) ? this.enabled : enabled as bool?);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is RatingsUpdate && enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled]);
  }

  @override
  String toString() => 'RatingsUpdate(enabled=$enabled)';
}

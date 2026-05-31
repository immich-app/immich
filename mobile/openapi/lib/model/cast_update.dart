// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class CastUpdate {
  const CastUpdate({this.gCastEnabled});

  /// Whether Google Cast is enabled
  final bool? gCastEnabled;

  static const _undefined = Object();

  static CastUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<CastUpdate>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(gCastEnabled: (json[r'gCastEnabled'] as bool?));
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (gCastEnabled != null) {
      json[r'gCastEnabled'] = gCastEnabled!;
    }
    return json;
  }

  CastUpdate copyWith({Object? gCastEnabled = _undefined}) {
    return .new(gCastEnabled: identical(gCastEnabled, _undefined) ? this.gCastEnabled : gCastEnabled as bool?);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is CastUpdate && gCastEnabled == other.gCastEnabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([gCastEnabled]);
  }

  @override
  String toString() => 'CastUpdate(gCastEnabled=$gCastEnabled)';
}

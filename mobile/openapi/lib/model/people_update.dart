// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PeopleUpdate {
  const PeopleUpdate({this.enabled, this.sidebarWeb});

  /// Whether people are enabled
  final bool? enabled;

  /// Whether people appear in web sidebar
  final bool? sidebarWeb;

  static const _undefined = Object();

  static PeopleUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<PeopleUpdate>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: (json[r'enabled'] as bool?), sidebarWeb: (json[r'sidebarWeb'] as bool?));
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (enabled != null) {
      json[r'enabled'] = enabled!;
    }
    if (sidebarWeb != null) {
      json[r'sidebarWeb'] = sidebarWeb!;
    }
    return json;
  }

  PeopleUpdate copyWith({Object? enabled = _undefined, Object? sidebarWeb = _undefined}) {
    return .new(
      enabled: identical(enabled, _undefined) ? this.enabled : enabled as bool?,
      sidebarWeb: identical(sidebarWeb, _undefined) ? this.sidebarWeb : sidebarWeb as bool?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PeopleUpdate && enabled == other.enabled && sidebarWeb == other.sidebarWeb);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, sidebarWeb]);
  }

  @override
  String toString() => 'PeopleUpdate(enabled=$enabled, sidebarWeb=$sidebarWeb)';
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TagsUpdate {
  const TagsUpdate({this.enabled, this.sidebarWeb});

  /// Whether tags are enabled
  final bool? enabled;

  /// Whether tags appear in web sidebar
  final bool? sidebarWeb;

  static const _undefined = Object();

  static TagsUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<TagsUpdate>(value);
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

  TagsUpdate copyWith({Object? enabled = _undefined, Object? sidebarWeb = _undefined}) {
    return .new(
      enabled: identical(enabled, _undefined) ? this.enabled : enabled as bool?,
      sidebarWeb: identical(sidebarWeb, _undefined) ? this.sidebarWeb : sidebarWeb as bool?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is TagsUpdate && enabled == other.enabled && sidebarWeb == other.sidebarWeb);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, sidebarWeb]);
  }

  @override
  String toString() => 'TagsUpdate(enabled=$enabled, sidebarWeb=$sidebarWeb)';
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TagsResponse {
  const TagsResponse({required this.enabled, required this.sidebarWeb});

  /// Whether tags are enabled
  final bool enabled;

  /// Whether tags appear in web sidebar
  final bool sidebarWeb;

  static TagsResponse? fromJson(dynamic value) {
    ApiCompat.upgrade<TagsResponse>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: json[r'enabled'] as bool, sidebarWeb: json[r'sidebarWeb'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'sidebarWeb'] = sidebarWeb;
    return json;
  }

  TagsResponse copyWith({bool? enabled, bool? sidebarWeb}) {
    return .new(enabled: enabled ?? this.enabled, sidebarWeb: sidebarWeb ?? this.sidebarWeb);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is TagsResponse && enabled == other.enabled && sidebarWeb == other.sidebarWeb);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, sidebarWeb]);
  }

  @override
  String toString() => 'TagsResponse(enabled=$enabled, sidebarWeb=$sidebarWeb)';
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MemoriesUpdate {
  const MemoriesUpdate({this.duration, this.enabled});

  /// Memory duration in seconds
  final int? duration;

  /// Whether memories are enabled
  final bool? enabled;

  static const _undefined = Object();

  static MemoriesUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<MemoriesUpdate>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(duration: (json[r'duration'] as int?), enabled: (json[r'enabled'] as bool?));
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (duration != null) {
      json[r'duration'] = duration!;
    }
    if (enabled != null) {
      json[r'enabled'] = enabled!;
    }
    return json;
  }

  MemoriesUpdate copyWith({Object? duration = _undefined, Object? enabled = _undefined}) {
    return .new(
      duration: identical(duration, _undefined) ? this.duration : duration as int?,
      enabled: identical(enabled, _undefined) ? this.enabled : enabled as bool?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MemoriesUpdate && duration == other.duration && enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([duration, enabled]);
  }

  @override
  String toString() => 'MemoriesUpdate(duration=$duration, enabled=$enabled)';
}

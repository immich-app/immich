// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MemoriesResponse {
  const MemoriesResponse({required this.duration, required this.enabled});

  /// Memory duration in seconds
  final int duration;

  /// Whether memories are enabled
  final bool enabled;

  static MemoriesResponse? fromJson(dynamic value) {
    ApiCompat.upgrade<MemoriesResponse>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(duration: json[r'duration'] as int, enabled: json[r'enabled'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'duration'] = duration;
    json[r'enabled'] = enabled;
    return json;
  }

  MemoriesResponse copyWith({int? duration, bool? enabled}) {
    return .new(duration: duration ?? this.duration, enabled: enabled ?? this.enabled);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MemoriesResponse && duration == other.duration && enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([duration, enabled]);
  }

  @override
  String toString() => 'MemoriesResponse(duration=$duration, enabled=$enabled)';
}

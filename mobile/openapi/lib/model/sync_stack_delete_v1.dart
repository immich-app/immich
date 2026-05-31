// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncStackDeleteV1 {
  const SyncStackDeleteV1({required this.stackId});

  /// Stack ID
  final String stackId;

  static SyncStackDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncStackDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(stackId: json[r'stackId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'stackId'] = stackId;
    return json;
  }

  SyncStackDeleteV1 copyWith({String? stackId}) {
    return .new(stackId: stackId ?? this.stackId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncStackDeleteV1 && stackId == other.stackId);
  }

  @override
  int get hashCode {
    return Object.hashAll([stackId]);
  }

  @override
  String toString() => 'SyncStackDeleteV1(stackId=$stackId)';
}

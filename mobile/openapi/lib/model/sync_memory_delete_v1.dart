// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncMemoryDeleteV1 {
  const SyncMemoryDeleteV1({required this.memoryId});

  /// Memory ID
  final String memoryId;

  static SyncMemoryDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncMemoryDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(memoryId: json[r'memoryId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'memoryId'] = memoryId;
    return json;
  }

  SyncMemoryDeleteV1 copyWith({String? memoryId}) {
    return .new(memoryId: memoryId ?? this.memoryId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncMemoryDeleteV1 && memoryId == other.memoryId);
  }

  @override
  int get hashCode {
    return Object.hashAll([memoryId]);
  }

  @override
  String toString() => 'SyncMemoryDeleteV1(memoryId=$memoryId)';
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAckV1 {
  const SyncAckV1();

  static SyncAckV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAckV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new();
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    return json;
  }

  SyncAckV1 copyWith() {
    return .new();
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncAckV1);
  }

  @override
  int get hashCode {
    return runtimeType.hashCode;
  }

  @override
  String toString() => 'SyncAckV1()';
}

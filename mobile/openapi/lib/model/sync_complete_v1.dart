// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncCompleteV1 {
  const SyncCompleteV1();

  static SyncCompleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncCompleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new();
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    return json;
  }

  SyncCompleteV1 copyWith() {
    return .new();
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncCompleteV1);
  }

  @override
  int get hashCode {
    return runtimeType.hashCode;
  }

  @override
  String toString() => 'SyncCompleteV1()';
}

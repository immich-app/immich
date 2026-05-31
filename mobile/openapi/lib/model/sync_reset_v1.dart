// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncResetV1 {
  const SyncResetV1();

  static SyncResetV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncResetV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new();
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    return json;
  }

  SyncResetV1 copyWith() {
    return .new();
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncResetV1);
  }

  @override
  int get hashCode {
    return runtimeType.hashCode;
  }

  @override
  String toString() => 'SyncResetV1()';
}

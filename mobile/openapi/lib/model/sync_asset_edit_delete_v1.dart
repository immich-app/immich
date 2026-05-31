// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAssetEditDeleteV1 {
  const SyncAssetEditDeleteV1({required this.editId});

  /// Edit ID
  final String editId;

  static SyncAssetEditDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAssetEditDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(editId: json[r'editId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'editId'] = editId;
    return json;
  }

  SyncAssetEditDeleteV1 copyWith({String? editId}) {
    return .new(editId: editId ?? this.editId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncAssetEditDeleteV1 && editId == other.editId);
  }

  @override
  int get hashCode {
    return Object.hashAll([editId]);
  }

  @override
  String toString() => 'SyncAssetEditDeleteV1(editId=$editId)';
}

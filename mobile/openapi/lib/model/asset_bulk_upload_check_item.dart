// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetBulkUploadCheckItem {
  const AssetBulkUploadCheckItem({required this.checksum, required this.id});

  /// Base64 or hex encoded SHA1 hash
  final String checksum;

  /// Asset ID
  final String id;

  static AssetBulkUploadCheckItem? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetBulkUploadCheckItem>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(checksum: json[r'checksum'] as String, id: json[r'id'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'checksum'] = checksum;
    json[r'id'] = id;
    return json;
  }

  AssetBulkUploadCheckItem copyWith({String? checksum, String? id}) {
    return .new(checksum: checksum ?? this.checksum, id: id ?? this.id);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetBulkUploadCheckItem && checksum == other.checksum && id == other.id);
  }

  @override
  int get hashCode {
    return Object.hashAll([checksum, id]);
  }

  @override
  String toString() => 'AssetBulkUploadCheckItem(checksum=$checksum, id=$id)';
}

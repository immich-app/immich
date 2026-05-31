// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetMediaResponseDto {
  const AssetMediaResponseDto({required this.id, required this.status});

  /// Asset media ID
  final String id;

  final AssetMediaStatus status;

  static AssetMediaResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetMediaResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(id: json[r'id'] as String, status: (AssetMediaStatus.fromJson(json[r'status']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'id'] = id;
    json[r'status'] = status.toJson();
    return json;
  }

  AssetMediaResponseDto copyWith({String? id, AssetMediaStatus? status}) {
    return .new(id: id ?? this.id, status: status ?? this.status);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is AssetMediaResponseDto && id == other.id && status == other.status);
  }

  @override
  int get hashCode {
    return Object.hashAll([id, status]);
  }

  @override
  String toString() => 'AssetMediaResponseDto(id=$id, status=$status)';
}

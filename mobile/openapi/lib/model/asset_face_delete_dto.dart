// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetFaceDeleteDto {
  const AssetFaceDeleteDto({required this.force});

  /// Force delete even if person has other faces
  final bool force;

  static AssetFaceDeleteDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetFaceDeleteDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(force: json[r'force'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'force'] = force;
    return json;
  }

  AssetFaceDeleteDto copyWith({bool? force}) {
    return .new(force: force ?? this.force);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is AssetFaceDeleteDto && force == other.force);
  }

  @override
  int get hashCode {
    return Object.hashAll([force]);
  }

  @override
  String toString() => 'AssetFaceDeleteDto(force=$force)';
}

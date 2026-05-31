// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetEditsCreateDto {
  const AssetEditsCreateDto({required this.edits});

  /// List of edit actions to apply (crop, rotate, or mirror)
  final List<AssetEditActionItemDto> edits;

  static AssetEditsCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetEditsCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      edits: ((json[r'edits'] as List?)?.map(($e) => (AssetEditActionItemDto.fromJson($e))!).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'edits'] = edits.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  AssetEditsCreateDto copyWith({List<AssetEditActionItemDto>? edits}) {
    return .new(edits: edits ?? this.edits);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetEditsCreateDto && const DeepCollectionEquality().equals(edits, other.edits));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(edits)]);
  }

  @override
  String toString() => 'AssetEditsCreateDto(edits=$edits)';
}

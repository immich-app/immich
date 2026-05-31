// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetEditsResponseDto {
  const AssetEditsResponseDto({required this.assetId, required this.edits});

  /// Asset ID these edits belong to
  final String assetId;

  /// List of edit actions applied to the asset
  final List<AssetEditActionItemResponseDto> edits;

  static AssetEditsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetEditsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetId: json[r'assetId'] as String,
      edits: ((json[r'edits'] as List?)
          ?.map(($e) => (AssetEditActionItemResponseDto.fromJson($e))!)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    json[r'edits'] = edits.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  AssetEditsResponseDto copyWith({String? assetId, List<AssetEditActionItemResponseDto>? edits}) {
    return .new(assetId: assetId ?? this.assetId, edits: edits ?? this.edits);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetEditsResponseDto &&
            assetId == other.assetId &&
            const DeepCollectionEquality().equals(edits, other.edits));
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, const DeepCollectionEquality().hash(edits)]);
  }

  @override
  String toString() => 'AssetEditsResponseDto(assetId=$assetId, edits=$edits)';
}

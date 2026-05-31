// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class StackUpdateDto {
  const StackUpdateDto({this.primaryAssetId = const Optional.absent()});

  /// Primary asset ID
  final Optional<String> primaryAssetId;

  static StackUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<StackUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      primaryAssetId: json.containsKey(r'primaryAssetId')
          ? Optional.present(json[r'primaryAssetId'] as String)
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (primaryAssetId case Present(:final value)) {
      json[r'primaryAssetId'] = value;
    }
    return json;
  }

  StackUpdateDto copyWith({Optional<String>? primaryAssetId}) {
    return .new(primaryAssetId: primaryAssetId ?? this.primaryAssetId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is StackUpdateDto && primaryAssetId == other.primaryAssetId);
  }

  @override
  int get hashCode {
    return Object.hashAll([primaryAssetId]);
  }

  @override
  String toString() => 'StackUpdateDto(primaryAssetId=$primaryAssetId)';
}

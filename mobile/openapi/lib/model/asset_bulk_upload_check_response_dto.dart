// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetBulkUploadCheckResponseDto {
  const AssetBulkUploadCheckResponseDto({required this.results});

  /// Upload check results
  final List<AssetBulkUploadCheckResult> results;

  static AssetBulkUploadCheckResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetBulkUploadCheckResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      results: ((json[r'results'] as List?)
          ?.map(($e) => (AssetBulkUploadCheckResult.fromJson($e))!)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'results'] = results.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  AssetBulkUploadCheckResponseDto copyWith({List<AssetBulkUploadCheckResult>? results}) {
    return .new(results: results ?? this.results);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetBulkUploadCheckResponseDto && const DeepCollectionEquality().equals(results, other.results));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(results)]);
  }

  @override
  String toString() => 'AssetBulkUploadCheckResponseDto(results=$results)';
}

import 'package:collection/collection.dart';
import 'package:openapi/api.dart';

class BulkUploadCheckResponse {
  final List<String> toBeUploaded;
  final List<String> duplicates;

  const BulkUploadCheckResponse({
    required this.toBeUploaded,
    required this.duplicates,
  });

  BulkUploadCheckResponse copyWith({
    List<String>? toBeUploaded,
    List<String>? duplicates,
  }) {
    return BulkUploadCheckResponse(
      toBeUploaded: toBeUploaded ?? this.toBeUploaded,
      duplicates: duplicates ?? this.duplicates,
    );
  }

  static BulkUploadCheckResponse fromDto(AssetBulkUploadCheckResponseDto dto) {
    final duplicates = <String>[];
    final toBeUploaded = <String>[];
    for (final result in dto.results) {
      if (result.action == AssetBulkUploadCheckResultActionEnum.accept) {
        toBeUploaded.add(result.id);
      } else if (result.action == AssetBulkUploadCheckResultActionEnum.reject &&
          result.reason == AssetBulkUploadCheckResultReasonEnum.duplicate) {
        duplicates.add(result.id);
      }
    }
    return BulkUploadCheckResponse(
      toBeUploaded: toBeUploaded.toList(),
      duplicates: duplicates.toList(),
    );
  }

  @override
  String toString() =>
      'BulkUploadCheckResponse(toBeUploaded: $toBeUploaded, duplicates: $duplicates)';

  @override
  bool operator ==(covariant BulkUploadCheckResponse other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.toBeUploaded, toBeUploaded) &&
        listEquals(other.duplicates, duplicates);
  }

  @override
  int get hashCode => toBeUploaded.hashCode ^ duplicates.hashCode;
}

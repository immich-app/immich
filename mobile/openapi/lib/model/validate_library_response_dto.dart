// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ValidateLibraryResponseDto {
  const ValidateLibraryResponseDto({this.importPaths});

  /// Validation results for import paths
  final List<ValidateLibraryImportPathResponseDto>? importPaths;

  static const _undefined = Object();

  static ValidateLibraryResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ValidateLibraryResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      importPaths: (json[r'importPaths'] as List?)
          ?.map(($e) => (ValidateLibraryImportPathResponseDto.fromJson($e))!)
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (importPaths != null) {
      json[r'importPaths'] = importPaths!.map(($e) => $e.toJson()).toList(growable: false);
    }
    return json;
  }

  ValidateLibraryResponseDto copyWith({Object? importPaths = _undefined}) {
    return .new(
      importPaths: identical(importPaths, _undefined)
          ? this.importPaths
          : importPaths as List<ValidateLibraryImportPathResponseDto>?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ValidateLibraryResponseDto && const DeepCollectionEquality().equals(importPaths, other.importPaths));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(importPaths)]);
  }

  @override
  String toString() => 'ValidateLibraryResponseDto(importPaths=$importPaths)';
}

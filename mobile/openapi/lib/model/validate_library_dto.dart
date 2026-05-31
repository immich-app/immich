// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ValidateLibraryDto {
  const ValidateLibraryDto({
    this.exclusionPatterns = const Optional.absent(),
    this.importPaths = const Optional.absent(),
  });

  /// Exclusion patterns (max 128)
  final Optional<List<String>> exclusionPatterns;

  /// Import paths to validate (max 128)
  final Optional<List<String>> importPaths;

  static ValidateLibraryDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ValidateLibraryDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      exclusionPatterns: json.containsKey(r'exclusionPatterns')
          ? Optional.present(
              ((json[r'exclusionPatterns'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
            )
          : const Optional.absent(),
      importPaths: json.containsKey(r'importPaths')
          ? Optional.present(((json[r'importPaths'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (exclusionPatterns case Present(:final value)) {
      json[r'exclusionPatterns'] = value;
    }
    if (importPaths case Present(:final value)) {
      json[r'importPaths'] = value;
    }
    return json;
  }

  ValidateLibraryDto copyWith({Optional<List<String>>? exclusionPatterns, Optional<List<String>>? importPaths}) {
    return .new(
      exclusionPatterns: exclusionPatterns ?? this.exclusionPatterns,
      importPaths: importPaths ?? this.importPaths,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ValidateLibraryDto &&
            exclusionPatterns == other.exclusionPatterns &&
            importPaths == other.importPaths);
  }

  @override
  int get hashCode {
    return Object.hashAll([exclusionPatterns, importPaths]);
  }

  @override
  String toString() => 'ValidateLibraryDto(exclusionPatterns=$exclusionPatterns, importPaths=$importPaths)';
}

// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class CreateLibraryDto {
  const CreateLibraryDto({
    this.exclusionPatterns = const Optional.absent(),
    this.importPaths = const Optional.absent(),
    this.name = const Optional.absent(),
    required this.ownerId,
  });

  /// Exclusion patterns (max 128)
  final Optional<List<String>> exclusionPatterns;

  /// Import paths (max 128)
  final Optional<List<String>> importPaths;

  /// Library name
  final Optional<String> name;

  /// Owner user ID
  final String ownerId;

  static CreateLibraryDto? fromJson(dynamic value) {
    ApiCompat.upgrade<CreateLibraryDto>(value);
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
      name: json.containsKey(r'name') ? Optional.present(json[r'name'] as String) : const Optional.absent(),
      ownerId: json[r'ownerId'] as String,
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
    if (name case Present(:final value)) {
      json[r'name'] = value;
    }
    json[r'ownerId'] = ownerId;
    return json;
  }

  CreateLibraryDto copyWith({
    Optional<List<String>>? exclusionPatterns,
    Optional<List<String>>? importPaths,
    Optional<String>? name,
    String? ownerId,
  }) {
    return .new(
      exclusionPatterns: exclusionPatterns ?? this.exclusionPatterns,
      importPaths: importPaths ?? this.importPaths,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is CreateLibraryDto &&
            exclusionPatterns == other.exclusionPatterns &&
            importPaths == other.importPaths &&
            name == other.name &&
            ownerId == other.ownerId);
  }

  @override
  int get hashCode {
    return Object.hashAll([exclusionPatterns, importPaths, name, ownerId]);
  }

  @override
  String toString() =>
      'CreateLibraryDto(exclusionPatterns=$exclusionPatterns, importPaths=$importPaths, name=$name, ownerId=$ownerId)';
}

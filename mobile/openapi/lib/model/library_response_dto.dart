// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class LibraryResponseDto {
  const LibraryResponseDto({
    required this.assetCount,
    required this.createdAt,
    required this.exclusionPatterns,
    required this.id,
    required this.importPaths,
    required this.name,
    required this.ownerId,
    required this.refreshedAt,
    required this.updatedAt,
  });

  /// Number of assets
  final int assetCount;

  /// Creation date
  final DateTime createdAt;

  /// Exclusion patterns
  final List<String> exclusionPatterns;

  /// Library ID
  final String id;

  /// Import paths
  final List<String> importPaths;

  /// Library name
  final String name;

  /// Owner user ID
  final String ownerId;

  /// Last refresh date
  final DateTime? refreshedAt;

  /// Last update date
  final DateTime updatedAt;

  static const _undefined = Object();

  static LibraryResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<LibraryResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetCount: json[r'assetCount'] as int,
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      exclusionPatterns: ((json[r'exclusionPatterns'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      id: json[r'id'] as String,
      importPaths: ((json[r'importPaths'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      name: json[r'name'] as String,
      ownerId: json[r'ownerId'] as String,
      refreshedAt: (json[r'refreshedAt'] == null ? null : DateTime.parse(json[r'refreshedAt'] as String)),
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetCount'] = assetCount;
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'exclusionPatterns'] = exclusionPatterns;
    json[r'id'] = id;
    json[r'importPaths'] = importPaths;
    json[r'name'] = name;
    json[r'ownerId'] = ownerId;
    if (refreshedAt != null) {
      json[r'refreshedAt'] = refreshedAt!.toUtc().toIso8601String();
    }
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    return json;
  }

  LibraryResponseDto copyWith({
    int? assetCount,
    DateTime? createdAt,
    List<String>? exclusionPatterns,
    String? id,
    List<String>? importPaths,
    String? name,
    String? ownerId,
    Object? refreshedAt = _undefined,
    DateTime? updatedAt,
  }) {
    return .new(
      assetCount: assetCount ?? this.assetCount,
      createdAt: createdAt ?? this.createdAt,
      exclusionPatterns: exclusionPatterns ?? this.exclusionPatterns,
      id: id ?? this.id,
      importPaths: importPaths ?? this.importPaths,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      refreshedAt: identical(refreshedAt, _undefined) ? this.refreshedAt : refreshedAt as DateTime?,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is LibraryResponseDto &&
            assetCount == other.assetCount &&
            createdAt == other.createdAt &&
            const DeepCollectionEquality().equals(exclusionPatterns, other.exclusionPatterns) &&
            id == other.id &&
            const DeepCollectionEquality().equals(importPaths, other.importPaths) &&
            name == other.name &&
            ownerId == other.ownerId &&
            refreshedAt == other.refreshedAt &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      assetCount,
      createdAt,
      const DeepCollectionEquality().hash(exclusionPatterns),
      id,
      const DeepCollectionEquality().hash(importPaths),
      name,
      ownerId,
      refreshedAt,
      updatedAt,
    ]);
  }

  @override
  String toString() =>
      'LibraryResponseDto(assetCount=$assetCount, createdAt=$createdAt, exclusionPatterns=$exclusionPatterns, id=$id, importPaths=$importPaths, name=$name, ownerId=$ownerId, refreshedAt=$refreshedAt, updatedAt=$updatedAt)';
}

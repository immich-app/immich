// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetCopyDto {
  const AssetCopyDto({
    this.albums = const Optional.absent(),
    this.favorite = const Optional.absent(),
    this.sharedLinks = const Optional.absent(),
    this.sidecar = const Optional.absent(),
    required this.sourceId,
    this.stack = const Optional.absent(),
    required this.targetId,
  });

  /// Copy album associations
  final Optional<bool> albums;

  /// Copy favorite status
  final Optional<bool> favorite;

  /// Copy shared links
  final Optional<bool> sharedLinks;

  /// Copy sidecar file
  final Optional<bool> sidecar;

  /// Source asset ID
  final String sourceId;

  /// Copy stack association
  final Optional<bool> stack;

  /// Target asset ID
  final String targetId;

  static AssetCopyDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetCopyDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albums: json.containsKey(r'albums') ? Optional.present(json[r'albums'] as bool) : const Optional.absent(),
      favorite: json.containsKey(r'favorite') ? Optional.present(json[r'favorite'] as bool) : const Optional.absent(),
      sharedLinks: json.containsKey(r'sharedLinks')
          ? Optional.present(json[r'sharedLinks'] as bool)
          : const Optional.absent(),
      sidecar: json.containsKey(r'sidecar') ? Optional.present(json[r'sidecar'] as bool) : const Optional.absent(),
      sourceId: json[r'sourceId'] as String,
      stack: json.containsKey(r'stack') ? Optional.present(json[r'stack'] as bool) : const Optional.absent(),
      targetId: json[r'targetId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (albums case Present(:final value)) {
      json[r'albums'] = value;
    }
    if (favorite case Present(:final value)) {
      json[r'favorite'] = value;
    }
    if (sharedLinks case Present(:final value)) {
      json[r'sharedLinks'] = value;
    }
    if (sidecar case Present(:final value)) {
      json[r'sidecar'] = value;
    }
    json[r'sourceId'] = sourceId;
    if (stack case Present(:final value)) {
      json[r'stack'] = value;
    }
    json[r'targetId'] = targetId;
    return json;
  }

  AssetCopyDto copyWith({
    Optional<bool>? albums,
    Optional<bool>? favorite,
    Optional<bool>? sharedLinks,
    Optional<bool>? sidecar,
    String? sourceId,
    Optional<bool>? stack,
    String? targetId,
  }) {
    return .new(
      albums: albums ?? this.albums,
      favorite: favorite ?? this.favorite,
      sharedLinks: sharedLinks ?? this.sharedLinks,
      sidecar: sidecar ?? this.sidecar,
      sourceId: sourceId ?? this.sourceId,
      stack: stack ?? this.stack,
      targetId: targetId ?? this.targetId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetCopyDto &&
            albums == other.albums &&
            favorite == other.favorite &&
            sharedLinks == other.sharedLinks &&
            sidecar == other.sidecar &&
            sourceId == other.sourceId &&
            stack == other.stack &&
            targetId == other.targetId);
  }

  @override
  int get hashCode {
    return Object.hashAll([albums, favorite, sharedLinks, sidecar, sourceId, stack, targetId]);
  }

  @override
  String toString() =>
      'AssetCopyDto(albums=$albums, favorite=$favorite, sharedLinks=$sharedLinks, sidecar=$sidecar, sourceId=$sourceId, stack=$stack, targetId=$targetId)';
}

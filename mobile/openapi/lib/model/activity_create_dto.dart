// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Activity create
final class ActivityCreateDto {
  const ActivityCreateDto({
    required this.albumId,
    this.assetId = const Optional.absent(),
    this.comment = const Optional.absent(),
    required this.type,
  });

  /// Album ID
  final String albumId;

  /// Asset ID (if activity is for an asset)
  final Optional<String> assetId;

  /// Comment text (required if type is comment)
  final Optional<String> comment;

  final ReactionType type;

  static ActivityCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ActivityCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumId: json[r'albumId'] as String,
      assetId: json.containsKey(r'assetId') ? Optional.present(json[r'assetId'] as String) : const Optional.absent(),
      comment: json.containsKey(r'comment') ? Optional.present(json[r'comment'] as String) : const Optional.absent(),
      type: (ReactionType.fromJson(json[r'type']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumId'] = albumId;
    if (assetId case Present(:final value)) {
      json[r'assetId'] = value;
    }
    if (comment case Present(:final value)) {
      json[r'comment'] = value;
    }
    json[r'type'] = type.toJson();
    return json;
  }

  ActivityCreateDto copyWith({
    String? albumId,
    Optional<String>? assetId,
    Optional<String>? comment,
    ReactionType? type,
  }) {
    return .new(
      albumId: albumId ?? this.albumId,
      assetId: assetId ?? this.assetId,
      comment: comment ?? this.comment,
      type: type ?? this.type,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ActivityCreateDto &&
            albumId == other.albumId &&
            assetId == other.assetId &&
            comment == other.comment &&
            type == other.type);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumId, assetId, comment, type]);
  }

  @override
  String toString() => 'ActivityCreateDto(albumId=$albumId, assetId=$assetId, comment=$comment, type=$type)';
}

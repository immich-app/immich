// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MemoryResponseDto {
  const MemoryResponseDto({
    required this.assets,
    required this.createdAt,
    required this.data,
    this.deletedAt,
    this.hideAt,
    required this.id,
    required this.isSaved,
    required this.memoryAt,
    required this.ownerId,
    this.seenAt,
    this.showAt,
    required this.type,
    required this.updatedAt,
  });

  final List<AssetResponseDto> assets;

  /// Creation date
  final DateTime createdAt;

  final OnThisDayDto data;

  /// Deletion date
  final DateTime? deletedAt;

  /// Date when memory should be hidden
  final DateTime? hideAt;

  /// Memory ID
  final String id;

  /// Is memory saved
  final bool isSaved;

  /// Memory date
  final DateTime memoryAt;

  /// Owner user ID
  final String ownerId;

  /// Date when memory was seen
  final DateTime? seenAt;

  /// Date when memory should be shown
  final DateTime? showAt;

  final MemoryType type;

  /// Last update date
  final DateTime updatedAt;

  static const _undefined = Object();

  static MemoryResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MemoryResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assets: ((json[r'assets'] as List?)?.map(($e) => (AssetResponseDto.fromJson($e))!).toList(growable: false))!,
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      data: (OnThisDayDto.fromJson(json[r'data']))!,
      deletedAt: (json[r'deletedAt'] == null ? null : DateTime.parse(json[r'deletedAt'] as String)),
      hideAt: (json[r'hideAt'] == null ? null : DateTime.parse(json[r'hideAt'] as String)),
      id: json[r'id'] as String,
      isSaved: json[r'isSaved'] as bool,
      memoryAt: DateTime.parse(json[r'memoryAt'] as String),
      ownerId: json[r'ownerId'] as String,
      seenAt: (json[r'seenAt'] == null ? null : DateTime.parse(json[r'seenAt'] as String)),
      showAt: (json[r'showAt'] == null ? null : DateTime.parse(json[r'showAt'] as String)),
      type: (MemoryType.fromJson(json[r'type']))!,
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assets'] = assets.map(($e) => $e.toJson()).toList(growable: false);
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'data'] = data.toJson();
    if (deletedAt != null) {
      json[r'deletedAt'] = deletedAt!.toUtc().toIso8601String();
    }
    if (hideAt != null) {
      json[r'hideAt'] = hideAt!.toUtc().toIso8601String();
    }
    json[r'id'] = id;
    json[r'isSaved'] = isSaved;
    json[r'memoryAt'] = memoryAt.toUtc().toIso8601String();
    json[r'ownerId'] = ownerId;
    if (seenAt != null) {
      json[r'seenAt'] = seenAt!.toUtc().toIso8601String();
    }
    if (showAt != null) {
      json[r'showAt'] = showAt!.toUtc().toIso8601String();
    }
    json[r'type'] = type.toJson();
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    return json;
  }

  MemoryResponseDto copyWith({
    List<AssetResponseDto>? assets,
    DateTime? createdAt,
    OnThisDayDto? data,
    Object? deletedAt = _undefined,
    Object? hideAt = _undefined,
    String? id,
    bool? isSaved,
    DateTime? memoryAt,
    String? ownerId,
    Object? seenAt = _undefined,
    Object? showAt = _undefined,
    MemoryType? type,
    DateTime? updatedAt,
  }) {
    return .new(
      assets: assets ?? this.assets,
      createdAt: createdAt ?? this.createdAt,
      data: data ?? this.data,
      deletedAt: identical(deletedAt, _undefined) ? this.deletedAt : deletedAt as DateTime?,
      hideAt: identical(hideAt, _undefined) ? this.hideAt : hideAt as DateTime?,
      id: id ?? this.id,
      isSaved: isSaved ?? this.isSaved,
      memoryAt: memoryAt ?? this.memoryAt,
      ownerId: ownerId ?? this.ownerId,
      seenAt: identical(seenAt, _undefined) ? this.seenAt : seenAt as DateTime?,
      showAt: identical(showAt, _undefined) ? this.showAt : showAt as DateTime?,
      type: type ?? this.type,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MemoryResponseDto &&
            const DeepCollectionEquality().equals(assets, other.assets) &&
            createdAt == other.createdAt &&
            data == other.data &&
            deletedAt == other.deletedAt &&
            hideAt == other.hideAt &&
            id == other.id &&
            isSaved == other.isSaved &&
            memoryAt == other.memoryAt &&
            ownerId == other.ownerId &&
            seenAt == other.seenAt &&
            showAt == other.showAt &&
            type == other.type &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      const DeepCollectionEquality().hash(assets),
      createdAt,
      data,
      deletedAt,
      hideAt,
      id,
      isSaved,
      memoryAt,
      ownerId,
      seenAt,
      showAt,
      type,
      updatedAt,
    ]);
  }

  @override
  String toString() =>
      'MemoryResponseDto(assets=$assets, createdAt=$createdAt, data=$data, deletedAt=$deletedAt, hideAt=$hideAt, id=$id, isSaved=$isSaved, memoryAt=$memoryAt, ownerId=$ownerId, seenAt=$seenAt, showAt=$showAt, type=$type, updatedAt=$updatedAt)';
}

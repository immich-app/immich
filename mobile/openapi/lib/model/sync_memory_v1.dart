// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncMemoryV1 {
  const SyncMemoryV1({
    required this.createdAt,
    required this.data,
    required this.deletedAt,
    required this.hideAt,
    required this.id,
    required this.isSaved,
    required this.memoryAt,
    required this.ownerId,
    required this.seenAt,
    required this.showAt,
    required this.type,
    required this.updatedAt,
  });

  /// Created at
  final DateTime createdAt;

  /// Data
  final Map<String, dynamic> data;

  /// Deleted at
  final DateTime? deletedAt;

  /// Hide at
  final DateTime? hideAt;

  /// Memory ID
  final String id;

  /// Is saved
  final bool isSaved;

  /// Memory at
  final DateTime memoryAt;

  /// Owner ID
  final String ownerId;

  /// Seen at
  final DateTime? seenAt;

  /// Show at
  final DateTime? showAt;

  final MemoryType type;

  /// Updated at
  final DateTime updatedAt;

  static const _undefined = Object();

  static SyncMemoryV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncMemoryV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      data: ((json[r'data'] as Map?)?.cast<String, dynamic>())!,
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
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'data'] = data;
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

  SyncMemoryV1 copyWith({
    DateTime? createdAt,
    Map<String, dynamic>? data,
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
        (other is SyncMemoryV1 &&
            createdAt == other.createdAt &&
            const DeepCollectionEquality().equals(data, other.data) &&
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
      createdAt,
      const DeepCollectionEquality().hash(data),
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
      'SyncMemoryV1(createdAt=$createdAt, data=$data, deletedAt=$deletedAt, hideAt=$hideAt, id=$id, isSaved=$isSaved, memoryAt=$memoryAt, ownerId=$ownerId, seenAt=$seenAt, showAt=$showAt, type=$type, updatedAt=$updatedAt)';
}

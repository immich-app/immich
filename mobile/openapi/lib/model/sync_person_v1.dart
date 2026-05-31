// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncPersonV1 {
  const SyncPersonV1({
    required this.birthDate,
    required this.color,
    required this.createdAt,
    required this.faceAssetId,
    required this.id,
    required this.isFavorite,
    required this.isHidden,
    required this.name,
    required this.ownerId,
    required this.updatedAt,
  });

  /// Birth date
  final DateTime? birthDate;

  /// Color
  final String? color;

  /// Created at
  final DateTime createdAt;

  /// Face asset ID
  final String? faceAssetId;

  /// Person ID
  final String id;

  /// Is favorite
  final bool isFavorite;

  /// Is hidden
  final bool isHidden;

  /// Person name
  final String name;

  /// Owner ID
  final String ownerId;

  /// Updated at
  final DateTime updatedAt;

  static const _undefined = Object();

  static SyncPersonV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncPersonV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      birthDate: (json[r'birthDate'] == null ? null : DateTime.parse(json[r'birthDate'] as String)),
      color: (json[r'color'] as String?),
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      faceAssetId: (json[r'faceAssetId'] as String?),
      id: json[r'id'] as String,
      isFavorite: json[r'isFavorite'] as bool,
      isHidden: json[r'isHidden'] as bool,
      name: json[r'name'] as String,
      ownerId: json[r'ownerId'] as String,
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (birthDate != null) {
      json[r'birthDate'] = birthDate!.toUtc().toIso8601String();
    }
    if (color != null) {
      json[r'color'] = color!;
    }
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    if (faceAssetId != null) {
      json[r'faceAssetId'] = faceAssetId!;
    }
    json[r'id'] = id;
    json[r'isFavorite'] = isFavorite;
    json[r'isHidden'] = isHidden;
    json[r'name'] = name;
    json[r'ownerId'] = ownerId;
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    return json;
  }

  SyncPersonV1 copyWith({
    Object? birthDate = _undefined,
    Object? color = _undefined,
    DateTime? createdAt,
    Object? faceAssetId = _undefined,
    String? id,
    bool? isFavorite,
    bool? isHidden,
    String? name,
    String? ownerId,
    DateTime? updatedAt,
  }) {
    return .new(
      birthDate: identical(birthDate, _undefined) ? this.birthDate : birthDate as DateTime?,
      color: identical(color, _undefined) ? this.color : color as String?,
      createdAt: createdAt ?? this.createdAt,
      faceAssetId: identical(faceAssetId, _undefined) ? this.faceAssetId : faceAssetId as String?,
      id: id ?? this.id,
      isFavorite: isFavorite ?? this.isFavorite,
      isHidden: isHidden ?? this.isHidden,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncPersonV1 &&
            birthDate == other.birthDate &&
            color == other.color &&
            createdAt == other.createdAt &&
            faceAssetId == other.faceAssetId &&
            id == other.id &&
            isFavorite == other.isFavorite &&
            isHidden == other.isHidden &&
            name == other.name &&
            ownerId == other.ownerId &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      birthDate,
      color,
      createdAt,
      faceAssetId,
      id,
      isFavorite,
      isHidden,
      name,
      ownerId,
      updatedAt,
    ]);
  }

  @override
  String toString() =>
      'SyncPersonV1(birthDate=$birthDate, color=$color, createdAt=$createdAt, faceAssetId=$faceAssetId, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, name=$name, ownerId=$ownerId, updatedAt=$updatedAt)';
}

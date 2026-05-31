// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PersonResponseDto {
  const PersonResponseDto({
    required this.birthDate,
    this.color,
    required this.id,
    this.isFavorite,
    required this.isHidden,
    required this.name,
    required this.thumbnailPath,
    this.updatedAt,
  });

  /// Person date of birth
  final DateTime? birthDate;

  /// Person color (hex)
  /// Available since server v1.126.0.
  final String? color;

  /// Person ID
  final String id;

  /// Is favorite
  /// Available since server v1.126.0.
  final bool? isFavorite;

  /// Is hidden
  final bool isHidden;

  /// Person name
  final String name;

  /// Thumbnail path
  final String thumbnailPath;

  /// Last update date
  /// Available since server v1.107.0.
  final DateTime? updatedAt;

  static const _undefined = Object();

  static const ApiVersion colorAddedIn = .new(1, 126, 0);

  static const ApiState colorState = .stable;

  static const ApiVersion isFavoriteAddedIn = .new(1, 126, 0);

  static const ApiState isFavoriteState = .stable;

  static const ApiVersion updatedAtAddedIn = .new(1, 107, 0);

  static const ApiState updatedAtState = .stable;

  static PersonResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PersonResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      birthDate: (json[r'birthDate'] == null ? null : DateTime.parse(json[r'birthDate'] as String)),
      color: (json[r'color'] as String?),
      id: json[r'id'] as String,
      isFavorite: (json[r'isFavorite'] as bool?),
      isHidden: json[r'isHidden'] as bool,
      name: json[r'name'] as String,
      thumbnailPath: json[r'thumbnailPath'] as String,
      updatedAt: (json[r'updatedAt'] == null ? null : DateTime.parse(json[r'updatedAt'] as String)),
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
    json[r'id'] = id;
    if (isFavorite != null) {
      json[r'isFavorite'] = isFavorite!;
    }
    json[r'isHidden'] = isHidden;
    json[r'name'] = name;
    json[r'thumbnailPath'] = thumbnailPath;
    if (updatedAt != null) {
      json[r'updatedAt'] = updatedAt!.toUtc().toIso8601String();
    }
    return json;
  }

  PersonResponseDto copyWith({
    Object? birthDate = _undefined,
    Object? color = _undefined,
    String? id,
    Object? isFavorite = _undefined,
    bool? isHidden,
    String? name,
    String? thumbnailPath,
    Object? updatedAt = _undefined,
  }) {
    return .new(
      birthDate: identical(birthDate, _undefined) ? this.birthDate : birthDate as DateTime?,
      color: identical(color, _undefined) ? this.color : color as String?,
      id: id ?? this.id,
      isFavorite: identical(isFavorite, _undefined) ? this.isFavorite : isFavorite as bool?,
      isHidden: isHidden ?? this.isHidden,
      name: name ?? this.name,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
      updatedAt: identical(updatedAt, _undefined) ? this.updatedAt : updatedAt as DateTime?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PersonResponseDto &&
            birthDate == other.birthDate &&
            color == other.color &&
            id == other.id &&
            isFavorite == other.isFavorite &&
            isHidden == other.isHidden &&
            name == other.name &&
            thumbnailPath == other.thumbnailPath &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([birthDate, color, id, isFavorite, isHidden, name, thumbnailPath, updatedAt]);
  }

  @override
  String toString() =>
      'PersonResponseDto(birthDate=$birthDate, color=$color, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, name=$name, thumbnailPath=$thumbnailPath, updatedAt=$updatedAt)';
}

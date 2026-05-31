// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PersonCreateDto {
  const PersonCreateDto({
    this.birthDate = const Optional.absent(),
    this.color = const Optional.absent(),
    this.isFavorite = const Optional.absent(),
    this.isHidden = const Optional.absent(),
    this.name = const Optional.absent(),
  });

  /// Person date of birth
  final Optional<DateTime?> birthDate;

  /// Person color (hex)
  final Optional<String?> color;

  /// Mark as favorite
  final Optional<bool> isFavorite;

  /// Person visibility (hidden)
  final Optional<bool> isHidden;

  /// Person name
  final Optional<String> name;

  static PersonCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PersonCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      birthDate: json.containsKey(r'birthDate')
          ? Optional.present((json[r'birthDate'] == null ? null : DateTime.parse(json[r'birthDate'] as String)))
          : const Optional.absent(),
      color: json.containsKey(r'color') ? Optional.present((json[r'color'] as String?)) : const Optional.absent(),
      isFavorite: json.containsKey(r'isFavorite')
          ? Optional.present(json[r'isFavorite'] as bool)
          : const Optional.absent(),
      isHidden: json.containsKey(r'isHidden') ? Optional.present(json[r'isHidden'] as bool) : const Optional.absent(),
      name: json.containsKey(r'name') ? Optional.present(json[r'name'] as String) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (birthDate case Present(:final value)) {
      json[r'birthDate'] = value?.toUtc().toIso8601String();
    }
    if (color case Present(:final value)) {
      json[r'color'] = value;
    }
    if (isFavorite case Present(:final value)) {
      json[r'isFavorite'] = value;
    }
    if (isHidden case Present(:final value)) {
      json[r'isHidden'] = value;
    }
    if (name case Present(:final value)) {
      json[r'name'] = value;
    }
    return json;
  }

  PersonCreateDto copyWith({
    Optional<DateTime?>? birthDate,
    Optional<String?>? color,
    Optional<bool>? isFavorite,
    Optional<bool>? isHidden,
    Optional<String>? name,
  }) {
    return .new(
      birthDate: birthDate ?? this.birthDate,
      color: color ?? this.color,
      isFavorite: isFavorite ?? this.isFavorite,
      isHidden: isHidden ?? this.isHidden,
      name: name ?? this.name,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PersonCreateDto &&
            birthDate == other.birthDate &&
            color == other.color &&
            isFavorite == other.isFavorite &&
            isHidden == other.isHidden &&
            name == other.name);
  }

  @override
  int get hashCode {
    return Object.hashAll([birthDate, color, isFavorite, isHidden, name]);
  }

  @override
  String toString() =>
      'PersonCreateDto(birthDate=$birthDate, color=$color, isFavorite=$isFavorite, isHidden=$isHidden, name=$name)';
}

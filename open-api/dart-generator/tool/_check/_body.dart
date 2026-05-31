/// Asset type
enum AssetTypeEnum {
  image._(r'IMAGE'),
  video._(r'VIDEO'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const AssetTypeEnum._(this.value);

  final String value;

  static AssetTypeEnum? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

enum PriorityEnum {
  low._(1),
  high._(2);

  const PriorityEnum._(this.value);

  final int value;

  static PriorityEnum? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return null;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}

/// A sample.
final class SampleDto {
  const SampleDto({
    required this.id,
    required this.note,
    this.count = 0,
    this.maybe,
    required this.ratio,
    required this.tags,
    this.ids,
    this.when,
    this.role = AlbumUserRole.editor,
    this.parameters,
    this.additionalProperties,
  });

  final String id;

  final String? note;

  final int count;

  final bool? maybe;

  final double ratio;

  final List<String> tags;

  final Set<String?>? ids;

  final DateTime? when;

  final AlbumUserRole role;

  final Map<String, dynamic>? parameters;

  /// Additional, schema-free properties.
  final Map<String, dynamic>? additionalProperties;

  static const _undefined = Object();

  static SampleDto? fromJson(dynamic value) {
    upgradeDto(value, r'SampleDto');
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return SampleDto(
      id: (json[r'id'] as String?)!,
      note: (json[r'note'] as String?),
      count: (json[r'count'] as int?) ?? 0,
      maybe: (json[r'maybe'] as bool?),
      ratio: ((json[r'ratio'] as num?)?.toDouble())!,
      tags: ((json[r'tags'] as List?)?.map(($e) => ($e as String?)!).toList(growable: false))!,
      ids: (json[r'ids'] as List?)?.map(($e) => ($e as String?)).toSet(),
      when: (json[r'when'] == null ? null : DateTime.parse(json[r'when'] as String)),
      role: AlbumUserRole.fromJson(json[r'role']) ?? AlbumUserRole.fromJson(r'editor')!,
      parameters: (json[r'parameters'] as Map?)?.cast<String, dynamic>(),
      additionalProperties: json.cast<String, dynamic>(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'id'] = id;
    if (note != null) {
      json[r'note'] = note!;
    }
    json[r'count'] = count;
    if (maybe != null) {
      json[r'maybe'] = maybe!;
    }
    json[r'ratio'] = ratio;
    json[r'tags'] = tags;
    if (ids != null) {
      json[r'ids'] = ids!.toList(growable: false);
    }
    if (when != null) {
      json[r'when'] = when!.toUtc().toIso8601String();
    }
    json[r'role'] = role.toJson();
    if (parameters != null) {
      json[r'parameters'] = parameters;
    }
    if (additionalProperties != null) json.addAll(additionalProperties!);
    return json;
  }

  SampleDto copyWith({
    String? id,
    Object? note = _undefined,
    int? count,
    Object? maybe = _undefined,
    double? ratio,
    List<String>? tags,
    Object? ids = _undefined,
    Object? when = _undefined,
    AlbumUserRole? role,
    Object? parameters = _undefined,
    Object? additionalProperties = _undefined,
  }) {
    return SampleDto(
      id: id ?? this.id,
      note: identical(note, _undefined) ? this.note : note as String?,
      count: count ?? this.count,
      maybe: identical(maybe, _undefined) ? this.maybe : maybe as bool?,
      ratio: ratio ?? this.ratio,
      tags: tags ?? this.tags,
      ids: identical(ids, _undefined) ? this.ids : ids as Set<String?>?,
      when: identical(when, _undefined) ? this.when : when as DateTime?,
      role: role ?? this.role,
      parameters: identical(parameters, _undefined) ? this.parameters : parameters as Map<String, dynamic>?,
      additionalProperties: identical(additionalProperties, _undefined)
          ? this.additionalProperties
          : additionalProperties as Map<String, dynamic>?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SampleDto &&
            id == other.id &&
            note == other.note &&
            count == other.count &&
            maybe == other.maybe &&
            ratio == other.ratio &&
            const DeepCollectionEquality().equals(tags, other.tags) &&
            const DeepCollectionEquality().equals(ids, other.ids) &&
            when == other.when &&
            role == other.role &&
            parameters == other.parameters &&
            const DeepCollectionEquality().equals(additionalProperties, other.additionalProperties));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      id,
      note,
      count,
      maybe,
      ratio,
      const DeepCollectionEquality().hash(tags),
      const DeepCollectionEquality().hash(ids),
      when,
      role,
      parameters,
      const DeepCollectionEquality().hash(additionalProperties),
    ]);
  }

  @override
  String toString() =>
      'SampleDto(id=$id, note=$note, count=$count, maybe=$maybe, ratio=$ratio, tags=$tags, ids=$ids, when=$when, role=$role, parameters=$parameters, additionalProperties=$additionalProperties)';
}

final class EmptyDto {
  const EmptyDto();

  static EmptyDto? fromJson(dynamic value) {
    upgradeDto(value, r'EmptyDto');
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return EmptyDto();
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    return json;
  }

  EmptyDto copyWith() {
    return EmptyDto();
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is EmptyDto);
  }

  @override
  int get hashCode {
    return runtimeType.hashCode;
  }

  @override
  String toString() => 'EmptyDto()';
}

final class PairDto {
  const PairDto({required this.a, required this.b});

  final String a;

  final int b;

  static PairDto? fromJson(dynamic value) {
    upgradeDto(value, r'PairDto');
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return PairDto(a: (json[r'a'] as String?)!, b: (json[r'b'] as int?)!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'a'] = a;
    json[r'b'] = b;
    return json;
  }

  PairDto copyWith({String? a, int? b}) {
    return PairDto(a: a ?? this.a, b: b ?? this.b);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is PairDto && a == other.a && b == other.b);
  }

  @override
  int get hashCode {
    return Object.hashAll([a, b]);
  }

  @override
  String toString() => 'PairDto(a=$a, b=$b)';
}

final class ConfigDto {
  const ConfigDto({required this.name, this.additionalProperties});

  final String name;

  /// Additional, schema-free properties.
  final Map<String, int>? additionalProperties;

  static const _undefined = Object();

  static ConfigDto? fromJson(dynamic value) {
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return ConfigDto(
      name: (json[r'name'] as String?)!,
      additionalProperties: (json as Map?)?.map((k, $v) => MapEntry(k as String, ($v as int?)!)),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'name'] = name;
    if (additionalProperties != null) json.addAll(additionalProperties!);
    return json;
  }

  ConfigDto copyWith({String? name, Object? additionalProperties = _undefined}) {
    return ConfigDto(
      name: name ?? this.name,
      additionalProperties: identical(additionalProperties, _undefined)
          ? this.additionalProperties
          : additionalProperties as Map<String, int>?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ConfigDto &&
            name == other.name &&
            const DeepCollectionEquality().equals(additionalProperties, other.additionalProperties));
  }

  @override
  int get hashCode {
    return Object.hashAll([name, const DeepCollectionEquality().hash(additionalProperties)]);
  }

  @override
  String toString() => 'ConfigDto(name=$name, additionalProperties=$additionalProperties)';
}

typedef LicenseResponseDto = UserLicense;



// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigTemplateStorageOptionDto {
  const SystemConfigTemplateStorageOptionDto({
    required this.dayOptions,
    required this.hourOptions,
    required this.minuteOptions,
    required this.monthOptions,
    required this.presetOptions,
    required this.secondOptions,
    required this.weekOptions,
    required this.yearOptions,
  });

  /// Available day format options for storage template
  final List<String> dayOptions;

  /// Available hour format options for storage template
  final List<String> hourOptions;

  /// Available minute format options for storage template
  final List<String> minuteOptions;

  /// Available month format options for storage template
  final List<String> monthOptions;

  /// Available preset template options
  final List<String> presetOptions;

  /// Available second format options for storage template
  final List<String> secondOptions;

  /// Available week format options for storage template
  final List<String> weekOptions;

  /// Available year format options for storage template
  final List<String> yearOptions;

  static SystemConfigTemplateStorageOptionDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigTemplateStorageOptionDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      dayOptions: ((json[r'dayOptions'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      hourOptions: ((json[r'hourOptions'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      minuteOptions: ((json[r'minuteOptions'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      monthOptions: ((json[r'monthOptions'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      presetOptions: ((json[r'presetOptions'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      secondOptions: ((json[r'secondOptions'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      weekOptions: ((json[r'weekOptions'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      yearOptions: ((json[r'yearOptions'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'dayOptions'] = dayOptions;
    json[r'hourOptions'] = hourOptions;
    json[r'minuteOptions'] = minuteOptions;
    json[r'monthOptions'] = monthOptions;
    json[r'presetOptions'] = presetOptions;
    json[r'secondOptions'] = secondOptions;
    json[r'weekOptions'] = weekOptions;
    json[r'yearOptions'] = yearOptions;
    return json;
  }

  SystemConfigTemplateStorageOptionDto copyWith({
    List<String>? dayOptions,
    List<String>? hourOptions,
    List<String>? minuteOptions,
    List<String>? monthOptions,
    List<String>? presetOptions,
    List<String>? secondOptions,
    List<String>? weekOptions,
    List<String>? yearOptions,
  }) {
    return .new(
      dayOptions: dayOptions ?? this.dayOptions,
      hourOptions: hourOptions ?? this.hourOptions,
      minuteOptions: minuteOptions ?? this.minuteOptions,
      monthOptions: monthOptions ?? this.monthOptions,
      presetOptions: presetOptions ?? this.presetOptions,
      secondOptions: secondOptions ?? this.secondOptions,
      weekOptions: weekOptions ?? this.weekOptions,
      yearOptions: yearOptions ?? this.yearOptions,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigTemplateStorageOptionDto &&
            const DeepCollectionEquality().equals(dayOptions, other.dayOptions) &&
            const DeepCollectionEquality().equals(hourOptions, other.hourOptions) &&
            const DeepCollectionEquality().equals(minuteOptions, other.minuteOptions) &&
            const DeepCollectionEquality().equals(monthOptions, other.monthOptions) &&
            const DeepCollectionEquality().equals(presetOptions, other.presetOptions) &&
            const DeepCollectionEquality().equals(secondOptions, other.secondOptions) &&
            const DeepCollectionEquality().equals(weekOptions, other.weekOptions) &&
            const DeepCollectionEquality().equals(yearOptions, other.yearOptions));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      const DeepCollectionEquality().hash(dayOptions),
      const DeepCollectionEquality().hash(hourOptions),
      const DeepCollectionEquality().hash(minuteOptions),
      const DeepCollectionEquality().hash(monthOptions),
      const DeepCollectionEquality().hash(presetOptions),
      const DeepCollectionEquality().hash(secondOptions),
      const DeepCollectionEquality().hash(weekOptions),
      const DeepCollectionEquality().hash(yearOptions),
    ]);
  }

  @override
  String toString() =>
      'SystemConfigTemplateStorageOptionDto(dayOptions=$dayOptions, hourOptions=$hourOptions, minuteOptions=$minuteOptions, monthOptions=$monthOptions, presetOptions=$presetOptions, secondOptions=$secondOptions, weekOptions=$weekOptions, yearOptions=$yearOptions)';
}

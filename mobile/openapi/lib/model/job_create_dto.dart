// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class JobCreateDto {
  const JobCreateDto({required this.name});

  final ManualJobName name;

  static JobCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<JobCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(name: (ManualJobName.fromJson(json[r'name']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'name'] = name.toJson();
    return json;
  }

  JobCreateDto copyWith({ManualJobName? name}) {
    return .new(name: name ?? this.name);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is JobCreateDto && name == other.name);
  }

  @override
  int get hashCode {
    return Object.hashAll([name]);
  }

  @override
  String toString() => 'JobCreateDto(name=$name)';
}

import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'person.model.freezed.dart';

@freezed
abstract class Person with _$Person {
  const factory Person({required String id, required String name, DateTime? updatedAt, DateTime? birthDate}) = _Person;
}

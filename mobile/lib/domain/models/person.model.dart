// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'person.model.freezed.dart';

@freezed
class const Person({
  required final String id,
  required final String name,
  final DateTime? updatedAt,
  final DateTime? birthDate,
}) with _$Person;

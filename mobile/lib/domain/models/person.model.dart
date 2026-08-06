import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'person.model.freezed.dart';

// TODO: Remove PersonDto once Isar is removed
class PersonDto {
  const PersonDto({
    required this.id,
    this.birthDate,
    required this.isHidden,
    required this.name,
    required this.thumbnailPath,
    this.updatedAt,
  });

  final String id;
  final DateTime? birthDate;
  final bool isHidden;
  final String name;
  final String thumbnailPath;
  final DateTime? updatedAt;

  @override
  String toString() {
    return 'Person(id: $id, birthDate: $birthDate, isHidden: $isHidden, name: $name, thumbnailPath: $thumbnailPath, updatedAt: $updatedAt)';
  }

  PersonDto copyWith({
    String? id,
    DateTime? birthDate,
    bool? isHidden,
    String? name,
    String? thumbnailPath,
    DateTime? updatedAt,
  }) {
    return PersonDto(
      id: id ?? this.id,
      birthDate: birthDate ?? this.birthDate,
      isHidden: isHidden ?? this.isHidden,
      name: name ?? this.name,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'birthDate': birthDate?.millisecondsSinceEpoch,
      'isHidden': isHidden,
      'name': name,
      'thumbnailPath': thumbnailPath,
      'updatedAt': updatedAt?.millisecondsSinceEpoch,
    };
  }

  factory PersonDto.fromMap(Map<String, dynamic> map) {
    return PersonDto(
      id: map['id'] as String,
      birthDate: map['birthDate'] != null ? DateTime.fromMillisecondsSinceEpoch(map['birthDate'] as int) : null,
      isHidden: map['isHidden'] as bool,
      name: map['name'] as String,
      thumbnailPath: map['thumbnailPath'] as String,
      updatedAt: map['updatedAt'] != null ? DateTime.fromMillisecondsSinceEpoch(map['updatedAt'] as int) : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory PersonDto.fromJson(String source) => PersonDto.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  bool operator ==(covariant PersonDto other) {
    if (identical(this, other)) {
      return true;
    }

    return other.id == id &&
        other.birthDate == birthDate &&
        other.isHidden == isHidden &&
        other.name == name &&
        other.thumbnailPath == thumbnailPath &&
        other.updatedAt == updatedAt;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        birthDate.hashCode ^
        isHidden.hashCode ^
        name.hashCode ^
        thumbnailPath.hashCode ^
        updatedAt.hashCode;
  }
}

// Model for a person stored in the server
@freezed
abstract class DriftPerson with _$DriftPerson {
  const factory DriftPerson({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required String ownerId,
    required String name,
    String? faceAssetId,
    required bool isFavorite,
    required bool isHidden,
    required String? color,
    DateTime? birthDate,
  }) = _DriftPerson;
}

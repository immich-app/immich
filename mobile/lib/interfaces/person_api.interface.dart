// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

abstract interface class IPersonApiRepository {
  Future<List<Person>> getAll();
  Future<Person> update(String id, {String? name});
}

class Person {
  Person({
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

  Person copyWith({
    String? id,
    DateTime? birthDate,
    bool? isHidden,
    String? name,
    String? thumbnailPath,
    DateTime? updatedAt,
  }) {
    return Person(
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

  factory Person.fromMap(Map<String, dynamic> map) {
    return Person(
      id: map['id'] as String,
      birthDate: map['birthDate'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['birthDate'] as int)
          : null,
      isHidden: map['isHidden'] as bool,
      name: map['name'] as String,
      thumbnailPath: map['thumbnailPath'] as String,
      updatedAt: map['updatedAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['updatedAt'] as int)
          : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory Person.fromJson(String source) =>
      Person.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  bool operator ==(covariant Person other) {
    if (identical(this, other)) return true;

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

abstract interface class IPersonApiRepository {
  Future<List<Person>> getAll();
  Future<Person> update(String id, {String? name});
}

class Person {
  Person({
    required this.id,
    required this.isHidden,
    required this.name,
    required this.thumbnailPath,
    this.birthDate,
    this.updatedAt,
  });

  final String id;
  final DateTime? birthDate;
  final bool isHidden;
  final String name;
  final String thumbnailPath;
  final DateTime? updatedAt;
}

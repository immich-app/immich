import 'package:openapi/api.dart';

class Tag {
  final String id;
  final String value;

  const Tag({required this.id, required this.value});

  @override
  String toString() {
    return 'Tag(id: $id, value: $value)';
  }

  @override
  bool operator ==(covariant Tag other) {
    if (identical(this, other)) return true;

    return other.id == id && other.value == value;
  }

  @override
  int get hashCode {
    return id.hashCode ^ value.hashCode;
  }

  static Tag fromDto(TagResponseDto dto) {
    return Tag(id: dto.id, value: dto.value);
  }
}

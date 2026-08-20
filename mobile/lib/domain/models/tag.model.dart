import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:openapi/api.dart';

part 'tag.model.freezed.dart';

@freezed
abstract class Tag with _$Tag {
  const factory Tag({required String id, required String value}) = _Tag;

  static Tag fromDto(TagResponseDto dto) {
    return Tag(id: dto.id, value: dto.value);
  }
}

// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:openapi/api.dart';

part 'tag.model.freezed.dart';

@freezed
class const Tag({required final String id, required final String value}) with _$Tag {
  static Tag fromDto(TagResponseDto dto) {
    return Tag(id: dto.id, value: dto.value);
  }
}

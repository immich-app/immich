import 'package:freezed_annotation/freezed_annotation.dart';

part 'tag.model.freezed.dart';

@freezed
abstract class Tag with _$Tag {
  const factory Tag({
    required String id,
    required String value,
    String? parentId,
    String? color,
    @Default(false) bool isPrivate,
  }) = _Tag;
}

extension TagVisibility on Iterable<Tag> {
  bool isEffectivelyPrivate(Tag tag) =>
      tag.isPrivate || any((parent) => parent.isPrivate && tag.value.startsWith('${parent.value}/'));

  List<Tag> get visibleWhenLocked {
    final privatePaths = {
      for (final tag in this)
        if (tag.isPrivate) tag.value,
    };
    return where((tag) {
      if (tag.isPrivate) {
        return false;
      }
      var slash = tag.value.lastIndexOf('/');
      while (slash > 0) {
        if (privatePaths.contains(tag.value.substring(0, slash))) {
          return false;
        }
        slash = tag.value.lastIndexOf('/', slash - 1);
      }
      return true;
    }).toList();
  }
}

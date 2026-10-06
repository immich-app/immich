import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/extensions/object_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';

/// [asset] adds the age at that asset to birthday titles
String getMemoryTitle(Translations t, Memory memory, {RemoteAsset? asset}) => switch (memory.type) {
  MemoryTypeEnum.onThisDay => t.years_ago(years: DateTime.now().year - memory.data.year),
  MemoryTypeEnum.birthday => _getBirthdayTitle(t, memory.data, asset),
};

String _getBirthdayTitle(Translations t, MemoryData data, RemoteAsset? asset) {
  final name = data.personName;
  if (name == null) {
    return t.unknown;
  }

  final age = asset?.let((asset) => asset.createdAt.toLocal().year - data.year);
  if (age == null || age < 1) {
    return t.birthday_memory_title(name: name);
  }

  return t.birthday_memory_title_with_age(name: name, age: age);
}

class MemoryTitle extends StatelessWidget {
  final MemoryTypeEnum type;
  final String title;
  final TextStyle? style;

  const MemoryTitle({super.key, required this.type, required this.title, this.style});

  @override
  Widget build(BuildContext context) {
    if (type != MemoryTypeEnum.birthday) {
      return Text(title, style: style);
    }

    final textStyle = DefaultTextStyle.of(context).style.merge(style);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.cake_rounded, color: textStyle.color, size: 20),
        const SizedBox(height: 4),
        Text(title, style: style, maxLines: 2, overflow: TextOverflow.ellipsis),
      ],
    );
  }
}

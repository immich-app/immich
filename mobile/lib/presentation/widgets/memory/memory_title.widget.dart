import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/extensions/object_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:intl/intl.dart';

/// [asset] adds the age at that asset to birthday titles
String getMemoryTitle(Translations t, Memory memory, {RemoteAsset? asset, bool preferDate = false}) =>
    switch (memory.type) {
      MemoryTypeEnum.onThisDay =>
        preferDate
            ? DateFormat.yMMMMd().format(memory.memoryAt)
            : t.years_ago(years: DateTime.now().year - memory.data.year),
      MemoryTypeEnum.birthday => _getBirthdayTitle(t, memory.data, asset),
    };

String _getBirthdayTitle(Translations t, MemoryData data, RemoteAsset? asset) {
  final name = data.personName;
  if (name == null || name.isEmpty) {
    return t.unknown;
  }

  final age = asset?.let((asset) => asset.createdAt.toLocal().year - data.year);
  if (age == null || age < 1) {
    return t.birthday_memory_title(name: name);
  }

  return t.birthday_memory_title_with_age(name: name, age: age);
}

class MemoryTitle extends StatelessWidget {
  final Memory memory;
  final TextStyle? style;

  /// If true, the title will prefer to display a full date, if that is an option (onThisDay)
  final bool preferDate;

  const MemoryTitle({super.key, required this.memory, this.style, this.preferDate = false});

  @override
  Widget build(BuildContext context) {
    final title = getMemoryTitle(context.t, memory, preferDate: preferDate);
    if (memory.type != MemoryTypeEnum.birthday) {
      return Text(title, style: style);
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.cake_rounded, color: style?.color, size: 20),
        const SizedBox(height: 4),
        Text(title, style: style, maxLines: 2, overflow: TextOverflow.ellipsis),
      ],
    );
  }
}

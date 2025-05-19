import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/widgets/common/dropdown_search_menu.dart';
import 'package:openapi/api.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/timezone.dart';

Future<List<TagResponseDto>?> showTagPicker({
  required BuildContext context,
  List<TagResponseDto>? tags,
}) {
  return showDialog<List<TagResponseDto>?>(
    context: context,
    builder: (context) => _TagPicker(tags: tags),
  );
}

String _getFormattedOffset(int offsetInMilli, tz.Location location) {
  return "${location.name} (${Duration(milliseconds: offsetInMilli).formatAsOffset()})";
}

class _TagPicker extends HookWidget {
  final List<TagResponseDto>? tags;

  const _TagPicker({this.tags});

  @override
  Widget build(BuildContext context) {
    final selectedTags = useState<List<TagResponseDto>>([]);

    void popWithTags() {
      context.pop<List<TagResponseDto>>(selectedTags.value);
    }

    void addNewTagToSelection(String selection) {
      final newItem = TagResponseDto(
          value: selection,
          id: "new",
          createdAt: DateTime.now(),
          name: selection,
          updatedAt: DateTime.now());

      if (!selectedTags.value.contains(newItem)) {
        selectedTags.value = [...selectedTags.value..add(newItem)];
      }
    }

    void removeTagFromList(TagResponseDto? selection) {
      if (selection != null)
        selectedTags.value = [...selectedTags.value..remove(selection)];
    }

    void addTagToSelection(TagResponseDto? selection) {
      if (selection != null && !selectedTags.value.contains(selection))
        selectedTags.value = [...selectedTags.value..add(selection)];
    }

    final menuEntries = (tags ?? [])
        .map(
          (tag) => DropdownMenuEntry<TagResponseDto>(
            value: tag,
            label: tag.value,
            style: ButtonStyle(
              textStyle: WidgetStatePropertyAll(
                context.textTheme.bodyMedium,
              ),
            ),
          ),
        )
        .toList();

    return AlertDialog(
      contentPadding: const EdgeInsets.symmetric(vertical: 32, horizontal: 18),
      actions: [
        TextButton(
          onPressed: () => context.pop(),
          child: Text(
            "cancel",
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colorScheme.error,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: () => popWithTags(),
          child: Text(
            "action_common_update",
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colorScheme.primary,
            ),
          ).tr(),
        ),
      ],
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24),
          DropdownSearchMenu(
            trailingIcon: Icon(
              Icons.arrow_drop_down,
              color: context.primaryColor,
            ),
            hintText: "search_tags".tr(),
            label: const Text('tag').tr(),
            textStyle: context.textTheme.bodyMedium,
            initialSelection: null,
            clearOnSelection: true,
            onSelected: addTagToSelection,
            dropdownMenuEntries: menuEntries,
            onSubmitted: addNewTagToSelection,
          ),
          Wrap(
            spacing: 1,
            runSpacing: 1,
            children: <ActionChip>[
              for (var tag in selectedTags.value)
                ActionChip(
                    label: Text(tag.value),
                    onPressed: () => removeTagFromList(tag),
                    shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.all(Radius.circular(20)))),
            ],
          ),
        ],
      ),
    );
  }
}

class _TimeZoneOffset implements Comparable<_TimeZoneOffset> {
  final String display;
  final Location location;

  const _TimeZoneOffset({
    required this.display,
    required this.location,
  });

  _TimeZoneOffset copyWith({
    String? display,
    Location? location,
  }) {
    return _TimeZoneOffset(
      display: display ?? this.display,
      location: location ?? this.location,
    );
  }

  int get offsetInMilliseconds => location.currentTimeZone.offset;

  _TimeZoneOffset.fromLocation(tz.Location l)
      : display = _getFormattedOffset(l.currentTimeZone.offset, l),
        location = l;

  @override
  int compareTo(_TimeZoneOffset other) {
    return offsetInMilliseconds.compareTo(other.offsetInMilliseconds);
  }

  @override
  String toString() =>
      '_TimeZoneOffset(display: $display, location: $location)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is _TimeZoneOffset &&
        other.display == display &&
        other.offsetInMilliseconds == offsetInMilliseconds;
  }

  @override
  int get hashCode =>
      display.hashCode ^ offsetInMilliseconds.hashCode ^ location.hashCode;
}

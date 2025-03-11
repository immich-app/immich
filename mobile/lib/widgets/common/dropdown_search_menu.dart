import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class DropdownSearchMenu<T> extends HookWidget {
  const DropdownSearchMenu({
    super.key,
    required this.dropdownMenuEntries,
    this.initialSelection,
    this.onSelected,
    this.trailingIcon,
    this.hintText,
    this.label,
    this.textStyle,
    this.menuConstraints,
  });

  final List<DropdownMenuEntry<T>> dropdownMenuEntries;
  final T? initialSelection;
  final ValueChanged<T>? onSelected;
  final Widget? trailingIcon;
  final String? hintText;
  final Widget? label;
  final TextStyle? textStyle;
  final BoxConstraints? menuConstraints;

  @override
  Widget build(BuildContext context) {
    final selectedItem = useState<DropdownMenuEntry<T>?>(
      dropdownMenuEntries
          .firstWhereOrNull((item) => item.value == initialSelection),
    );
    final showTimeZoneDropdown = useState<bool>(false);

    final effectiveConstraints = menuConstraints ??
        const BoxConstraints(
          minWidth: 280,
          maxWidth: 280,
          minHeight: 0,
          maxHeight: 280,
        );

    final inputDecoration = InputDecoration(
      contentPadding: const EdgeInsets.fromLTRB(12, 4, 12, 4),
      border: const OutlineInputBorder(),
      suffixIcon: trailingIcon,
      label: label,
      hintText: hintText,
    ).applyDefaults(context.themeData.inputDecorationTheme);

    if (!showTimeZoneDropdown.value) {
      return ConstrainedBox(
        constraints: effectiveConstraints,
        child: GestureDetector(
          onTap: () => showTimeZoneDropdown.value = true,
          child: InputDecorator(
            decoration: inputDecoration,
            child: selectedItem.value != null
                ? Text(
                    selectedItem.value!.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: textStyle,
                  )
                : null,
          ),
        ),
      );
    }

    return ConstrainedBox(
      constraints: effectiveConstraints,
      child: Autocomplete<DropdownMenuEntry<T>>(
        displayStringForOption: (option) => option.label,
        optionsBuilder: (textEditingValue) {
          return dropdownMenuEntries.where(
            (item) => item.label
                .toLowerCase()
                .trim()
                .contains(textEditingValue.text.toLowerCase().trim()),
          );
        },
        onSelected: (option) {
          selectedItem.value = option;
          showTimeZoneDropdown.value = false;
          onSelected?.call(option.value);
        },
        fieldViewBuilder: (context, textEditingController, focusNode, _) {
          return TextField(
            autofocus: true,
            focusNode: focusNode,
            controller: textEditingController,
            decoration: inputDecoration.copyWith(
              hintText: "edit_date_time_dialog_search_timezone".tr(),
            ),
            maxLines: 1,
            style: context.textTheme.bodyMedium,
            expands: false,
            onTapOutside: (event) {
              showTimeZoneDropdown.value = false;
              focusNode.unfocus();
            },
            onSubmitted: (_) {
              showTimeZoneDropdown.value = false;
            },
          );
        },
        optionsViewBuilder: (context, onSelected, options) {
          // This widget is a copy of the default implementation.
          // We have only changed the `constraints` parameter.
          return Align(
            alignment: Alignment.topLeft,
            child: ConstrainedBox(
              constraints: effectiveConstraints,
              child: Material(
                elevation: 4.0,
                child: ListView.builder(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  itemCount: options.length,
                  itemBuilder: (BuildContext context, int index) {
                    final option = options.elementAt(index);
                    return InkWell(
                      onTap: () => onSelected(option),
                      child: Builder(
                        builder: (BuildContext context) {
                          final bool highlight =
                              AutocompleteHighlightedOption.of(context) ==
                                  index;
                          if (highlight) {
                            SchedulerBinding.instance.addPostFrameCallback(
                              (Duration timeStamp) {
                                Scrollable.ensureVisible(
                                  context,
                                  alignment: 0.5,
                                );
                              },
                              debugLabel: 'AutocompleteOptions.ensureVisible',
                            );
                          }
                          return Container(
                            color: highlight
                                ? Theme.of(context)
                                    .colorScheme
                                    .onSurface
                                    .withValues(alpha: 0.12)
                                : null,
                            padding: const EdgeInsets.all(16.0),
                            child: Text(
                              option.label,
                              style: textStyle,
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

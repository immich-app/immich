import 'package:flutter/material.dart';

class SearchDropdown<T> extends StatelessWidget {
  const SearchDropdown({
    super.key,
    required this.dropdownMenuEntries,
    required this.controller,
    this.onSelected,
    this.label,
    this.leadingIcon,
  });

  final List<DropdownMenuEntry<T>> dropdownMenuEntries;
  final TextEditingController controller;
  final void Function(T?)? onSelected;
  final Widget? label;
  final Widget? leadingIcon;

  static const WidgetStatePropertyAll<EdgeInsetsGeometry> _optionPadding = WidgetStatePropertyAll<EdgeInsetsGeometry>(
    EdgeInsetsDirectional.fromSTEB(16, 0, 16, 0),
  );

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final maxMenuHeight = mediaQuery.size.height * 0.5 - mediaQuery.viewPadding.bottom;
    const menuStyle = MenuStyle(
      shape: WidgetStatePropertyAll<OutlinedBorder>(
        RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(15))),
      ),
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final styledEntries = dropdownMenuEntries
            .map(
              (entry) => DropdownMenuEntry<T>(
                value: entry.value,
                label: entry.label,
                labelWidget: entry.labelWidget,
                enabled: entry.enabled,
                leadingIcon: entry.leadingIcon,
                trailingIcon: entry.trailingIcon,
                style: (entry.style ?? const ButtonStyle()).copyWith(padding: _optionPadding),
              ),
            )
            .toList(growable: false);

        return DropdownMenu(
          controller: controller,
          leadingIcon: leadingIcon,
          width: constraints.maxWidth,
          menuHeight: maxMenuHeight,
          dropdownMenuEntries: styledEntries,
          label: label,
          menuStyle: menuStyle,
          trailingIcon: const Icon(Icons.arrow_drop_down_rounded),
          selectedTrailingIcon: const Icon(Icons.arrow_drop_up_rounded),
          onSelected: onSelected,
        );
      },
    );
  }
}

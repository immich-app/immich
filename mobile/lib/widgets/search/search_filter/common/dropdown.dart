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

  @override
  Widget build(BuildContext context) {
    final menuStyle = MenuStyle(
      shape: WidgetStatePropertyAll<OutlinedBorder>(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
        ),
      ),
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        return DropdownMenu(
          controller: controller,
          leadingIcon: leadingIcon,
          width: constraints.maxWidth,
          dropdownMenuEntries: dropdownMenuEntries,
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

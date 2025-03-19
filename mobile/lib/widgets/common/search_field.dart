import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class SearchField extends StatelessWidget {
  const SearchField({
    super.key,
    required this.context,
    required this.hintText,
    this.autofocus = false,
    this.controller,
    this.focusNode,
    this.onChanged,
    this.onSubmitted,
    this.onTapOutside,
    this.contentPadding = const EdgeInsets.only(left: 24),
    this.prefixIcon,
    this.suffixIcon,
  });

  final FocusNode? focusNode;
  final void Function(String)? onChanged;
  final void Function(String)? onSubmitted;
  final void Function(PointerDownEvent)? onTapOutside;
  final BuildContext context;
  final TextEditingController? controller;
  final String hintText;
  final EdgeInsetsGeometry contentPadding;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    return TextField(
      autofocus: autofocus,
      focusNode: focusNode,
      onChanged: onChanged,
      onTapOutside: onTapOutside ?? (_) => focusNode?.unfocus(),
      onSubmitted: onSubmitted,
      decoration: InputDecoration(
        contentPadding: contentPadding,
        filled: true,
        fillColor: context.primaryColor.withValues(alpha: 0.1),
        hintStyle: context.textTheme.bodyLarge?.copyWith(
          color: context.themeData.colorScheme.onSurfaceSecondary,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide(
            color: context.colorScheme.surfaceContainerHighest,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide(
            color: context.colorScheme.surfaceContainerHighest,
          ),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide(
            color: context.colorScheme.surfaceContainerHighest,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide(
            color: context.colorScheme.primary.withAlpha(150),
          ),
        ),
        prefixIcon: prefixIcon,
        suffixIcon: suffixIcon,
        hintText: hintText,
      ),
    );
  }
}

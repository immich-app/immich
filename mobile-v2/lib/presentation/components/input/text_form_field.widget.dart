import 'package:flutter/material.dart';

class ImTextFormField extends StatelessWidget {
  const ImTextFormField({
    super.key,
    this.controller,
    this.focusNode,
    this.onChanged,
    this.validator,
    this.shouldObscure = false,
    this.suffixIcon,
    this.label,
    this.hint,
    this.autoFillHints,
    this.keyboardType,
    this.textInputAction,
    this.isDisabled = false,
    this.onSubmitted,
  }) : assert(
          onSubmitted == null ||
              textInputAction == TextInputAction.next ||
              textInputAction == TextInputAction.previous,
          "onSubmitted provided when textInputAction is not next or pervious",
        );

  /// The [TextEditingController] passed to the underlying [TextFormField]
  final TextEditingController? controller;

  /// The [FocusNode] passed to the underlying [TextFormField]
  final FocusNode? focusNode;

  /// Optional callback to validate input
  final String? Function(String?)? validator;

  /// Optional callback to receive changes
  final void Function(String?)? onChanged;

  /// Optional flag to obscure texts
  final bool shouldObscure;

  /// Icon Widget to display in the suffix
  final Widget? suffixIcon;

  /// Translation Key used as label
  final String? label;

  /// Translation key used as hint
  final String? hint;

  /// Hints used by the auto-fill service
  final List<String>? autoFillHints;

  /// Type of keyboard - Numberic / Alphanum
  final TextInputType? keyboardType;

  /// Type of the following action - go, next, enter, etc.
  final TextInputAction? textInputAction;

  /// Flag to disable the [TextFormField]
  final bool isDisabled;

  /// Called on [TextInputAction.next] or [TextInputAction.previous]
  final void Function(String)? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      onChanged: onChanged,
      focusNode: focusNode,
      obscureText: shouldObscure,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        suffixIcon: suffixIcon,
      ),
      autofillHints: autoFillHints,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      readOnly: isDisabled,
      onTapOutside: (_) => FocusManager.instance.primaryFocus?.unfocus(),
      onFieldSubmitted: onSubmitted,
    );
  }
}

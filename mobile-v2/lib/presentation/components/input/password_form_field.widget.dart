import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/components/input/text_form_field.widget.dart';
import 'package:material_symbols_icons/symbols.dart';

class ImPasswordFormField extends StatefulWidget {
  const ImPasswordFormField({
    super.key,
    this.controller,
    this.onChanged,
    this.focusNode,
    this.label,
    this.hint,
    this.textInputAction,
    this.isDisabled = false,
  });

  /// The [TextEditingController] passed to the underlying [TextFormField]
  final TextEditingController? controller;

  /// Optional callback to receive changes
  final void Function(String?)? onChanged;

  /// The [FocusNode] passed to the underlying [TextFormField]
  final FocusNode? focusNode;

  /// Translation Key used as label
  final String? label;

  /// Translation key used as hint
  final String? hint;

  /// Type of the following action - go, next, enter, etc.
  final TextInputAction? textInputAction;

  /// Flag to disable the [TextFormField]
  final bool isDisabled;

  @override
  State createState() => _ImPasswordFormFieldState();
}

class _ImPasswordFormFieldState extends State<ImPasswordFormField> {
  final showPassword = ValueNotifier(false);

  @override
  void dispose() {
    showPassword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: showPassword,
      builder: (_, showPass, child) => ImTextFormField(
        controller: widget.controller,
        onChanged: widget.onChanged,
        shouldObscure: !showPass,
        hint: widget.hint,
        label: widget.label,
        focusNode: widget.focusNode,
        suffixIcon: IconButton(
          onPressed: () => showPassword.value = !showPassword.value,
          icon: Icon(
            showPassword.value
                ? Symbols.visibility_off_rounded
                : Symbols.visibility_rounded,
          ),
        ),
        autoFillHints: const [AutofillHints.password],
        keyboardType: TextInputType.visiblePassword,
        textInputAction: widget.textInputAction,
        isDisabled: widget.isDisabled,
      ),
    );
  }
}

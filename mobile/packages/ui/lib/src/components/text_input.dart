import 'package:flutter/material.dart';

class ImmichTextInput extends StatefulWidget {
  final String label;
  final String? hintText;
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? Function(String?)? validator;
  final void Function(BuildContext, String)? onSubmit;
  final TextInputType keyboardType;
  final TextInputAction? keyboardAction;
  final List<String>? autofillHints;
  final Widget? suffixIcon;
  final bool obscureText;

  const ImmichTextInput({
    super.key,
    this.controller,
    this.focusNode,
    required this.label,
    this.hintText,
    this.validator,
    this.onSubmit,
    this.keyboardType = TextInputType.text,
    this.keyboardAction,
    this.autofillHints,
    this.suffixIcon,
    this.obscureText = false,
  });

  @override
  State createState() => _ImmichTextInputState();
}

class _ImmichTextInputState extends State<ImmichTextInput> {
  late final FocusNode _focusNode;
  String? _error;

  @override
  void initState() {
    super.initState();
    _focusNode = widget.focusNode ?? FocusNode();
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.dispose();
    }
    super.dispose();
  }

  String? _validateInput(String? value) {
    setState(() {
      _error = widget.validator?.call(value);
    });
    return null;
  }

  bool get _hasError => _error != null && _error!.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final themeData = Theme.of(context);

    return TextFormField(
      controller: widget.controller,
      focusNode: _focusNode,
      decoration: InputDecoration(
        hintText: widget.hintText,
        labelText: widget.label,
        labelStyle: themeData.inputDecorationTheme.labelStyle?.copyWith(
          color: _hasError ? themeData.colorScheme.error : null,
        ),
        errorText: _error,
        suffixIcon: widget.suffixIcon,
      ),
      obscureText: widget.obscureText,
      validator: _validateInput,
      keyboardType: widget.keyboardType,
      textInputAction: widget.keyboardAction,
      autofillHints: widget.autofillHints,
      onTap: () => setState(() => _error = null),
      onTapOutside: (_) => _focusNode.unfocus(),
      onFieldSubmitted: (value) => widget.onSubmit?.call(context, value),
    );
  }
}

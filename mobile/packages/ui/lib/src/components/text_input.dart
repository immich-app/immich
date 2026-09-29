import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ImmichTextInput extends StatefulWidget {
  final String? label;
  final String? hintText;
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? Function(String?)? validator;
  final void Function(String value)? onSubmit;
  final TextInputType keyboardType;
  final TextInputAction? keyboardAction;
  final List<String>? autofillHints;
  final Widget? suffixIcon;
  final bool obscureText;
  final bool autocorrect;
  final SmartDashesType? smartDashesType;
  final SmartQuotesType? smartQuotesType;
  final List<TextInputFormatter>? inputFormatters;
  final bool enabled;
  final bool autofocus;
  final AutovalidateMode? autovalidateMode;

  const ImmichTextInput({
    super.key,
    this.controller,
    this.focusNode,
    this.label,
    this.hintText,
    this.validator,
    this.onSubmit,
    this.keyboardType = .text,
    this.keyboardAction,
    this.autofillHints,
    this.suffixIcon,
    this.obscureText = false,
    this.autocorrect = true,
    this.smartDashesType,
    this.smartQuotesType,
    this.inputFormatters,
    this.enabled = true,
    this.autofocus = false,
    this.autovalidateMode,
  });

  @override
  State createState() => _ImmichTextInputState();
}

class _ImmichTextInputState extends State<ImmichTextInput> {
  late final FocusNode _focusNode;

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

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      focusNode: _focusNode,
      enabled: widget.enabled,
      autofocus: widget.autofocus,
      autovalidateMode: widget.autovalidateMode,
      decoration: InputDecoration(hintText: widget.hintText, labelText: widget.label, suffixIcon: widget.suffixIcon),
      obscureText: widget.obscureText,
      validator: widget.validator,
      textInputAction: widget.keyboardAction,
      onTapOutside: (_) => _focusNode.unfocus(),
      onFieldSubmitted: (value) => widget.onSubmit?.call(value),
      keyboardType: widget.keyboardType,
      autofillHints: widget.autofillHints,
      autocorrect: widget.autocorrect,
      smartDashesType: widget.smartDashesType,
      smartQuotesType: widget.smartQuotesType,
      inputFormatters: widget.inputFormatters,
    );
  }
}

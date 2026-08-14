import 'package:flutter/services.dart';
import 'package:immich_ui/src/components/text_input.dart';

class ImmichURLInput extends ImmichTextInput {
  ImmichURLInput({
    super.key,
    super.controller,
    super.focusNode,
    super.label,
    super.hintText,
    super.validator,
    super.onSubmit,
    super.keyboardAction,
    super.suffixIcon,
    super.enabled,
    super.autofocus,
    super.autovalidateMode,
  }) : super(
         keyboardType: .url,
         autofillHints: const [AutofillHints.url],
         autocorrect: false,
         smartDashesType: .disabled,
         smartQuotesType: .disabled,
         inputFormatters: _formatters,
       );

  static final List<TextInputFormatter> _formatters = List.unmodifiable([
    FilteringTextInputFormatter.deny(RegExp(r'\s')),
  ]);
}

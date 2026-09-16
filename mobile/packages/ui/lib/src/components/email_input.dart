import 'package:flutter/services.dart';
import 'package:immich_ui/src/components/text_input.dart';

/// An ImmichTextInput customized for receiving email addresses
class ImmichEmailInput extends ImmichTextInput {
  const ImmichEmailInput({
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
         keyboardType: .emailAddress,
         autofillHints: const [AutofillHints.email],
         autocorrect: false,
         smartDashesType: .disabled,
         smartQuotesType: .disabled,
       );
}

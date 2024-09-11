import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class EmailInput extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final Function()? onSubmit;

  const EmailInput({
    super.key,
    required this.controller,
    this.focusNode,
    this.onSubmit,
  });

  String? _validateInput(String? email) {
    if (email == null || email == '') return null;
    if (email.endsWith(' ')) return 'login_form_err_trailing_whitespace'.tr();
    if (email.startsWith(' ')) return 'login_form_err_leading_whitespace'.tr();
    if (email.contains(' ') || !email.contains('@')) {
      return 'login_form_err_invalid_email'.tr();
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      autofocus: true,
      controller: controller,
      decoration: InputDecoration(
        labelText: 'login_form_label_email'.tr(),
        border: const OutlineInputBorder(),
        hintText: 'login_form_email_hint'.tr(),
        hintStyle: const TextStyle(
          fontWeight: FontWeight.normal,
          fontSize: 14,
        ),
      ),
      validator: _validateInput,
      autovalidateMode: AutovalidateMode.always,
      autofillHints: const [AutofillHints.email],
      keyboardType: TextInputType.emailAddress,
      onFieldSubmitted: (_) => onSubmit?.call(),
      focusNode: focusNode,
      textInputAction: TextInputAction.next,
    );
  }
}

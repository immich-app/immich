import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class PasswordInput extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final VoidCallback? onSubmit;

  const PasswordInput({super.key, required this.controller, this.focusNode, this.onSubmit});

  @override
  State<PasswordInput> createState() => _PasswordInputState();
}

class _PasswordInputState extends State<PasswordInput> {
  bool _isPasswordVisible = false;

  void _togglePasswordVisibility() {
    setState(() {
      _isPasswordVisible = !_isPasswordVisible;
    });
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      obscureText: !_isPasswordVisible,
      controller: widget.controller,
      decoration: InputDecoration(
        labelText: 'password'.tr(),
        border: const OutlineInputBorder(),
        hintText: 'login_form_password_hint'.tr(),
        hintStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 14),
        suffixIcon: IconButton(
          onPressed: _togglePasswordVisibility,
          icon: Icon(_isPasswordVisible ? Icons.visibility_off_sharp : Icons.visibility_sharp),
        ),
      ),
      autofillHints: const [AutofillHints.password],
      keyboardType: TextInputType.text,
      onFieldSubmitted: (_) => widget.onSubmit?.call(),
      focusNode: widget.focusNode,
      textInputAction: TextInputAction.go,
    );
  }
}

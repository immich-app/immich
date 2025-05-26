import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class PasswordInput extends HookConsumerWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final Function()? onSubmit;

  const PasswordInput({
    super.key,
    required this.controller,
    this.focusNode,
    this.onSubmit,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPasswordVisible = useState<bool>(false);

    return TextFormField(
      obscureText: !isPasswordVisible.value,
      controller: controller,
      decoration: InputDecoration(
        labelText: 'password'.tr(),
        border: const OutlineInputBorder(),
        hintText: 'login_form_password_hint'.tr(),
        hintStyle: const TextStyle(
          fontWeight: FontWeight.normal,
          fontSize: 14,
        ),
        suffixIcon: IconButton(
          onPressed: () => isPasswordVisible.value = !isPasswordVisible.value,
          icon: Icon(
            isPasswordVisible.value
                ? Icons.visibility_off_sharp
                : Icons.visibility_sharp,
          ),
        ),
      ),
      autofillHints: const [AutofillHints.password],
      keyboardType: TextInputType.text,
      onFieldSubmitted: (_) => onSubmit?.call(),
      focusNode: focusNode,
      textInputAction: TextInputAction.go,
    );
  }
}

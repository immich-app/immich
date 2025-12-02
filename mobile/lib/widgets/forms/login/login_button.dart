import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class LoginButton extends StatelessWidget {
  final VoidCallback onPressed;

  const LoginButton({super.key, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
      onPressed: onPressed,
      icon: const Icon(Icons.login_rounded),
      label: const Text("login", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)).tr(),
    );
  }
}

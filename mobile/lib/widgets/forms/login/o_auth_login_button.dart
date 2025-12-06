import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class OAuthLoginButton extends StatelessWidget {
  final TextEditingController serverEndpointController;
  final String buttonLabel;
  final VoidCallback onPressed;

  const OAuthLoginButton({
    super.key,
    required this.serverEndpointController,
    required this.buttonLabel,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: context.primaryColor.withAlpha(230),
        padding: const EdgeInsets.symmetric(vertical: 12),
      ),
      onPressed: onPressed,
      icon: const Icon(Icons.pin_rounded),
      label: Text(buttonLabel, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
    );
  }
}

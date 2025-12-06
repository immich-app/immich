import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class VersionCompatibilityWarning extends StatelessWidget {
  final String message;

  const VersionCompatibilityWarning({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.isDarkTheme ? Colors.red.shade700 : Colors.red.shade100,
          borderRadius: const BorderRadius.all(Radius.circular(8)),
          border: Border.all(color: context.isDarkTheme ? Colors.red.shade900 : Colors.red[200]!),
        ),
        child: Text(message, textAlign: TextAlign.center),
      ),
    );
  }
}

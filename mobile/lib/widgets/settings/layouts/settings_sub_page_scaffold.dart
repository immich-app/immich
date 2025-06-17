import 'package:flutter/material.dart';

class SettingsSubPageScaffold extends StatelessWidget {
  final List<Widget> settings;

  const SettingsSubPageScaffold({
    super.key,
    required this.settings,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      itemCount: settings.length,
      itemBuilder: (_, index) => settings[index],
      separatorBuilder: (_, index) => const SizedBox(height: 8),
    );
  }
}

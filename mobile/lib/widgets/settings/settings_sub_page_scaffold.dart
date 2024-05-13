import 'package:flutter/material.dart';

class SettingsSubPageScaffold extends StatelessWidget {
  final List<Widget> settings;
  final bool showDivider;

  const SettingsSubPageScaffold({
    super.key,
    required this.settings,
    this.showDivider = false,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 20),
      itemCount: settings.length,
      itemBuilder: (ctx, index) => settings[index],
      separatorBuilder: (context, index) => showDivider
          ? const Column(
              children: [
                SizedBox(height: 5),
                Divider(height: 10, indent: 15, endIndent: 15),
                SizedBox(height: 15),
              ],
            )
          : const SizedBox(height: 10),
    );
  }
}

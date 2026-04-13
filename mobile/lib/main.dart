import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/features/wizard/views/wizard_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: HearthHubApp(),
    ),
  );
}

class HearthHubApp extends StatelessWidget {
  const HearthHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.deepOrange,
        brightness: Brightness.dark,
      ),
      home: const WizardScreen(),
    );
  }
}
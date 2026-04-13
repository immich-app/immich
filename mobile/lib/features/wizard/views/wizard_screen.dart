import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/features/wizard/providers/wizard_provider.dart';
import 'package:immich_mobile/features/wizard/models/wizard_step.dart';
import 'package:immich_mobile/features/wizard/views/steps/server_url_step.dart';
import 'package:immich_mobile/features/wizard/views/steps/login_step.dart';

class WizardScreen extends ConsumerWidget {
  const WizardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final step = ref.watch(wizardLogicProvider.select((s) => s.step));

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: step == WizardStep.serverUrl 
                ? const ServerUrlStep() 
                : const LoginStep(),
          ),
        ),
      ),
    );
  }
}
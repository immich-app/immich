import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/features/wizard/providers/wizard_provider.dart';
import 'package:immich_mobile/features/wizard/models/wizard_step.dart';
import 'package:immich_mobile/features/wizard/views/steps/server_url_step.dart';
import 'package:immich_mobile/features/wizard/views/steps/login_step.dart';

class WizardScreen extends HookConsumerWidget {
  const WizardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final step = ref.watch(wizardLogicProvider.select((s) => s.step));

    useEffect(() {
      Future.microtask(() => ref.read(wizardLogicProvider.notifier).startDiscovery());
      return null;
    }, const []);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: step == WizardStep.serverUrl ? const ServerUrlStep() : const LoginStep(),
          ),
        ),
      ),
    );
  }
}

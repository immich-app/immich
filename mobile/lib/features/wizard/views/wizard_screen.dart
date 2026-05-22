import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/features/wizard/models/wizard_state.dart';
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

    // Safety net: the moment discoveryStatus flips to `discovered`, force the
    // wizard onto the login step. Normally connectToServer() already does this
    // when validateServerUrl succeeds, but this guarantees the UI advances even
    // if a downstream state mutation lands out of order.
    ref.listen<WizardDiscoveryStatus>(wizardLogicProvider.select((s) => s.discoveryStatus), (prev, next) {
      if (kDebugMode) {
        debugPrint('[Wizard] discoveryStatus: $prev -> $next');
      }
      if (next == WizardDiscoveryStatus.discovered) {
        final notifier = ref.read(wizardLogicProvider.notifier);
        final current = ref.read(wizardLogicProvider).step;
        if (current != WizardStep.login) {
          notifier.moveToStep(WizardStep.login);
        }
      }
    });

    if (kDebugMode) {
      debugPrint('[Wizard] build step=$step');
    }

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

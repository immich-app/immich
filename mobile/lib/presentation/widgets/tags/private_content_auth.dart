import 'package:auto_route/auto_route.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/data/server/pin.dart';
import 'package:immich_mobile/providers/local_auth.provider.dart';
import 'package:immich_mobile/providers/private_session.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';

Future<bool> unlockPrivateContent(BuildContext context, WidgetRef ref) async {
  if (ref.read(privateSessionProvider)) {
    return true;
  }

  final api = ref.read(pinApiRepositoryProvider);
  final session = ref.read(privateSessionProvider.notifier);
  final status = await api.getPinStatus();
  if (!context.mounted) {
    return false;
  }

  if (status.isConfigured && ref.read(localAuthProvider).canAuthenticate) {
    final storage = ref.read(secureStorageServiceProvider);
    final pin = await storage.read(kSecuredPinCode);
    if (pin != null && context.mounted) {
      final authenticated = await ref.read(localAuthProvider.notifier).authenticate(context, null);
      if (authenticated) {
        if (await api.unlockPinCode(pin)) {
          return session.activate();
        }
        await storage.delete(kSecuredPinCode);
      }
    }
  }

  if (!context.mounted) {
    return false;
  }
  final verified = await context.pushRoute<bool>(PinAuthRoute(createPinCode: !status.isConfigured));
  return verified == true && context.mounted && await session.activate();
}

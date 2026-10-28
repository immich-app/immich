import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/passkey.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

class PasskeyCreateAction extends ActionBuilder {
  const PasskeyCreateAction();

  @override
  ActionItem create(BuildContext context, WidgetRef ref) =>
      ActionItem(icon: Icons.add_rounded, label: context.t.new_passkey, onAction: () => _create(context, ref));

  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final message = context.t.passkey_added;
    final passkeyService = ref.read(passkeyServiceProvider);
    final toastService = ref.read(toastServiceProvider);

    try {
      if (await passkeyService.register()) {
        toastService.success(message);
      }
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to create a passkey");
    }
  }
}

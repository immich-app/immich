import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

import '../../../constants/colors.dart';
import '../../../routing/router.dart';
import '../../../providers/kid_mode_provider.dart';

class KidModeCheckbox extends ConsumerWidget {
  const KidModeCheckbox({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isKidModeEnabled = ref.watch(kidModeProvider);
    final theme = context.themeData;

    return InkWell(
      onTap: () {
        final newKidModeState = !isKidModeEnabled;
        ref.read(kidModeProvider.notifier).setKidMode(newKidModeState);
        if (newKidModeState) {
          context.router.push(const PhotosRoute());
        } else {
          context.router.popForced();
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 30.0, vertical: 8.0),
        child: Row(
          children: [
            const Icon(Icons.child_care_outlined, size: 20),
            const SizedBox(width: 35),
            Expanded(
              child: Text(
                "Kid (Readonly) Mode",
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.textTheme.labelLarge?.color?.withAlpha(250),
                ),
              ),
            ),
            Checkbox(
              value: isKidModeEnabled,
              onChanged: (bool? newValue) {
                if (newValue != null) {
                  ref.read(kidModeProvider.notifier).setKidMode(newValue);
                  if (newValue) {
                    context.router.push(const PhotosRoute());
                  } else {
                    context.router.popForced();
                  }
                }
              },
              activeColor: immichBrandColorLight,
            ),
          ],
        ),
      ),
    );
  }
}

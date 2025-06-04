import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';

class ExpUploadOptionToggle extends HookConsumerWidget {
  final VoidCallback? onToggle;

  const ExpUploadOptionToggle({
    super.key,
    this.onToggle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storeService = ref.watch(storeServiceProvider);
    final isNewUpload = useState(storeService.get(StoreKey.newUpload, false));

    toggleNewUploadFeature() async {
      final currentValue = storeService.get(StoreKey.newUpload, false);
      await storeService.put(StoreKey.newUpload, !currentValue);

      onToggle?.call();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Container(
        decoration: BoxDecoration(
          color: context.colorScheme.surfaceContainerLow,
          border: Border.all(
            color: context.primaryColor,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 8.0),
          child: ListTile(
            title: Text(
              "New Upload Experience",
              style: context.textTheme.titleMedium?.copyWith(
                color: context.colorScheme.primary,
              ),
            ),
            subtitle: Text(
              "Try the new upload experience with faster backups and improved reliability",
              style: context.textTheme.labelLarge,
            ),
            trailing: Switch(
              value: isNewUpload.value,
              onChanged: (_) => toggleNewUploadFeature(),
            ),
          ),
        ),
      ),
    );
  }
}

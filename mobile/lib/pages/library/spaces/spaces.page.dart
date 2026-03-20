import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

@RoutePage()
class SpacesPage extends HookConsumerWidget {
  const SpacesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spacesAsync = ref.watch(sharedSpacesProvider);

    Future<void> createSpaceDialog() async {
      final nameController = TextEditingController();
      final descController = TextEditingController();

      final result = await showDialog<bool>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Create Space'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Name', hintText: 'Enter space name'),
                  autofocus: true,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(labelText: 'Description (optional)', hintText: 'Enter description'),
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
              TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Create')),
            ],
          );
        },
      );

      if (result == true && nameController.text.isNotEmpty) {
        try {
          final description = descController.text.isEmpty ? null : descController.text;
          await ref.read(sharedSpaceApiRepositoryProvider).create(nameController.text, description: description);
          ref.invalidate(sharedSpacesProvider);
        } catch (e) {
          if (context.mounted) {
            ImmichToast.show(context: context, msg: 'Failed to create space: $e', toastType: ToastType.error);
          }
        }
      }

      nameController.dispose();
      descController.dispose();
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Spaces'), elevation: 0, centerTitle: false),
      body: spacesAsync.when(
        data: (spaces) {
          if (spaces.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.workspaces_outlined, size: 64, color: context.colorScheme.onSurface.withAlpha(100)),
                  const SizedBox(height: 16),
                  Text(
                    'No spaces yet',
                    style: context.textTheme.titleMedium?.copyWith(color: context.colorScheme.onSurface.withAlpha(150)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Create a space to share photos with others',
                    style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurface.withAlpha(100)),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: createSpaceDialog,
                    icon: const Icon(Icons.add),
                    label: const Text('Create Space'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(sharedSpacesProvider),
            child: ListView.builder(
              itemCount: spaces.length,
              itemBuilder: (context, index) {
                final space = spaces[index];
                return ListTile(
                  leading: const Icon(Icons.workspaces_outlined),
                  title: Text(space.name, style: context.textTheme.bodyLarge),
                  subtitle: space.description != null
                      ? Text(space.description!, maxLines: 1, overflow: TextOverflow.ellipsis)
                      : null,
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (space.assetCount != null)
                        Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.photo_outlined, size: 16, color: context.colorScheme.onSurface.withAlpha(150)),
                              const SizedBox(width: 2),
                              Text('${space.assetCount!.toInt()}', style: context.textTheme.bodySmall),
                            ],
                          ),
                        ),
                      if (space.memberCount != null)
                        Padding(
                          padding: const EdgeInsets.only(right: 4.0),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.people_outline, size: 16, color: context.colorScheme.onSurface.withAlpha(150)),
                              const SizedBox(width: 2),
                              Text('${space.memberCount!.toInt()}', style: context.textTheme.bodySmall),
                            ],
                          ),
                        ),
                      const Icon(Icons.chevron_right),
                    ],
                  ),
                  onTap: () async {
                    await context.pushRoute(SpaceDetailRoute(spaceId: space.id));
                    ref.invalidate(sharedSpacesProvider);
                  },
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              Text('Failed to load spaces: $error'),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () => ref.invalidate(sharedSpacesProvider), child: const Text('Retry')),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(onPressed: createSpaceDialog, child: const Icon(Icons.add)),
    );
  }
}

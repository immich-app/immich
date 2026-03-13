import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

/// Provider that fetches users directly from the API to ensure availability
/// even before local Isar sync completes. The standard [otherUsersProvider]
/// reads from Isar which may be empty on fresh login.
final spaceMemberCandidatesProvider = FutureProvider.autoDispose<List<UserDto>>((ref) async {
  final currentUser = ref.watch(currentUserProvider);
  final allUsers = await ref.watch(userApiRepositoryProvider).getAll();
  allUsers.removeWhere((u) => currentUser?.id == u.id);
  return allUsers;
});

@RoutePage()
class SpaceMemberSelectionPage extends HookConsumerWidget {
  final String spaceId;
  final List<String> existingMemberIds;

  const SpaceMemberSelectionPage({super.key, required this.spaceId, required this.existingMemberIds});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suggestedUsers = ref.watch(spaceMemberCandidatesProvider);
    final selectedUsers = useState<Set<UserDto>>({});

    Future<void> addSelectedMembers() async {
      try {
        final repo = ref.read(sharedSpaceApiRepositoryProvider);
        for (final user in selectedUsers.value) {
          await repo.addMember(spaceId, user.id);
        }
        ref.invalidate(sharedSpaceMembersProvider(spaceId));
        ref.invalidate(sharedSpacesProvider);
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            msg: 'Added ${selectedUsers.value.length} members',
            toastType: ToastType.success,
          );
          await context.maybePop();
        }
      } catch (e) {
        if (context.mounted) {
          ImmichToast.show(context: context, msg: 'Failed to add members', toastType: ToastType.error);
        }
      }
    }

    Widget buildTileIcon(UserDto user) {
      if (selectedUsers.value.contains(user)) {
        return CircleAvatar(backgroundColor: context.primaryColor, child: const Icon(Icons.check_rounded, size: 25));
      }
      return UserCircleAvatar(user: user);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Members'),
        centerTitle: false,
        leading: IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => context.maybePop()),
        actions: [
          TextButton(
            onPressed: selectedUsers.value.isEmpty ? null : addSelectedMembers,
            child: Text(
              'add'.tr(),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: selectedUsers.value.isEmpty ? null : context.primaryColor,
              ),
            ),
          ),
        ],
      ),
      body: suggestedUsers.widgetWhen(
        onData: (users) {
          final filteredUsers = users.where((u) => !existingMemberIds.contains(u.id)).toList();

          if (filteredUsers.isEmpty) {
            return const Center(child: Text('No users available to add'));
          }

          return ListView(
            children: [
              if (selectedUsers.value.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Wrap(
                    children: selectedUsers.value
                        .map(
                          (user) => Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4.0),
                            child: Chip(
                              backgroundColor: context.primaryColor.withValues(alpha: 0.15),
                              label: Text(user.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  'suggestions'.tr(),
                  style: const TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.bold),
                ),
              ),
              ListView.builder(
                primary: false,
                shrinkWrap: true,
                itemCount: filteredUsers.length,
                itemBuilder: (context, index) {
                  final user = filteredUsers[index];
                  return ListTile(
                    leading: buildTileIcon(user),
                    dense: true,
                    title: Text(user.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    subtitle: Text(user.email, style: const TextStyle(fontSize: 12)),
                    onTap: () {
                      if (selectedUsers.value.contains(user)) {
                        selectedUsers.value = selectedUsers.value.where((u) => u.id != user.id).toSet();
                      } else {
                        selectedUsers.value = {...selectedUsers.value, user};
                      }
                    },
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

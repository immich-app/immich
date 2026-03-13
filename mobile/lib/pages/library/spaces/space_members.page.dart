import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:openapi/api.dart';

@RoutePage()
class SpaceMembersPage extends HookConsumerWidget {
  final String spaceId;

  const SpaceMembersPage({super.key, required this.spaceId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(sharedSpaceMembersProvider(spaceId));
    final currentUser = ref.watch(currentUserProvider);

    SharedSpaceMemberResponseDto? getCurrentMember(List<SharedSpaceMemberResponseDto> members) {
      return members.where((m) => m.userId == currentUser?.id).firstOrNull;
    }

    Future<void> removeMember(SharedSpaceMemberResponseDto member) async {
      final isLeaving = member.userId == currentUser?.id;
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(isLeaving ? 'Leave Space' : 'Remove Member'),
          content: Text(
            isLeaving ? 'Are you sure you want to leave this space?' : 'Remove ${member.name} from this space?',
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: TextButton.styleFrom(foregroundColor: Theme.of(ctx).colorScheme.error),
              child: Text(isLeaving ? 'Leave' : 'Remove'),
            ),
          ],
        ),
      );

      if (confirmed == true) {
        try {
          await ref.read(sharedSpaceApiRepositoryProvider).removeMember(spaceId, member.userId);
          ref.invalidate(sharedSpaceMembersProvider(spaceId));
          ref.invalidate(sharedSpacesProvider);
          if (isLeaving && context.mounted) {
            await context.maybePop();
          } else if (context.mounted) {
            ImmichToast.show(context: context, msg: '${member.name} removed', toastType: ToastType.success);
          }
        } catch (e) {
          if (context.mounted) {
            ImmichToast.show(context: context, msg: 'Failed to remove member', toastType: ToastType.error);
          }
        }
      }
    }

    Future<void> updateRole(SharedSpaceMemberResponseDto member, SharedSpaceRole newRole) async {
      try {
        await ref.read(sharedSpaceApiRepositoryProvider).updateMember(spaceId, member.userId, newRole);
        ref.invalidate(sharedSpaceMembersProvider(spaceId));
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            msg: '${member.name} is now ${newRole.value}',
            toastType: ToastType.success,
          );
        }
      } catch (e) {
        if (context.mounted) {
          ImmichToast.show(context: context, msg: 'Failed to update role', toastType: ToastType.error);
        }
      }
    }

    void showMemberActions(SharedSpaceMemberResponseDto member, bool isOwner) {
      showModalBottomSheet(
        context: context,
        builder: (ctx) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(member.name, style: context.textTheme.titleMedium),
              ),
              if (isOwner && member.role != SharedSpaceMemberResponseDtoRoleEnum.owner) ...[
                ListTile(
                  leading: const Icon(Icons.edit_outlined),
                  title: const Text('Set as Editor'),
                  trailing: member.role == SharedSpaceMemberResponseDtoRoleEnum.editor ? const Icon(Icons.check) : null,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    updateRole(member, SharedSpaceRole.editor);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.visibility_outlined),
                  title: const Text('Set as Viewer'),
                  trailing: member.role == SharedSpaceMemberResponseDtoRoleEnum.viewer ? const Icon(Icons.check) : null,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    updateRole(member, SharedSpaceRole.viewer);
                  },
                ),
                const Divider(),
                ListTile(
                  leading: Icon(Icons.person_remove_outlined, color: Theme.of(ctx).colorScheme.error),
                  title: Text('Remove from Space', style: TextStyle(color: Theme.of(ctx).colorScheme.error)),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    removeMember(member);
                  },
                ),
              ],
              if (!isOwner && member.userId == currentUser?.id)
                ListTile(
                  leading: Icon(Icons.exit_to_app, color: Theme.of(ctx).colorScheme.error),
                  title: Text('Leave Space', style: TextStyle(color: Theme.of(ctx).colorScheme.error)),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    removeMember(member);
                  },
                ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Members'),
        centerTitle: false,
        actions: [
          membersAsync.when(
            data: (members) {
              final currentMember = getCurrentMember(members);
              if (currentMember?.role == SharedSpaceMemberResponseDtoRoleEnum.owner) {
                return IconButton(
                  icon: const Icon(Icons.person_add_outlined),
                  onPressed: () async {
                    final existingIds = members.map((m) => m.userId).toList();
                    await context.pushRoute(
                      SpaceMemberSelectionRoute(spaceId: spaceId, existingMemberIds: existingIds),
                    );
                    ref.invalidate(sharedSpaceMembersProvider(spaceId));
                  },
                  tooltip: 'Add Member',
                );
              }
              return const SizedBox.shrink();
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: membersAsync.when(
        data: (members) {
          final currentMember = getCurrentMember(members);
          final isOwner = currentMember?.role == SharedSpaceMemberResponseDtoRoleEnum.owner;

          return ListView.builder(
            itemCount: members.length,
            itemBuilder: (context, index) {
              final member = members[index];
              return ListTile(
                leading: CircleAvatar(child: Text(member.name.isNotEmpty ? member.name[0].toUpperCase() : '?')),
                title: Text(member.name),
                subtitle: Text(member.email),
                trailing: Chip(
                  label: Text(member.role.value, style: context.textTheme.labelSmall),
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                ),
                onTap:
                    (isOwner && member.role != SharedSpaceMemberResponseDtoRoleEnum.owner) ||
                        (!isOwner && member.userId == currentUser?.id)
                    ? () => showMemberActions(member, isOwner)
                    : null,
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Failed to load members: $error')),
      ),
    );
  }
}

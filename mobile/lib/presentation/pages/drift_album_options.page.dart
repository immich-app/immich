import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/pages/drift_user_selection.page.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

@RoutePage()
class DriftAlbumOptionsPage extends HookConsumerWidget {
  const DriftAlbumOptionsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final album = ref.watch(currentRemoteAlbumProvider);
    if (album == null) {
      return const SizedBox();
    }

    final sharedUsersAsync = ref.watch(remoteAlbumSharedUsersProvider(album.id));
    final userId = ref.watch(authProvider).userId;
    final activityEnabled = useState(album.isActivityEnabled);
    final isOwner = album.ownerId == userId;

    void showErrorMessage() {
      context.pop();
      ImmichToast.show(
        context: context,
        msg: "shared_album_section_people_action_error".t(context: context),
        toastType: ToastType.error,
        gravity: ToastGravity.BOTTOM,
      );
    }

    void leaveAlbum() async {
      try {
        await ref.read(remoteAlbumProvider.notifier).leaveAlbum(album.id, userId: userId);
        context.navigateTo(const DriftAlbumsRoute());
      } catch (_) {
        showErrorMessage();
      }
    }

    void removeUserFromAlbum(UserDto user) async {
      try {
        await ref.read(remoteAlbumProvider.notifier).removeUser(album.id, user.id);
        ref.invalidate(remoteAlbumSharedUsersProvider(album.id));
      } catch (_) {
        showErrorMessage();
      }

      context.pop();
    }

    Future<void> addUsers() async {
      final newUsers = await context.pushRoute<List<String>>(DriftUserSelectionRoute(album: album));

      if (newUsers == null || newUsers.isEmpty) {
        return;
      }

      try {
        await ref.read(remoteAlbumProvider.notifier).addUsers(album.id, newUsers);

        if (newUsers.isNotEmpty) {
          ImmichToast.show(
            context: context,
            msg: "users_added_to_album_count".t(context: context, args: {'count': newUsers.length}),
            toastType: ToastType.success,
          );
        }

        ref.invalidate(remoteAlbumSharedUsersProvider(album.id));
      } catch (e) {
        ImmichToast.show(
          context: context,
          msg: "Failed to add users to album: ${e.toString()}",
          toastType: ToastType.error,
        );
      }
    }

    void handleUserClick(UserDto user) {
      var actions = [];

      if (user.id == userId) {
        actions = [
          ListTile(
            leading: const Icon(Icons.exit_to_app_rounded),
            title: const Text("leave_album").t(context: context),
            onTap: leaveAlbum,
          ),
        ];
      }

      if (isOwner) {
        actions = [
          ListTile(
            leading: const Icon(Icons.person_remove_rounded),
            title: const Text("remove_user").t(context: context),
            onTap: () => removeUserFromAlbum(user),
          ),
        ];
      }

      showModalBottomSheet(
        backgroundColor: context.colorScheme.surfaceContainer,
        isScrollControlled: false,
        context: context,
        builder: (context) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(top: 24.0),
              child: Column(mainAxisSize: MainAxisSize.min, children: [...actions]),
            ),
          );
        },
      );
    }

    buildOwnerInfo() {
      if (isOwner) {
        final owner = ref.watch(currentUserProvider);
        return ListTile(
          leading: owner != null ? UserCircleAvatar(user: owner) : const SizedBox(),
          title: Text(album.ownerName, style: const TextStyle(fontWeight: FontWeight.w500)),
          subtitle: Text(owner?.email ?? "", style: TextStyle(color: context.colorScheme.onSurfaceSecondary)),
          trailing: Text("owner", style: context.textTheme.labelLarge).t(context: context),
        );
      } else {
        final usersProvider = ref.watch(driftUsersProvider);
        return usersProvider.maybeWhen(
          data: (users) {
            final user = users.firstWhereOrNull((u) => u.id == album.ownerId);

            if (user == null) {
              return const SizedBox();
            }

            return ListTile(
              leading: UserCircleAvatar(user: user, radius: 22),
              title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.w500)),
              subtitle: Text(user.email, style: TextStyle(color: context.colorScheme.onSurfaceSecondary)),
              trailing: Text("owner", style: context.textTheme.labelLarge).t(context: context),
            );
          },
          orElse: () => const SizedBox(),
        );
      }
    }

    buildSharedUsersList() {
      return sharedUsersAsync.maybeWhen(
        data: (sharedUsers) => ListView.builder(
          primary: false,
          shrinkWrap: true,
          itemCount: sharedUsers.length,
          itemBuilder: (context, index) {
            final user = sharedUsers[index];
            return ListTile(
              leading: UserCircleAvatar(user: user, radius: 22),
              title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.w500)),
              subtitle: Text(user.email, style: TextStyle(color: context.colorScheme.onSurfaceSecondary)),
              trailing: userId == user.id || isOwner ? const Icon(Icons.more_horiz_rounded) : const SizedBox(),
              onTap: userId == user.id || isOwner ? () => handleUserClick(user) : null,
            );
          },
        ),
        orElse: () => const Center(child: CircularProgressIndicator()),
      );
    }

    buildSectionTitle(String text) {
      return Padding(
        padding: const EdgeInsets.all(16.0),
        child: Text(text, style: context.textTheme.bodySmall),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.maybePop(null),
        ),
        centerTitle: true,
        title: Text("options".t(context: context)),
      ),
      body: ListView(
        children: [
          const SizedBox(height: 8),
          if (isOwner)
            SwitchListTile.adaptive(
              value: activityEnabled.value,
              onChanged: (bool value) async {
                activityEnabled.value = value;
                await ref.read(remoteAlbumProvider.notifier).setActivityStatus(album.id, value);
              },
              activeThumbColor: activityEnabled.value ? context.primaryColor : context.themeData.disabledColor,
              dense: true,
              title: Text(
                "comments_and_likes",
                style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
              ).t(context: context),
              subtitle: Text(
                "let_others_respond",
                style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
              ).t(context: context),
            ),
          buildSectionTitle("shared_album_section_people_title".t(context: context)),
          if (isOwner) ...[
            ListTile(
              leading: const Icon(Icons.person_add_rounded),
              title: Text("invite_people".t(context: context)),
              onTap: () async => addUsers(),
            ),
            const Divider(indent: 16),
          ],
          buildOwnerInfo(),
          buildSharedUsersList(),
        ],
      ),
    );
  }
}

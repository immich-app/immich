import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/authentication.provider.dart';
import 'package:immich_mobile/utils/immich_loading_overlay.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

@RoutePage()
class AlbumOptionsPage extends HookConsumerWidget {
  final Album album;

  const AlbumOptionsPage({super.key, required this.album});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedUsers = useState(album.sharedUsers.toList());
    final owner = album.owner.value;
    final userId = ref.watch(authenticationProvider).userId;
    final activityEnabled = useState(album.activityEnabled);
    final isProcessing = useProcessingOverlay();
    final isOwner = owner?.id == userId;

    void showErrorMessage() {
      context.pop();
      ImmichToast.show(
        context: context,
        msg: "shared_album_section_people_action_error".tr(),
        toastType: ToastType.error,
        gravity: ToastGravity.BOTTOM,
      );
    }

    void leaveAlbum() async {
      isProcessing.value = true;

      try {
        final isSuccess =
            await ref.read(albumProvider.notifier).leaveAlbum(album);

        if (isSuccess) {
          context.navigateTo(
            TabControllerRoute(children: [AlbumsRoute()]),
          );
        } else {
          showErrorMessage();
        }
      } catch (_) {
        showErrorMessage();
      }

      isProcessing.value = false;
    }

    void removeUserFromAlbum(User user) async {
      isProcessing.value = true;

      try {
        await ref.read(albumProvider.notifier).removeUser(album, user);
        album.sharedUsers.remove(user);
        sharedUsers.value = album.sharedUsers.toList();
      } catch (error) {
        showErrorMessage();
      }

      context.pop();
      isProcessing.value = false;
    }

    void handleUserClick(User user) {
      var actions = [];

      if (user.id == userId) {
        actions = [
          ListTile(
            leading: const Icon(Icons.exit_to_app_rounded),
            title: const Text("shared_album_section_people_action_leave").tr(),
            onTap: leaveAlbum,
          ),
        ];
      }

      if (isOwner) {
        actions = [
          ListTile(
            leading: const Icon(Icons.person_remove_rounded),
            title: const Text("shared_album_section_people_action_remove_user")
                .tr(),
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
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [...actions],
              ),
            ),
          );
        },
      );
    }

    buildOwnerInfo() {
      return ListTile(
        leading:
            owner != null ? UserCircleAvatar(user: owner) : const SizedBox(),
        title: Text(
          album.owner.value?.name ?? "",
          style: const TextStyle(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          album.owner.value?.email ?? "",
          style: TextStyle(color: context.colorScheme.onSurfaceSecondary),
        ),
        trailing: Text(
          "shared_album_section_people_owner_label",
          style: context.textTheme.labelLarge,
        ).tr(),
      );
    }

    buildSharedUsersList() {
      return ListView.builder(
        primary: false,
        shrinkWrap: true,
        itemCount: sharedUsers.value.length,
        itemBuilder: (context, index) {
          final user = sharedUsers.value[index];
          return ListTile(
            leading: UserCircleAvatar(
              user: user,
              radius: 22,
            ),
            title: Text(
              user.name,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
            subtitle: Text(
              user.email,
              style: TextStyle(
                color: context.colorScheme.onSurfaceSecondary,
              ),
            ),
            trailing: userId == user.id || isOwner
                ? const Icon(Icons.more_horiz_rounded)
                : const SizedBox(),
            onTap: userId == user.id || isOwner
                ? () => handleUserClick(user)
                : null,
          );
        },
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
        title: Text("translated_text_options".tr()),
      ),
      body: ListView(
        children: [
          if (isOwner && album.shared)
            SwitchListTile.adaptive(
              value: activityEnabled.value,
              onChanged: (bool value) async {
                activityEnabled.value = value;
                if (await ref
                    .read(albumProvider.notifier)
                    .setActivitystatus(album, value)) {
                  album.activityEnabled = value;
                }
              },
              activeColor: activityEnabled.value
                  ? context.primaryColor
                  : context.themeData.disabledColor,
              dense: true,
              title: Text(
                "shared_album_activity_setting_title",
                style: context.textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.w500),
              ).tr(),
              subtitle: Text(
                "shared_album_activity_setting_subtitle",
                style: context.textTheme.labelLarge?.copyWith(
                  color: context.colorScheme.onSurfaceSecondary,
                ),
              ).tr(),
            ),
          buildSectionTitle("shared_album_section_people_title".tr()),
          buildOwnerInfo(),
          buildSharedUsersList(),
        ],
      ),
    );
  }
}

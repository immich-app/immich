import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/album/album_title.provider.dart';
import 'package:immich_mobile/providers/album/suggested_shared_users.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

@RoutePage()
class AlbumSharedUserSelectionPage extends HookConsumerWidget {
  const AlbumSharedUserSelectionPage({super.key, required this.assets});

  final Set<Asset> assets;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedUsersList = useState<Set<User>>({});
    final suggestedShareUsers = ref.watch(otherUsersProvider);

    createSharedAlbum() async {
      var newAlbum = await ref.watch(albumProvider.notifier).createAlbum(
            ref.watch(albumTitleProvider),
            assets,
          );

      if (newAlbum != null) {
        ref.watch(albumTitleProvider.notifier).clearAlbumTitle();
        context.maybePop(true);
        context.navigateTo(TabControllerRoute(children: [AlbumsRoute()]));
      }

      ScaffoldMessenger(
        child: SnackBar(
          content: Text(
            'select_user_for_sharing_page_err_album',
            style: context.textTheme.bodyLarge?.copyWith(
              color: context.primaryColor,
            ),
          ).tr(),
        ),
      );
    }

    buildTileIcon(User user) {
      if (sharedUsersList.value.contains(user)) {
        return CircleAvatar(
          backgroundColor: context.primaryColor,
          child: const Icon(
            Icons.check_rounded,
            size: 25,
          ),
        );
      } else {
        return UserCircleAvatar(
          user: user,
        );
      }
    }

    buildUserList(List<User> users) {
      List<Widget> usersChip = [];

      for (var user in sharedUsersList.value) {
        usersChip.add(
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Chip(
              backgroundColor: context.primaryColor.withOpacity(0.15),
              label: Text(
                user.email,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.black87,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        );
      }
      return ListView(
        children: [
          Wrap(
            children: [...usersChip],
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: const Text(
              'select_user_for_sharing_page_share_suggestions',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ).tr(),
          ),
          ListView.builder(
            primary: false,
            shrinkWrap: true,
            itemBuilder: ((context, index) {
              return ListTile(
                leading: buildTileIcon(users[index]),
                title: Text(
                  users[index].email,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                onTap: () {
                  if (sharedUsersList.value.contains(users[index])) {
                    sharedUsersList.value = sharedUsersList.value
                        .where(
                          (selectedUser) => selectedUser.id != users[index].id,
                        )
                        .toSet();
                  } else {
                    sharedUsersList.value = {
                      ...sharedUsersList.value,
                      users[index],
                    };
                  }
                },
              );
            }),
            itemCount: users.length,
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'share_invite',
          style: TextStyle(color: context.primaryColor),
        ).tr(),
        elevation: 0,
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () async {
            context.maybePop();
          },
        ),
        actions: [
          TextButton(
            style: TextButton.styleFrom(
              foregroundColor: context.primaryColor,
            ),
            onPressed: sharedUsersList.value.isEmpty ? null : createSharedAlbum,
            child: const Text(
              "share_create_album",
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                // color: context.primaryColor,
              ),
            ).tr(),
          ),
        ],
      ),
      body: suggestedShareUsers.widgetWhen(
        onData: (users) {
          return buildUserList(users);
        },
      ),
    );
  }
}

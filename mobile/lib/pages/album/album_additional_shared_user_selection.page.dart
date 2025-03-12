import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/suggested_shared_users.provider.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

@RoutePage()
class AlbumAdditionalSharedUserSelectionPage extends HookConsumerWidget {
  final Album album;

  const AlbumAdditionalSharedUserSelectionPage({
    super.key,
    required this.album,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<UserDto>> suggestedShareUsers =
        ref.watch(otherUsersProvider);
    final sharedUsersList = useState<Set<UserDto>>({});

    addNewUsersHandler() {
      context.maybePop(sharedUsersList.value.map((e) => e.uid).toList());
    }

    buildTileIcon(UserDto user) {
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

    buildUserList(List<UserDto> users) {
      List<Widget> usersChip = [];

      for (var user in sharedUsersList.value) {
        usersChip.add(
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Chip(
              backgroundColor: context.primaryColor.withValues(alpha: 0.15),
              label: Text(
                user.name,
                style: const TextStyle(
                  fontSize: 12,
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
            child: Text(
              'select_additional_user_for_sharing_page_suggestions'.tr(),
              style: const TextStyle(
                fontSize: 14,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ListView.builder(
            primary: false,
            shrinkWrap: true,
            itemBuilder: ((context, index) {
              return ListTile(
                leading: buildTileIcon(users[index]),
                dense: true,
                title: Text(
                  users[index].name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                subtitle: Text(
                  users[index].email,
                  style: const TextStyle(
                    fontSize: 12,
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
        title: const Text(
          'share_invite',
        ).tr(),
        elevation: 0,
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () {
            context.maybePop(null);
          },
        ),
        actions: [
          TextButton(
            onPressed:
                sharedUsersList.value.isEmpty ? null : addNewUsersHandler,
            child: const Text(
              "share_add",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ).tr(),
          ),
        ],
      ),
      body: suggestedShareUsers.widgetWhen(
        onData: (users) {
          for (var sharedUsers in album.sharedUsers) {
            users.removeWhere(
              (u) => u.uid == sharedUsers.id || u.uid == album.ownerId,
            );
          }

          return buildUserList(users);
        },
      ),
    );
  }
}

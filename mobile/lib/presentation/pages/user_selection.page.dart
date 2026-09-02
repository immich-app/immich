import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

// TODO: Refactor this provider when we have user provider/service/repository pattern in place
final usersProvider = FutureProvider.autoDispose<List<UserDto>>((ref) async {
  final drift = ref.watch(driftProvider);
  final currentUser = ref.watch(currentUserProvider);

  final userEntities = await drift.managers.userEntity.get();

  final users = userEntities
      .map(
        (entity) => UserDto(
          id: entity.id,
          name: entity.name,
          email: entity.email,
          isPartnerSharedBy: false,
          isPartnerSharedWith: false,
          avatarColor: entity.avatarColor,
          memoryEnabled: true,
          inTimeline: true,
          profileChangedAt: entity.profileChangedAt,
          hasProfileImage: entity.hasProfileImage,
        ),
      )
      .toList();

  users.removeWhere((u) => currentUser?.id == u.id);

  return users;
});

@RoutePage()
class UserSelectionPage extends HookConsumerWidget {
  final RemoteAlbum album;

  const UserSelectionPage({super.key, required this.album});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<UserDto>> suggestedShareUsers = ref.watch(usersProvider);
    final sharedUsers = ref.watch(remoteAlbumSharedUsersProvider(album.id));
    final sharedUsersList = useState<Set<UserDto>>({});

    void addNewUsersHandler() {
      unawaited(context.maybePop(sharedUsersList.value.map((e) => e.id).toList()));
    }

    Widget buildTileIcon(UserDto user) {
      if (sharedUsersList.value.contains(user)) {
        return CircleAvatar(backgroundColor: context.primaryColor, child: const Icon(Icons.check_rounded, size: 25));
      } else {
        return UserCircleAvatar(user: user);
      }
    }

    ListView buildUserList(List<UserDto> users) {
      final List<Widget> usersChip = [];

      for (var user in sharedUsersList.value) {
        usersChip.add(
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Chip(
              backgroundColor: context.primaryColor.withValues(alpha: 0.15),
              label: Text(user.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
        );
      }
      return ListView(
        children: [
          Wrap(children: [...usersChip]),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              context.t.suggestions,
              style: const TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.bold),
            ),
          ),
          ListView.builder(
            primary: false,
            shrinkWrap: true,
            itemBuilder: (context, index) {
              return ListTile(
                leading: buildTileIcon(users[index]),
                dense: true,
                title: Text(users[index].name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                subtitle: Text(users[index].email, style: const TextStyle(fontSize: 12)),
                onTap: () {
                  if (sharedUsersList.value.contains(users[index])) {
                    sharedUsersList.value = sharedUsersList.value
                        .where((selectedUser) => selectedUser.id != users[index].id)
                        .toSet();
                  } else {
                    sharedUsersList.value = {...sharedUsersList.value, users[index]};
                  }
                },
              );
            },
            itemCount: users.length,
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(context.t.invite_to_album),
        elevation: 0,
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () {
            unawaited(context.maybePop(null));
          },
        ),
        actions: [
          TextButton(
            onPressed: sharedUsersList.value.isEmpty ? null : () => addNewUsersHandler(),
            child: Text(context.t.add, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: suggestedShareUsers.widgetWhen(
        onData: (users) {
          return sharedUsers.when(
            data: (albumSharedUsers) {
              // Filter out users that are already shared with this album and the owner
              final filteredUsers = users.where((user) {
                return !albumSharedUsers.any((sharedUser) => sharedUser.id == user.id) && user.id != album.ownerId;
              }).toList();

              return buildUserList(filteredUsers);
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) {
              // If we can't load shared users, just filter out the owner
              final filteredUsers = users.where((user) => user.id != album.ownerId).toList();
              return buildUserList(filteredUsers);
            },
          );
        },
      ),
    );
  }
}

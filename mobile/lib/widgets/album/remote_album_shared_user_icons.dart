import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class RemoteAlbumSharedUserIcons extends ConsumerWidget {
  final String albumId;

  const RemoteAlbumSharedUserIcons({
    super.key,
    required this.albumId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedUsersAsync = ref.watch(remoteAlbumSharedUsersProvider(albumId));

    return sharedUsersAsync.when(
      data: (sharedUsers) {
        if (sharedUsers.isEmpty) {
          return const SizedBox();
        }

        return GestureDetector(
          onTap: () => context.pushRoute(const AlbumOptionsRoute()),
          child: Container(
            margin: const EdgeInsets.only(top: 8),
            height: 50,
            child: ListView.builder(
              padding: const EdgeInsets.only(left: 16, bottom: 8),
              scrollDirection: Axis.horizontal,
              itemBuilder: ((context, index) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: UserCircleAvatar(
                    user: sharedUsers[index],
                    radius: 18,
                    size: 36,
                  ),
                );
              }),
              itemCount: sharedUsers.length,
            ),
          ),
        );
      },
      loading: () => const SizedBox(),
      error: (error, stack) => const SizedBox(),
    );
  }
}

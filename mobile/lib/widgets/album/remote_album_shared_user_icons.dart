import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
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

        return SizedBox(
          height: 50,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemBuilder: ((context, index) {
              return Padding(
                padding: const EdgeInsets.only(right: 4.0),
                child: UserCircleAvatar(
                  user: sharedUsers[index],
                  radius: 18,
                  size: 36,
                  hasBorder: true,
                ),
              );
            }),
            itemCount: sharedUsers.length,
          ),
        );
      },
      loading: () => const SizedBox(),
      error: (error, stack) => const SizedBox(),
    );
  }
}

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class AlbumSharedUserIcons extends HookConsumerWidget {
  const AlbumSharedUserIcons({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharedUsers = useRef<List<UserDto>>(const []);
    sharedUsers.value = ref.watch(
      currentAlbumProvider.select((album) {
        if (album == null) {
          return const [];
        }

        if (album.sharedUsers.length == sharedUsers.value.length) {
          return sharedUsers.value;
        }

        return album.sharedUsers.map((u) => u.toDto()).toList(growable: false);
      }),
    );

    if (sharedUsers.value.isEmpty) {
      return const SizedBox();
    }

    return GestureDetector(
      onTap: () => context.pushRoute(const AlbumOptionsRoute()),
      child: SizedBox(
        height: 50,
        child: ListView.builder(
          padding: const EdgeInsets.only(left: 16),
          scrollDirection: Axis.horizontal,
          itemBuilder: ((context, index) {
            return Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: UserCircleAvatar(
                user: sharedUsers.value[index],
                radius: 18,
                size: 36,
              ),
            );
          }),
          itemCount: sharedUsers.value.length,
        ),
      ),
    );
  }
}

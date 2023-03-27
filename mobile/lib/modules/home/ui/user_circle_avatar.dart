import 'dart:math';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/transparent_image.dart';

class UserCircleAvatar extends ConsumerWidget {
  final double radius;
  final double size;
  const UserCircleAvatar({super.key, required this.radius, required this.size});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AuthenticationState authState = ref.watch(authenticationProvider);

    var profileImageUrl =
        '${Store.get(StoreKey.serverEndpoint)}/user/profile-image/${authState.userId}?d=${Random().nextInt(1024)}';
    return CircleAvatar(
      backgroundColor: Theme.of(context).primaryColor,
      radius: radius,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(50),
        child: FadeInImage(
          fit: BoxFit.cover,
          placeholder: MemoryImage(kTransparentImage),
          width: size,
          height: size,
          image: NetworkImage(
            profileImageUrl,
            headers: {
              "Authorization": "Bearer ${Store.get(StoreKey.accessToken)}"
            },
          ),
          fadeInDuration: const Duration(milliseconds: 200),
          imageErrorBuilder: (context, error, stackTrace) =>
              Image.memory(kTransparentImage),
        ),
      ),
    );
  }
}

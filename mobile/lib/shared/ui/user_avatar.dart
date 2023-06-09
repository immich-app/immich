import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';

Widget userAvatar(BuildContext context, User u, {double? radius}) {
  final url =
      "${Store.get(StoreKey.serverEndpoint)}/user/profile-image/${u.id}";
  return CircleAvatar(
    radius: radius,
    backgroundColor: Theme.of(context).primaryColor.withAlpha(50),
    foregroundImage: CachedNetworkImageProvider(
      url,
      headers: {"Authorization": "Bearer ${Store.get(StoreKey.accessToken)}"},
      cacheKey: "user-${u.id}-profile",
    ),
    // silence errors if user has no profile image, use initials as fallback
    onForegroundImageError: (exception, stackTrace) {},
    child: Text((u.firstName[0] + u.lastName[0]).toUpperCase()),
  );
}

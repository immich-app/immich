import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/services/api.service.dart';

Widget userAvatar(BuildContext context, UserDto u, {double? radius}) {
  final url =
      "${Store.get(StoreKey.serverEndpoint)}/users/${u.uid}/profile-image";
  final nameFirstLetter = u.name.isNotEmpty ? u.name[0] : "";
  return CircleAvatar(
    radius: radius,
    backgroundColor: context.primaryColor.withAlpha(50),
    foregroundImage: CachedNetworkImageProvider(
      url,
      headers: ApiService.getRequestHeaders(),
      cacheKey: "user-${u.id}-profile",
    ),
    // silence errors if user has no profile image, use initials as fallback
    onForegroundImageError: (exception, stackTrace) {},
    child: Text(nameFirstLetter.toUpperCase()),
  );
}

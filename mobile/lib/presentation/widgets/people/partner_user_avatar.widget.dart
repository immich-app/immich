import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/services/api.service.dart';

class PartnerUserAvatar extends StatelessWidget {
  const PartnerUserAvatar({super.key, required this.partner});

  final PartnerUserDto partner;

  @override
  Widget build(BuildContext context) {
    final url = "${Store.get(StoreKey.serverEndpoint)}/users/${partner.id}/profile-image";
    final nameFirstLetter = partner.name.isNotEmpty ? partner.name[0] : "";
    return CircleAvatar(
      radius: 16,
      backgroundColor: context.primaryColor.withAlpha(50),
      foregroundImage: CachedNetworkImageProvider(
        url,
        headers: ApiService.getRequestHeaders(),
        cacheKey: "user-${partner.id}-profile",
      ),
      // silence errors if user has no profile image, use initials as fallback
      onForegroundImageError: (exception, stackTrace) {},
      child: Text(nameFirstLetter.toUpperCase()),
    );
  }
}

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';

// ignore: must_be_immutable
class ThumbnailWithInfo extends StatelessWidget {
  ThumbnailWithInfo({
    Key? key,
    required this.textInfo,
    this.imageUrl,
    this.noImageIcon,
    this.borderRadius = 10,
    required this.onTap,
  }) : super(key: key);

  final String textInfo;
  final String? imageUrl;
  final Function onTap;
  final IconData? noImageIcon;
  double borderRadius;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        onTap();
      },
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(borderRadius),
              color: context.colorScheme.surfaceVariant,
            ),
            child: imageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(borderRadius),
                    child: CachedNetworkImage(
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (context, url) {
                        return SizedBox.square(
                          dimension: 250,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: context.colorScheme.surfaceVariant,
                            ),
                          ),
                        );
                      },
                      imageUrl: imageUrl!,
                      httpHeaders: {
                        "Authorization":
                            "Bearer ${Store.get(StoreKey.accessToken)}",
                      },
                      errorWidget: (context, url, error) =>
                          const Icon(Icons.image_not_supported_outlined),
                    ),
                  )
                : Center(
                    child: Icon(
                      noImageIcon ?? Icons.not_listed_location,
                      color: context.primaryColor,
                    ),
                  ),
          ),
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(borderRadius),
              color: context.colorScheme.inverseSurface,
              gradient: LinearGradient(
                begin: FractionalOffset.topCenter,
                end: FractionalOffset.bottomCenter,
                colors: [
                  context.colorScheme.shadow.withOpacity(0),
                  textInfo == ''
                      ? context.colorScheme.shadow.withOpacity(0.1)
                      : context.colorScheme.shadow.withOpacity(0.2),
                ],
                stops: const [0.0, 1.0],
              ),
            ),
          ),
          Positioned(
            bottom: 12,
            left: 14,
            child: Text(
              textInfo == '' ? textInfo : textInfo.capitalize(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

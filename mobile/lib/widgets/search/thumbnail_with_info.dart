import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';

// ignore: must_be_immutable
class ThumbnailWithInfo extends StatelessWidget {
  ThumbnailWithInfo({
    super.key,
    required this.textInfo,
    this.imageUrl,
    this.noImageIcon,
    this.borderRadius = 10,
    required this.onTap,
  });

  final String textInfo;
  final String? imageUrl;
  final Function onTap;
  final IconData? noImageIcon;
  double borderRadius;

  @override
  Widget build(BuildContext context) {
    var textAndIconColor =
        context.isDarkTheme ? Colors.grey[100] : Colors.grey[700];
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
              color: context.isDarkTheme ? Colors.grey[900] : Colors.grey[100],
            ),
            child: imageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(borderRadius),
                    child: CachedNetworkImage(
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                      imageUrl: imageUrl!,
                      httpHeaders: {
                        "x-immich-user-token": Store.get(StoreKey.accessToken),
                      },
                      errorWidget: (context, url, error) =>
                          const Icon(Icons.image_not_supported_outlined),
                    ),
                  )
                : Center(
                    child: Icon(
                      noImageIcon ?? Icons.not_listed_location,
                      color: textAndIconColor,
                    ),
                  ),
          ),
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(borderRadius),
              color: Colors.white,
              gradient: LinearGradient(
                begin: FractionalOffset.topCenter,
                end: FractionalOffset.bottomCenter,
                colors: [
                  Colors.grey.withOpacity(0.0),
                  textInfo == ''
                      ? Colors.black.withOpacity(0.1)
                      : Colors.black.withOpacity(0.5),
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

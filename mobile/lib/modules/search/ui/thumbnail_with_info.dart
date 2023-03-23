import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/store.dart';

class ThumbnailWithInfo extends StatelessWidget {
  const ThumbnailWithInfo({
    Key? key,
    required this.textInfo,
    this.imageUrl,
    this.noImageIcon,
    required this.onTap,
  }) : super(key: key);

  final String textInfo;
  final String? imageUrl;
  final Function onTap;
  final IconData? noImageIcon;

  @override
  Widget build(BuildContext context) {
    var isDarkMode = Theme.of(context).brightness == Brightness.dark;
    var textAndIconColor = isDarkMode ? Colors.grey[100] : Colors.grey[700];
    return GestureDetector(
      onTap: () {
        onTap();
      },
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              color: isDarkMode ? Colors.grey[900] : Colors.grey[100],
            ),
            child: imageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: CachedNetworkImage(
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                      imageUrl: imageUrl!,
                      httpHeaders: {
                        "Authorization":
                            "Bearer ${Store.get(StoreKey.accessToken)}"
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
          Positioned(
            bottom: 12,
            left: 14,
            child: Text(
              textInfo,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:immich_mobile/constants/hive_box.dart';

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
    var box = Hive.box(userInfoBox);
    var isDarkMode = Theme.of(context).brightness == Brightness.dark;
    var textAndIconColor = isDarkMode ? Colors.grey[100] : Colors.grey[700];
    return GestureDetector(
      onTap: () {
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.only(right: 8.0),
        child: SizedBox(
          width: MediaQuery.of(context).size.width / 3,
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(25),
                  color: isDarkMode ? Colors.grey[900] : Colors.grey[100],
                  border: Border.all(
                    color: isDarkMode ? Colors.grey[800]! : Colors.grey[400]!,
                    width: 1,
                  ),
                ),
                child: imageUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: CachedNetworkImage(
                          width: 250,
                          height: 250,
                          fit: BoxFit.cover,
                          imageUrl: imageUrl!,
                          httpHeaders: {
                            "Authorization": "Bearer ${box.get(accessTokenKey)}"
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
                child: SizedBox(
                  width: MediaQuery.of(context).size.width / 3,
                  child: Text(
                    textInfo,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

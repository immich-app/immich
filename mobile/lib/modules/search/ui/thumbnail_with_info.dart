import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/utils/capitalize_first_letter.dart';

class ThumbnailWithInfo extends StatelessWidget {
  const ThumbnailWithInfo(
      {Key? key,
      required this.textInfo,
      required this.imageUrl,
      required this.onTap})
      : super(key: key);

  final String textInfo;
  final String imageUrl;
  final Function onTap;

  @override
  Widget build(BuildContext context) {
    var box = Hive.box(userInfoBox);

    return GestureDetector(
      onTap: () {
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.only(right: 8.0),
        child: SizedBox(
          width: MediaQuery.of(context).size.width / 2,
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              Container(
                foregroundDecoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: Colors.black26,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    width: 250,
                    height: 250,
                    fit: BoxFit.cover,
                    imageUrl: imageUrl,
                    httpHeaders: {
                      "Authorization": "Bearer ${box.get(accessTokenKey)}"
                    },
                  ),
                ),
              ),
              Positioned(
                bottom: 8,
                left: 10,
                child: SizedBox(
                  width: MediaQuery.of(context).size.width / 3,
                  child: Text(
                    textInfo,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
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

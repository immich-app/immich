import 'dart:io';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:immich_mobile/pages/editing/crop.page.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/widgets/common/immich_image.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';

@immutable
class EditImagePage extends StatelessWidget {
  final dynamic imageSource; // Can be either Asset or Image
  const EditImagePage({super.key, required this.imageSource});

  void _navigateToCropImagePage(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CropImagePage(image: _getImageWidget()),
      ),
    );
  }

  ImageProvider _getImageProvider() {
    if (imageSource is Asset) {
      return ImmichImage.imageProvider(asset: imageSource);
    } else if (imageSource is Image) {
      return (imageSource as Image).image;
    } else {
      throw Exception('Invalid image source type');
    }
  }

  Image _getImageWidget() {
    if (imageSource is Asset) {
      return Image(image: ImmichImage.imageProvider(asset: imageSource));
    } else if (imageSource is Image) {
      return imageSource;
    } else {
      throw Exception('Invalid image source type');
    }
  }

  @override
  Widget build(BuildContext context) {
    final ImageProvider provider = _getImageProvider();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Colors.white, size: 24),
          onPressed: () =>
              Navigator.of(context).popUntil((route) => route.isFirst),
        ),
        actions: <Widget>[
          IconButton(
              icon:
                  const Icon(Icons.done_rounded, color: Colors.white, size: 24),
              onPressed: () {
                //Save the image into cloud
                if (imageSource is Asset) {
                  ImmichToast.show(
                    durationInSecond: 1,
                    context: context,
                    msg: 'No edits made!',
                    gravity: ToastGravity.BOTTOM,
                  );
                  
                } else {
                  
                }
              }),
        ],
      ),
      body: Column(
        children: <Widget>[
          Expanded(
            child: Image(image: provider),
          ),
          Container(
            height: 80,
            color: Colors.black,
          ),
        ],
      ),
      bottomNavigationBar: Container(
        height: 60,
        margin: const EdgeInsets.only(bottom: 50, right: 10, left: 10, top: 10),
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: <Widget>[
            IconButton(
                icon: Icon(
                    Platform.isAndroid
                        ? Icons.crop_rotate_rounded
                        : Icons.crop_rotate_rounded,
                    color: Colors.white),
                onPressed: () => _navigateToCropImagePage(context)),
          ],
        ),
      ),
    );
  }
}

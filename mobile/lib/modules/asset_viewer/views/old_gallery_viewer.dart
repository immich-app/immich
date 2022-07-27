// import 'package:auto_route/auto_route.dart';
// import 'package:flutter/material.dart';
// import 'package:hive/hive.dart';
// import 'package:immich_mobile/constants/hive_box.dart';
// import 'package:immich_mobile/modules/asset_viewer/ui/remote_photo_view.dart';
// import 'package:immich_mobile/modules/asset_viewer/views/image_viewer_page.dart';
// import 'package:immich_mobile/routing/router.dart';
// import 'package:openapi/api.dart';
// import 'package:photo_view/photo_view.dart';
// import 'package:photo_view/photo_view_gallery.dart';

// class old_GalleryViewerPage extends StatefulWidget {
//   final List<AssetResponseDto> assetList;
//   final AssetResponseDto asset;
//   final Box<dynamic> box;
//   final String thumbnailRequestUrl;

//   const old_GalleryViewerPage({
//     Key? key,
//     required this.assetList,
//     required this.asset,
//     required this.box,
//     required this.thumbnailRequestUrl,
//   }) : super(key: key);

//   @override
//   State<StatefulWidget> createState() => old_GalleryViewerPageState();
// }

// class old_GalleryViewerPageState extends State<old_GalleryViewerPage> {
//   @override
//   Widget build(BuildContext context) => Scaffold(
//         body: PhotoViewGallery.builder(
//             itemCount: widget.assetList.length,
//             builder: (context, index) {
//               return PhotoViewGalleryPageOptions(
//                 imageProvider: NetworkImage(
//                     'https://www.nationalgeographic.com/animals/mammals/facts/domestic-dog'),
//                 initialScale: PhotoViewComputedScale.contained * 0.8,
//                 minScale: PhotoViewComputedScale.contained * 0.8,
//                 maxScale: PhotoViewComputedScale.covered * 1.1,
//                 // imageProvider: testClass(
//                 //   thumbnailUrl: widget.thumbnailRequestUrl,
//                 //   imageUrl:
//                 //       '${widget.box.get(serverEndpointKey)}/asset/file?aid=${widget.asset.deviceAssetId}&did=${widget.asset.deviceId}&isThumb=false',
//                 //   authToken: "Bearer ${widget.box.get(accessTokenKey)}",
//                 // ).returnImage(),
//               );
//             }),
//       );
// }

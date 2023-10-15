import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/modules/shared_link/providers/shared_link.provider.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class SharedLinkItem extends ConsumerWidget {
  final SharedLinkResponseDto sharedLinkResponse;

  const SharedLinkItem(this.sharedLinkResponse, {super.key});

  String? getThumbnailUrl() {
    if (sharedLinkResponse.album != null) {
      final thumbAsset = sharedLinkResponse.album!.albumThumbnailAssetId;
      if (thumbAsset != null) {
        return getThumbnailUrlForRemoteId(thumbAsset);
      }
    }
    if (sharedLinkResponse.assets.isNotEmpty) {
      return getThumbnailUrlForRemoteId(sharedLinkResponse.assets[0].id);
    }

    return null;
  }

  String getShareName() {
    if (sharedLinkResponse.type == SharedLinkType.ALBUM &&
        sharedLinkResponse.album != null) {
      return sharedLinkResponse.album!.albumName.toUpperCase();
    }
    if (sharedLinkResponse.type == SharedLinkType.INDIVIDUAL) {
      return "INDIVIDUAL SHARE";
    }
    return "Unknown Share Type";
  }

  bool isExpired() {
    if (sharedLinkResponse.expiresAt != null) {
      return DateTime.now().isAfter(sharedLinkResponse.expiresAt!);
    }
    return false;
  }

  Widget getExpiryDuration(bool isDarkMode) {
    var expiresText = "Expires ∞";
    if (sharedLinkResponse.expiresAt != null) {
      if (isExpired()) {
        return Text(
          "Expired",
          style: TextStyle(color: Colors.red[300]),
        );
      }
      final difference =
          sharedLinkResponse.expiresAt!.difference(DateTime.now());
      debugPrint("Difference: $difference");
      if (difference.inDays > 0) {
        expiresText = "in ${difference.inDays} days";
      } else if (difference.inHours > 0) {
        expiresText = "in ${difference.inHours} hours";
      } else if (difference.inMinutes > 0) {
        expiresText = "in ${difference.inMinutes} minutes";
      } else if (difference.inSeconds > 0) {
        expiresText = "in ${difference.inSeconds} seconds";
      }
    }
    return Text(
      expiresText,
      style: TextStyle(color: isDarkMode ? Colors.grey[400] : Colors.grey[600]),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeDate = Theme.of(context);
    final isDarkMode = themeDate.brightness == Brightness.dark;
    final thumbnailUrl = getThumbnailUrl();
    const imageSize = 100.0;

    copyShareLinkToClipboard() {
      final serverUrl = Store.tryGet(StoreKey.serverUrl);
      if (serverUrl == null) {
        ImmichToast.show(
          context: context,
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
          msg: 'Cannot fetch the server url',
        );
        return;
      }
      Clipboard.setData(
        ClipboardData(text: "$serverUrl/share/${sharedLinkResponse.key}"),
      ).then((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "Copied to clipboard",
              style: TextStyle(
                color: isDarkMode ? Colors.white : Colors.black,
              ),
            ),
            backgroundColor: themeDate.dialogBackgroundColor,
            duration: const Duration(seconds: 2),
          ),
        );
      });
    }

    deleteShareLink() async {
      return showDialog(
        context: context,
        builder: (BuildContext context) {
          return ConfirmDialog(
            title: "Delete Shared Link",
            content: "Are you sure you want to delete this shared link?",
            onOk: () => ref
                .read(sharedLinksStateProvider.notifier)
                .deleteLink(sharedLinkResponse.id),
          );
        },
      );
    }

    Widget buildThumbnail() {
      if (thumbnailUrl == null) {
        return Container(
          height: imageSize,
          width: imageSize,
          decoration: BoxDecoration(
            color: isDarkMode ? Colors.grey[800] : Colors.grey[200],
          ),
          child: Center(
            child: Icon(
              Icons.image_not_supported_outlined,
              color: isDarkMode ? Colors.grey[100] : Colors.grey[700],
            ),
          ),
        );
      }
      return SizedBox(
        width: imageSize,
        height: imageSize,
        child: Padding(
          padding: const EdgeInsets.only(right: 4.0),
          child: ThumbnailWithInfo(
            imageUrl: thumbnailUrl,
            key: key,
            textInfo: '',
            noImageIcon: Icons.image_not_supported_outlined,
            onTap: () {},
          ),
        ),
      );
    }

    buildInfoChip(String labelText) {
      return Padding(
        padding: const EdgeInsets.only(right: 10),
        child: Chip(
          backgroundColor: themeDate.primaryColor,
          label: Text(
            labelText,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: isDarkMode ? Colors.black : Colors.white,
            ),
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(25)),
          ),
        ),
      );
    }

    buildBottomInfo() {
      return Row(
        children: [
          if (sharedLinkResponse.allowUpload) buildInfoChip("Upload"),
          if (sharedLinkResponse.allowDownload) buildInfoChip("Download"),
          if (sharedLinkResponse.showMetadata) buildInfoChip("EXIF"),
        ],
      );
    }

    buildSharedLinkActions() {
      const actionIconSize = 20.0;
      return Row(
        children: [
          IconButton(
            splashRadius: 25,
            constraints: const BoxConstraints(),
            iconSize: actionIconSize,
            icon: const Icon(Icons.delete_outline),
            style: const ButtonStyle(
              tapTargetSize:
                  MaterialTapTargetSize.shrinkWrap, // the '2023' part
            ),
            onPressed: deleteShareLink,
          ),
          IconButton(
            splashRadius: 25,
            constraints: const BoxConstraints(),
            iconSize: actionIconSize,
            icon: const Icon(Icons.edit_outlined),
            style: const ButtonStyle(
              tapTargetSize:
                  MaterialTapTargetSize.shrinkWrap, // the '2023' part
            ),
            onPressed: () {},
          ),
          IconButton(
            splashRadius: 25,
            constraints: const BoxConstraints(),
            iconSize: actionIconSize,
            icon: const Icon(Icons.copy_outlined),
            style: const ButtonStyle(
              tapTargetSize:
                  MaterialTapTargetSize.shrinkWrap, // the '2023' part
            ),
            onPressed: copyShareLinkToClipboard,
          ),
        ],
      );
    }

    buildSharedLinkDetails() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          getExpiryDuration(isDarkMode),
          Padding(
            padding: const EdgeInsets.only(top: 5),
            child: Tooltip(
              verticalOffset: 0,
              decoration: BoxDecoration(
                color: themeDate.primaryColor.withOpacity(0.9),
                borderRadius: BorderRadius.circular(10),
              ),
              textStyle: TextStyle(
                color: isDarkMode ? Colors.black : Colors.white,
                fontWeight: FontWeight.bold,
              ),
              message: getShareName(),
              preferBelow: false,
              triggerMode: TooltipTriggerMode.tap,
              child: Text(
                getShareName(),
                style: TextStyle(
                  color: themeDate.primaryColor,
                  fontWeight: FontWeight.bold,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Tooltip(
                  verticalOffset: 0,
                  decoration: BoxDecoration(
                    color: themeDate.primaryColor.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  textStyle: TextStyle(
                    color: isDarkMode ? Colors.black : Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  message: sharedLinkResponse.description ?? "",
                  preferBelow: false,
                  triggerMode: TooltipTriggerMode.tap,
                  child: Text(
                    sharedLinkResponse.description ?? "",
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 15),
                child: buildSharedLinkActions(),
              ),
            ],
          ),
          buildBottomInfo(),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 15),
              child: buildThumbnail(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(left: 15),
                child: buildSharedLinkDetails(),
              ),
            ),
          ],
        ),
        const Padding(
          padding: EdgeInsets.only(left: 20, right: 20, bottom: 20, top: 10),
          child: Divider(
            height: 0,
          ),
        ),
      ],
    );
  }
}

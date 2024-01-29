import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';

class StackedChildren extends StatelessWidget {
  final int stackIndex;
  final List<Asset> stackElements;
  final Function(int)? onTap;

  const StackedChildren({
    super.key,
    required this.stackIndex,
    required this.stackElements,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      shrinkWrap: true,
      scrollDirection: Axis.horizontal,
      itemCount: stackElements.length,
      itemBuilder: (context, i) {
        final assetId = stackElements.elementAt(i).remoteId;
        return Padding(
          padding: const EdgeInsets.only(right: 10),
          child: GestureDetector(
            onTap: () => onTap?.call(i),
            child: Container(
              width: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(6),
                border: (stackIndex == -1 && i == 0) || i == stackIndex
                    ? Border.all(
                        color: Colors.white,
                        width: 2,
                      )
                    : null,
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: CachedNetworkImage(
                  fit: BoxFit.cover,
                  imageUrl:
                      '${Store.get(StoreKey.serverEndpoint)}/asset/thumbnail/$assetId',
                  httpHeaders: {
                    "Authorization":
                        "Bearer ${Store.get(StoreKey.accessToken)}",
                  },
                  errorWidget: (context, url, error) =>
                      const Icon(Icons.image_not_supported_outlined),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

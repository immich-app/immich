import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/shared/models/store.dart';

class CuratedPeopleRow extends StatelessWidget {
  final List<CuratedContent> content;

  /// Callback with the content and the index when tapped
  final Function(CuratedContent, int)? onTap;
  final Function(CuratedContent, int)? onNameTap;

  const CuratedPeopleRow({
    super.key,
    required this.content,
    this.onTap,
    required this.onNameTap,
  });

  @override
  Widget build(BuildContext context) {
    const imageSize = 100.0;

    // Guard empty [content]
    if (content.isEmpty) {
      // Return empty thumbnail
      return Align(
        alignment: Alignment.centerLeft,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: SizedBox(
            width: imageSize,
            height: imageSize,
            child: ThumbnailWithInfo(
              textInfo: '',
              onTap: () {},
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
      ),
      itemBuilder: (context, index) {
        final object = content[index];
        final faceThumbnailRequestUrl =
            '${Store.get(StoreKey.serverEndpoint)}/person/${object.id}/thumbnail';

        return Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: Column(
            children: [
              GestureDetector(
                onTap: () => onTap?.call(object, index),
                child: SizedBox(
                  height: imageSize,
                  width: imageSize,
                  child: CircleAvatar(
                    maxRadius: imageSize / 2,
                    backgroundImage: NetworkImage(
                      faceThumbnailRequestUrl,
                      headers: {
                        "Authorization":
                            "Bearer ${Store.get(StoreKey.accessToken)}"
                      },
                    ),
                  ),
                ),
              ),
              if (object.label == "")
                GestureDetector(
                  onTap: () => onNameTap?.call(object, index),
                  child: Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      "Add name",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).primaryColor,
                      ),
                    ),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text(
                    object.label,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                )
            ],
          ),
        );
      },
      itemCount: content.length,
    );
  }
}

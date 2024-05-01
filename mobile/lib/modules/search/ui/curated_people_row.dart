import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_curated_content.model.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class CuratedPeopleRow extends StatelessWidget {
  final List<SearchCuratedContent> content;
  final EdgeInsets? padding;

  /// Callback with the content and the index when tapped
  final Function(SearchCuratedContent, int)? onTap;
  final Function(SearchCuratedContent, int)? onNameTap;

  const CuratedPeopleRow({
    super.key,
    required this.content,
    this.onTap,
    this.padding,
    required this.onNameTap,
  });

  @override
  Widget build(BuildContext context) {
    const imageSize = 60.0;

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
      padding: padding,
      scrollDirection: Axis.horizontal,
      itemBuilder: (context, index) {
        final person = content[index];
        final headers = {
          "x-immich-user-token": Store.get(StoreKey.accessToken),
        };
        return Padding(
          padding: const EdgeInsets.only(right: 18.0),
          child: SizedBox(
            width: imageSize,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                GestureDetector(
                  onTap: () => onTap?.call(person, index),
                  child: SizedBox(
                    height: imageSize,
                    child: Material(
                      shape: const CircleBorder(side: BorderSide.none),
                      elevation: 3,
                      child: CircleAvatar(
                        maxRadius: imageSize / 2,
                        backgroundImage: NetworkImage(
                          getFaceThumbnailUrl(person.id),
                          headers: headers,
                        ),
                      ),
                    ),
                  ),
                ),
                if (person.label == "")
                  GestureDetector(
                    onTap: () => onNameTap?.call(person, index),
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(
                        "exif_bottom_sheet_person_add_person",
                        style: context.textTheme.labelLarge?.copyWith(
                          color: context.primaryColor,
                        ),
                      ).tr(),
                    ),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      person.label,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      style: context.textTheme.labelLarge,
                    ),
                  ),
              ],
            ),
          ),
        );
      },
      itemCount: content.length,
    );
  }
}

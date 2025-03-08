import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_curated_content.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class CuratedPeopleRow extends StatelessWidget {
  static const double imageSize = 60.0;

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
    return SizedBox(
      height: imageSize + 50,
      child: ListView.separated(
        padding: padding,
        scrollDirection: Axis.horizontal,
        separatorBuilder: (context, index) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final person = content[index];
          final headers = ApiService.getRequestHeaders();
          return Column(
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
              const SizedBox(height: 8),
              SizedBox(
                width: imageSize,
                child: _buildPersonLabel(context, person, index),
              ),
            ],
          );
        },
        itemCount: content.length,
      ),
    );
  }

  Widget _buildPersonLabel(
    BuildContext context,
    SearchCuratedContent person,
    int index,
  ) {
    if (person.label.isEmpty) {
      return GestureDetector(
        onTap: () => onNameTap?.call(person, index),
        child: Text(
          "exif_bottom_sheet_person_add_person",
          style: context.textTheme.labelLarge?.copyWith(
            color: context.primaryColor,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
        ).tr(),
      );
    }
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          person.label,
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          style: context.textTheme.labelLarge,
          maxLines: 2,
        ),
        if (person.subtitle != null)
          Text(
            person.subtitle!,
            textAlign: TextAlign.center,
          ),
      ],
    );
  }
}

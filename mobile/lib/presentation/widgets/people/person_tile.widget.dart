import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class PersonTile extends StatelessWidget {
  final bool isSelected;
  final Person person;
  final double imageSize;
  final Function() onTap;

  const PersonTile({
    super.key,
    required this.isSelected,
    required this.person,
    this.imageSize = 60.0,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2.0),
      child: LargeLeadingTile(
        title: Padding(
          padding: const EdgeInsets.only(right: 8),
          child: Text(
            person.name.nullIfEmpty ?? context.t.no_name,
            style: context.textTheme.bodyLarge?.copyWith(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: isSelected ? context.colorScheme.onPrimary : context.colorScheme.onSurface,
            ),
          ),
        ),
        leading: SizedBox(
          height: imageSize,
          child: Material(
            shape: const CircleBorder(side: BorderSide.none),
            elevation: 3,
            child: CircleAvatar(
              maxRadius: imageSize / 2,
              backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(person.id, updatedAt: person.updatedAt)),
            ),
          ),
        ),
        onTap: () => onTap(),
        selected: isSelected,
        selectedTileColor: context.primaryColor,
        tileColor: context.primaryColor.withAlpha(25),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

// TODO: Only pass person object, instead of id and name when PersonDto and DriftPerson are unified
class PersonTile extends StatelessWidget {
  final bool isSelected;
  final String personId;
  final String personName;
  final double imageSize;
  final Function() onTap;

  const PersonTile({
    super.key,
    required this.isSelected,
    required this.personId,
    required this.personName,
    this.imageSize = 60.0,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final headers = ApiService.getRequestHeaders();

    return Padding(
      padding: const EdgeInsets.only(bottom: 2.0),
      child: LargeLeadingTile(
        title: Text(
          personName,
          style: context.textTheme.bodyLarge?.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.w500,
            color: isSelected ? context.colorScheme.onPrimary : context.colorScheme.onSurface,
          ),
        ),
        leading: SizedBox(
          height: imageSize,
          child: Material(
            shape: const CircleBorder(side: BorderSide.none),
            elevation: 3,
            child: CircleAvatar(
              maxRadius: imageSize / 2,
              backgroundImage: NetworkImage(getFaceThumbnailUrl(personId), headers: headers),
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

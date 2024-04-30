import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/asset_people.provider.dart';
import 'package:immich_mobile/models/search/search_curated_content.model.dart';
import 'package:immich_mobile/modules/search/ui/curated_people_row.dart';
import 'package:immich_mobile/modules/search/ui/person_name_edit_form.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

class ExifPeople extends ConsumerWidget {
  final Asset asset;
  final EdgeInsets? padding;

  const ExifPeople({super.key, required this.asset, this.padding});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final peopleProvider =
        ref.watch(assetPeopleNotifierProvider(asset).notifier);
    final people = ref
        .watch(assetPeopleNotifierProvider(asset))
        .value
        ?.where((p) => !p.isHidden);
    final double imageSize = math.min(context.width / 3, 150);

    showPersonNameEditModel(
      String personId,
      String personName,
    ) {
      return showDialog(
        context: context,
        builder: (BuildContext context) {
          return PersonNameEditForm(personId: personId, personName: personName);
        },
      ).then((_) {
        // ensure the people list is up-to-date.
        peopleProvider.refresh();
      });
    }

    if (people?.isEmpty ?? true) {
      // Empty list or loading
      return Container();
    }

    final curatedPeople = people
            ?.map((p) => SearchCuratedContent(id: p.id, label: p.name))
            .toList() ??
        [];

    return Column(
      children: [
        Padding(
          padding: padding ?? EdgeInsets.zero,
          child: Align(
            alignment: Alignment.topLeft,
            child: Text(
              "exif_bottom_sheet_people",
              style: context.textTheme.labelMedium?.copyWith(
                color: context.textTheme.labelMedium?.color?.withAlpha(200),
                fontWeight: FontWeight.w600,
              ),
            ).tr(),
          ),
        ),
        SizedBox(
          height: imageSize,
          child: Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: CuratedPeopleRow(
              padding: padding,
              content: curatedPeople,
              onTap: (content, index) {
                context
                    .pushRoute(
                      PersonResultRoute(
                        personId: content.id,
                        personName: content.label,
                      ),
                    )
                    .then((_) => peopleProvider.refresh());
              },
              onNameTap: (person, index) => {
                showPersonNameEditModel(person.id, person.label),
              },
            ),
          ),
        ),
      ],
    );
  }
}

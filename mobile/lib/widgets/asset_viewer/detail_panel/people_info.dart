import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_curated_content.model.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_people.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/search/curated_people_row.dart';
import 'package:immich_mobile/widgets/search/person_name_edit_form.dart';

class PeopleInfo extends ConsumerWidget {
  final Asset asset;
  final EdgeInsets? padding;

  const PeopleInfo({super.key, required this.asset, this.padding});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final peopleProvider =
        ref.watch(assetPeopleNotifierProvider(asset).notifier);
    final people = ref
        .watch(assetPeopleNotifierProvider(asset))
        .value
        ?.where((p) => !p.isHidden);

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

    final curatedPeople = people
            ?.map(
              (p) => SearchCuratedContent(
                id: p.id,
                label: p.name,
                subtitle: p.birthDate != null &&
                        p.birthDate!.isBefore(asset.fileCreatedAt)
                    ? _formatAge(p.birthDate!, asset.fileCreatedAt)
                    : null,
              ),
            )
            .toList() ??
        [];

    return AnimatedCrossFade(
      crossFadeState: (people?.isEmpty ?? true)
          ? CrossFadeState.showFirst
          : CrossFadeState.showSecond,
      duration: const Duration(milliseconds: 200),
      firstChild: Container(),
      secondChild: Padding(
        padding: const EdgeInsets.only(top: 8.0),
        child: Column(
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
            Padding(
              padding: const EdgeInsets.only(top: 16.0),
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
          ],
        ),
      ),
    );
  }

  String _formatAge(DateTime birthDate, DateTime referenceDate) {
    int ageInYears = _calculateAge(birthDate, referenceDate);
    int ageInMonths = _calculateAgeInMonths(birthDate, referenceDate);

    if (ageInMonths <= 11) {
      return "exif_bottom_sheet_person_age_months"
          .tr(namedArgs: {'months': ageInMonths.toString()});
    } else if (ageInMonths > 12 && ageInMonths <= 23) {
      return "exif_bottom_sheet_person_age_year_months"
          .tr(namedArgs: {'months': (ageInMonths - 12).toString()});
    } else {
      return "exif_bottom_sheet_person_age_years"
          .tr(namedArgs: {'years': ageInYears.toString()});
    }
  }

  int _calculateAge(DateTime birthDate, DateTime referenceDate) {
    int age = referenceDate.year - birthDate.year;
    if (referenceDate.month < birthDate.month ||
        (referenceDate.month == birthDate.month &&
            referenceDate.day < birthDate.day)) {
      age--;
    }
    return age;
  }

  int _calculateAgeInMonths(DateTime birthDate, DateTime referenceDate) {
    return (referenceDate.year - birthDate.year) * 12 +
        referenceDate.month -
        birthDate.month -
        (referenceDate.day < birthDate.day ? 1 : 0);
  }
}

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/people/person_edit_birthday_modal.widget.dart';
import 'package:immich_mobile/presentation/widgets/people/person_edit_name_modal.widget.dart';

String formatAge(DateTime birthDate, DateTime referenceDate) {
  final int ageInYears = _calculateAge(birthDate, referenceDate);
  final int ageInMonths = _calculateAgeInMonths(birthDate, referenceDate);

  final t = StaticTranslations.instance;
  if (ageInMonths <= 11) {
    return t.person_age_months(months: ageInMonths);
  } else if (ageInMonths > 12 && ageInMonths <= 23) {
    return t.person_age_year_months(months: ageInMonths - 12);
  } else {
    return t.person_age_years(years: ageInYears);
  }
}

int _calculateAge(DateTime birthDate, DateTime referenceDate) {
  int age = referenceDate.year - birthDate.year;
  if (referenceDate.month < birthDate.month ||
      (referenceDate.month == birthDate.month && referenceDate.day < birthDate.day)) {
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

Future<String?> showNameEditModal(BuildContext context, Person person) {
  return showDialog<String?>(
    context: context,
    useRootNavigator: false,
    builder: (BuildContext context) {
      return DriftPersonNameEditForm(person: person);
    },
  );
}

Future<DateTime?> showBirthdayEditModal(BuildContext context, Person person) {
  return showDialog<DateTime?>(
    context: context,
    useRootNavigator: false,
    builder: (BuildContext context) {
      return DriftPersonBirthdayEditForm(person: person);
    },
  );
}

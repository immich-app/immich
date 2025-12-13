import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/people/person_edit_birthday_modal.widget.dart';
import 'package:immich_mobile/presentation/widgets/people/person_edit_name_modal.widget.dart';

String formatAge(DateTime birthDate, DateTime referenceDate) {
  int ageInYears = _calculateAge(birthDate, referenceDate);
  int ageInMonths = _calculateAgeInMonths(birthDate, referenceDate);

  if (ageInMonths <= 11) {
    return "person_age_months".t(args: {'months': ageInMonths.toString()});
  } else if (ageInMonths > 12 && ageInMonths <= 23) {
    return "person_age_year_months".t(args: {'months': (ageInMonths - 12).toString()});
  } else {
    return "person_age_years".t(args: {'years': ageInYears.toString()});
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

Future<String?> showNameEditModal(BuildContext context, DriftPerson person) {
  return showDialog<String?>(
    context: context,
    useRootNavigator: false,
    builder: (BuildContext context) {
      return DriftPersonNameEditForm(person: person);
    },
  );
}

Future<DateTime?> showBirthdayEditModal(BuildContext context, DriftPerson person) {
  return showDialog<DateTime?>(
    context: context,
    useRootNavigator: false,
    builder: (BuildContext context) {
      return DriftPersonBirthdayEditForm(person: person);
    },
  );
}

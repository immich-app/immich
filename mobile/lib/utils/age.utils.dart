import 'package:immich_mobile/extensions/translate_extensions.dart';

String formatAge(DateTime birthDate, DateTime referenceDate) {
  int ageInYears = _calculateAge(birthDate, referenceDate);
  int ageInMonths = _calculateAgeInMonths(birthDate, referenceDate);

  if (ageInMonths <= 11) {
    return "exif_bottom_sheet_person_age_months".t(args: {'months': ageInMonths.toString()});
  } else if (ageInMonths > 12 && ageInMonths <= 23) {
    return "exif_bottom_sheet_person_age_year_months".t(args: {'months': (ageInMonths - 12).toString()});
  } else {
    return "exif_bottom_sheet_person_age_years".t(args: {'years': ageInYears.toString()});
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

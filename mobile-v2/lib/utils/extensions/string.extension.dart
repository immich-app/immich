extension StringNumberUtils on String {
  int? tryParseInt() => int.tryParse(this);
  int parseInt() => int.parse(this);
}

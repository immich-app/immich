extension StringExtension on String {
  String capitalize() {
    return split(" ")
        .map(
          (str) => str.isEmpty ? str : str[0].toUpperCase() + str.substring(1),
        )
        .join(" ");
  }
}

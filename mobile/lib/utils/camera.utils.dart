final _wordChar = RegExp(r'\w');

/// Builds the display name of a camera from its EXIF make and model.
///
/// Many cameras (e.g. Canon) already include the manufacturer in the model
/// (`Canon EOS R6m2`), so prefixing the make again would produce
/// "Canon Canon EOS R6m2". The make is only prepended when the model does not
/// already start with it. Makes such as "NIKON CORPORATION" are compared by
/// their first word, since the model is typically "NIKON D850".
///
/// Returns `null` when neither a make nor a model is available.
String? getCameraName(String? make, String? model) {
  final trimmedMake = make?.trim() ?? '';
  final trimmedModel = model?.trim() ?? '';

  if (trimmedMake.isEmpty && trimmedModel.isEmpty) {
    return null;
  }

  if (trimmedMake.isEmpty) {
    return trimmedModel;
  }

  if (trimmedModel.isEmpty) {
    return trimmedMake;
  }

  final makeName = trimmedMake.split(RegExp(r'\s+')).first.toLowerCase();
  final lowerModel = trimmedModel.toLowerCase();
  final charAfterMake = lowerModel.length > makeName.length ? lowerModel[makeName.length] : '';
  if (lowerModel.startsWith(makeName) && !_wordChar.hasMatch(charAfterMake)) {
    return trimmedModel;
  }

  return '$trimmedMake $trimmedModel';
}

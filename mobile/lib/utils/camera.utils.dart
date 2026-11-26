final _whitespace = RegExp(r'\s+');
final _wordChar = RegExp(r'\w');

/// Builds the display name of a camera from its EXIF make and model.
///
/// Many cameras (e.g. Canon) already include the manufacturer in the model
/// (`Canon EOS R6m2`), so prefixing the make again would produce
/// "Canon Canon EOS R6m2". The make is only prepended when the model does not
/// already start with it. Makes made up of several words are matched word by
/// word, since the model usually repeats only part of them:
/// `NIKON CORPORATION` / `NIKON D850` and
/// `EASTMAN KODAK COMPANY` / `KODAK EASYSHARE C875`.
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

  final lowerModel = trimmedModel.toLowerCase();
  final modelIncludesMake = trimmedMake.toLowerCase().split(_whitespace).any((word) {
    final charAfterWord = lowerModel.length > word.length ? lowerModel[word.length] : '';
    return lowerModel.startsWith(word) && !_wordChar.hasMatch(charAfterWord);
  });

  return modelIncludesMake ? trimmedModel : '$trimmedMake $trimmedModel';
}

import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final searchInputFocusProvider = Provider((ref) {
  return FocusNode();
});

import 'package:flutter/material.dart';

final searchFocusNotifierProvider = SearchFocusNotifier();

class SearchFocusNotifier with ChangeNotifier {
  void requestFocus() {
    notifyListeners();
  }
}

import 'package:flutter/material.dart';

final scrollToTopNotifierProvider = ScrollNotifier();

class ScrollNotifier with ChangeNotifier {
  void scrollToTop() {
    notifyListeners();
  }
}

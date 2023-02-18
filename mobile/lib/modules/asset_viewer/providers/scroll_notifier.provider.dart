import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final scrollToTopNotifierProvider = ScrollNotifier();

class ScrollNotifier with ChangeNotifier {
  void scrollToTop() {
    notifyListeners();
  }
}

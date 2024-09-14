import 'package:flutter/material.dart';

extension DarkenLightenExtension on Color {
  Color lighten({double amount = 0.1}) {
    return Color.alphaBlend(Colors.white.withOpacity(amount), this);
  }

  Color darken({double amount = 0.1}) {
    return Color.alphaBlend(Colors.black.withOpacity(amount), this);
  }
}

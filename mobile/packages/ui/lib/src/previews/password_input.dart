import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/password_input.dart';
import 'package:immich_ui/src/previews.dart';

@ImmichPreview(group: 'PasswordInput', name: 'With Validator')
Widget previewPasswordInput() => ImmichPasswordInput(
      label: 'Password',
      hintText: 'Enter your password',
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Password is required';
        }
        if (value.length < 8) {
          return 'Password must be at least 8 characters';
        }
        return null;
      },
    );

import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';

class FormattedDuration extends StatelessWidget {
  final Duration data;
  const FormattedDuration(this.data, {super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: data.inHours > 0 ? 70 : 60, // use a fixed width to prevent jitter
      child: Text(
        data.format(),
        style: const TextStyle(
          fontSize: 14.0,
          color: Colors.white,
          fontWeight: FontWeight.w500,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

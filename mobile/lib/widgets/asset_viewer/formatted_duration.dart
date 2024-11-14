import 'package:flutter/material.dart';

@pragma('vm:prefer-inline')
String _formatDuration(Duration position) {
  final seconds = position.inSeconds.remainder(60).toString().padLeft(2, "0");
  final minutes = position.inMinutes.remainder(60).toString().padLeft(2, "0");
  if (position.inHours == 0) {
    return "$minutes:$seconds";
  }
  final hours = position.inHours.toString().padLeft(2, '0');
  return "$hours:$minutes:$seconds";
}

class FormattedDuration extends StatelessWidget {
  final Duration data;
  const FormattedDuration(this.data, {super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: data.inHours > 0 ? 70 : 60, // use a fixed width to prevent jitter
      child: Text(
        _formatDuration(data),
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

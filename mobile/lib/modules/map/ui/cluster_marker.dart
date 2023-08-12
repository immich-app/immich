import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';

class ClusterMarkerIcon extends StatelessWidget {
  final bool isDarkTheme;
  final List<Marker> markers;

  const ClusterMarkerIcon(
      {super.key, required this.markers, this.isDarkTheme = false});

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final borderColor =
        isDarkTheme ? Colors.black : theme.colorScheme.onPrimary;
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: borderColor,
        ),
        borderRadius: BorderRadius.circular(50),
        boxShadow: [
          BoxShadow(
            color: borderColor, //New
            blurRadius: 10.0,
          ),
        ],
        color: isDarkTheme ? theme.primaryColor : Colors.white,
      ),
      child: Center(
        child: Text(
          markers.length.toString(),
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: borderColor,
          ),
        ),
      ),
    );
  }
}

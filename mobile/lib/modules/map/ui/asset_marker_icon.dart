import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class AssetMarkerIcon extends StatelessWidget {
  const AssetMarkerIcon({
    Key? key,
    required this.id,
    this.isDarkTheme = false,
  }) : super(key: key);

  final String id;
  final bool isDarkTheme;

  @override
  Widget build(BuildContext context) {
    final imageUrl = getThumbnailUrlForRemoteId(id);
    final cacheKey = getThumbnailCacheKeyForRemoteId(id);
    return LayoutBuilder(
      builder: (context, constraints) => Stack(
        children: [
          Positioned(
            bottom: 0,
            left: constraints.maxWidth * 0.5,
            child: CustomPaint(
              painter: _PinPainter(
                primaryColor: isDarkTheme ? Colors.white : Colors.black,
                secondaryColor: isDarkTheme ? Colors.black : Colors.white,
              ),
              child: const SizedBox(
                height: 14,
                width: 14,
              ),
            ),
          ),
          Positioned(
            top: constraints.maxHeight * 0.07,
            left: constraints.maxWidth * 0.17,
            child: CircleAvatar(
              radius: 40,
              backgroundColor: isDarkTheme ? Colors.white : Colors.black,
              child: CircleAvatar(
                radius: 37,
                backgroundImage: CachedNetworkImageProvider(
                  imageUrl,
                  cacheKey: cacheKey,
                  headers: {
                    "Authorization": "Bearer ${Store.get(StoreKey.accessToken)}"
                  },
                  errorListener: () =>
                      const Icon(Icons.image_not_supported_outlined),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PinPainter extends CustomPainter {
  final Color primaryColor;
  final Color secondaryColor;

  _PinPainter({
    this.primaryColor = Colors.black,
    this.secondaryColor = Colors.white,
  });

  @override
  void paint(Canvas canvas, Size size) {
    Paint primaryBrush = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.fill;

    Paint secondaryBrush = Paint()
      ..color = secondaryColor
      ..style = PaintingStyle.fill;

    Paint lineBrush = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawCircle(Offset(size.width / 2, size.height), 6, primaryBrush);
    canvas.drawCircle(Offset(size.width / 2, size.height), 3.8, secondaryBrush);
    canvas.drawPath(getTrianglePath(size.width, size.height), primaryBrush);
    // The line is to make the above triangluar path more prominent since it has a slight curve
    canvas.drawLine(
      Offset(size.width / 2, 0),
      Offset(
        size.width / 2,
        size.height,
      ),
      lineBrush,
    );
  }

  Path getTrianglePath(double x, double y) {
    final firstEndPoint = Offset(x / 2, y);
    final controlPoint = Offset(x / 2, y * 0.3);
    final secondEndPoint = Offset(x, 0);

    return Path()
      ..quadraticBezierTo(
        controlPoint.dx,
        controlPoint.dy,
        firstEndPoint.dx,
        firstEndPoint.dy,
      )
      ..quadraticBezierTo(
        controlPoint.dx,
        controlPoint.dy,
        secondEndPoint.dx,
        secondEndPoint.dy,
      )
      // ..lineTo(firstEndPoint.dx, firstEndPoint.dy)
      // ..lineTo(secondEndPoint.dx, secondEndPoint.dy)
      ..lineTo(0, 0);
  }

  @override
  bool shouldRepaint(_PinPainter old) {
    return old.primaryColor != primaryColor ||
        old.secondaryColor != secondaryColor;
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';

class ImmichLoadingIndicator extends StatelessWidget {
  const ImmichLoadingIndicator({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      width: 60,
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withAlpha(200),
        borderRadius: BorderRadius.circular(10),
      ),
      child: const SpinKitDancingSquare(
        color: Colors.white,
        size: 30.0,
      ),
    );
  }
}

import 'package:flutter/material.dart';

class SharingSliverAppBar extends StatelessWidget {
  const SharingSliverAppBar({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const SliverAppBar(
      centerTitle: true,
      floating: false,
      pinned: true,
      snap: false,
      automaticallyImplyLeading: false,
      title: Text(
        'IMMICH',
        style: TextStyle(
          fontFamily: 'SnowburstOne',
          fontWeight: FontWeight.bold,
          fontSize: 22,
        ),
      ),
    );
  }
}

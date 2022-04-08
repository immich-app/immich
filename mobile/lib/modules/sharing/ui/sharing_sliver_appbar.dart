import 'package:flutter/material.dart';

class SharingSliverAppBar extends StatelessWidget {
  const SharingSliverAppBar({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      centerTitle: true,
      floating: false,
      pinned: true,
      snap: false,
      leading: Container(),
      // elevation: 0,
      title: Text(
        'IMMICH',
        style: TextStyle(
          fontFamily: 'SnowburstOne',
          fontWeight: FontWeight.bold,
          fontSize: 22,
          color: Theme.of(context).primaryColor,
        ),
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(50.0),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                style: ButtonStyle(
                  backgroundColor: MaterialStateProperty.all(
                      Theme.of(context).primaryColor.withAlpha(20)),
                  // foregroundColor: MaterialStateProperty.all(Colors.white),
                ),
                onPressed: () {},
                icon: const Icon(
                  Icons.photo_album_outlined,
                  size: 20,
                ),
                label: const Text(
                  "Create shared album",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
              TextButton.icon(
                style: ButtonStyle(
                  backgroundColor: MaterialStateProperty.all(
                      Theme.of(context).primaryColor.withAlpha(20)),
                  // foregroundColor: MaterialStateProperty.all(Colors.white),
                ),
                onPressed: null,
                icon: const Icon(
                  Icons.swap_horizontal_circle_outlined,
                  size: 20,
                ),
                label: const Text(
                  "Share with partner",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}

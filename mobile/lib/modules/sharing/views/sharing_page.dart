import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/sharing/ui/sharing_sliver_appbar.dart';

class SharingPage extends StatelessWidget {
  const SharingPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: CustomScrollView(
        slivers: [
          SharingSliverAppBar(),
          SliverPadding(
            padding: EdgeInsets.all(12),
            sliver: SliverToBoxAdapter(
              child: Text(
                "Shared albums",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/sharing/ui/sharing_sliver_appbar.dart';

class SharingPage extends StatelessWidget {
  const SharingPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SharingSliverAppBar(),
          SliverFixedExtentList(
            itemExtent: 50.0,
            delegate: SliverChildBuilderDelegate(
              (BuildContext context, int index) {
                return Container(
                  alignment: Alignment.center,
                  color: Colors.lightBlue[100 * (index % 9)],
                  child: Text('list item $index'),
                );
              },
            ),
          )
        ],
      ),
    );
  }
}

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_ui/immich_ui.dart';

@RoutePage()
class ImmichUIShowcasePage extends StatelessWidget {
  const ImmichUIShowcasePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final itemHeight = constraints.maxHeight * 0.5; // Each item takes 50% of screen

          return PageView.builder(
            scrollDirection: Axis.vertical,
            controller: PageController(
              viewportFraction: 0.5, // Shows 2 items at once
            ),
            itemCount: 2,
            itemBuilder: (context, index) {
              final colors = [Colors.blue, Colors.green];
              final labels = ['First Item', 'Second Item'];

              return Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  color: colors[index],
                  child: Text(labels[index], style: const TextStyle(color: Colors.white, fontSize: 24)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

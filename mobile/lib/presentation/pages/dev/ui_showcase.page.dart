import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_ui/immich_ui.dart';

@RoutePage()
class ImmichUIShowcasePage extends StatefulWidget {
  const ImmichUIShowcasePage({super.key});

  @override
  State<ImmichUIShowcasePage> createState() => _ImmichUIShowcasePageState();
}

class _ImmichUIShowcasePageState extends State<ImmichUIShowcasePage> {
  final ScrollController _scrollController = ScrollController();
  double _opacity = 0.0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    print('Scroll offset: ${_scrollController.offset}');
    setState(() {
      _opacity = (_scrollController.offset / 50).clamp(0.0, 1.0);
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final imageHeight = 200.0; // Your image's height
          final viewportHeight = constraints.maxHeight;

          // Calculate padding to center the image in the viewport
          final topPadding = (viewportHeight - imageHeight) / 2;
          final snapOffset = topPadding + (imageHeight * 2 / 3);

          return SingleChildScrollView(
            controller: _scrollController,
            physics: SnapToPartialPhysics(snapOffset: snapOffset),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: topPadding), // Push image to center
                Center(child: Image.asset('assets/immich-logo.png', height: imageHeight)),
                Opacity(
                  opacity: _opacity,
                  child: Container(
                    constraints: BoxConstraints(minHeight: snapOffset + 100),
                    color: Colors.blue,
                    height: 100 + imageHeight * (1 / 3),
                    child: const Text('Some content'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class SnapToPartialPhysics extends ScrollPhysics {
  final double snapOffset;

  const SnapToPartialPhysics({super.parent, required this.snapOffset});

  @override
  SnapToPartialPhysics applyTo(ScrollPhysics? ancestor) {
    return SnapToPartialPhysics(parent: buildParent(ancestor), snapOffset: snapOffset);
  }

  @override
  Simulation? createBallisticSimulation(ScrollMetrics position, double velocity) {
    final tolerance = toleranceFor(position);

    // If already at a snap point, let it settle naturally
    if ((position.pixels - 0).abs() < tolerance.distance || (position.pixels - snapOffset).abs() < tolerance.distance) {
      return super.createBallisticSimulation(position, velocity);
    }

    // Determine snap target based on position and velocity
    double target;
    if (velocity > 0) {
      // Scrolling down
      target = snapOffset;
    } else if (velocity < 0) {
      // Scrolling up
      target = 0;
    } else {
      // No velocity, snap to nearest
      target = position.pixels < snapOffset / 2 ? 0 : snapOffset;
    }

    return ScrollSpringSimulation(spring, position.pixels, target, velocity, tolerance: tolerance);
  }
}

// class _ImmichUIShowcasePageState extends State<ImmichUIShowcasePage> {
//   final ScrollController _scrollController = ScrollController();
//   double _opacity = 0.0;

//   @override
//   void initState() {
//     super.initState();
//     _scrollController.addListener(_onScroll);
//   }

//   void _onScroll() {
//     print('Scroll offset: ${_scrollController.offset}');
//     setState(() {
//       _opacity = (_scrollController.offset / 50).clamp(0.0, 1.0);
//     });
//   }

//   @override
//   void dispose() {
//     _scrollController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       body: ListView(
//         controller: _scrollController,
//         physics: const PageScrollPhysics(),
//         children: [
//           Container(
//             constraints: BoxConstraints.expand(height: MediaQuery.sizeOf(context).height),
//             decoration: const BoxDecoration(color: Colors.green),
//           ),
//           AnimatedOpacity(
//             opacity: _opacity,
//             duration: const Duration(milliseconds: 300),
//             child: Container(
//               constraints: const BoxConstraints.expand(height: 2000),
//               decoration: const BoxDecoration(color: Colors.blue),
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }

// class _ImmichUIShowcasePageState extends State<ImmichUIShowcasePage> {
//   final ScrollController _scrollController = ScrollController();
//   double _opacity = 0.0;

//   @override
//   void initState() {
//     super.initState();
//     _scrollController.addListener(_onScroll);
//   }

//   void _onScroll() {
//     print('Scroll offset: ${_scrollController.offset}');
//     setState(() {
//       _opacity = (_scrollController.offset / 50).clamp(0.0, 1.0);
//     });
//   }

//   @override
//   void dispose() {
//     _scrollController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       body: ListView(
//         controller: _scrollController,
//         physics: const PageScrollPhysics(),
//         children: [
//           Container(
//             constraints: BoxConstraints.expand(height: MediaQuery.sizeOf(context).height),
//             decoration: const BoxDecoration(color: Colors.green),
//           ),
//           AnimatedOpacity(
//             opacity: _opacity,
//             duration: const Duration(milliseconds: 300),
//             child: Container(
//               constraints: const BoxConstraints.expand(height: 2000),
//               decoration: const BoxDecoration(color: Colors.blue),
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }

// @RoutePage()
// class ImmichUIShowcasePage extends StatelessWidget {
//   const ImmichUIShowcasePage({super.key});
// @override
// Widget build(BuildContext context) {
//   return Scaffold(
//     body: LayoutBuilder(
//       builder: (context, constraints) {
//         final itemHeight = constraints.maxHeight * 0.5; // Each item takes 50% of screen

//         return PageView.builder(
//           scrollDirection: Axis.vertical,
//           controller: PageController(
//             viewportFraction: 1, // Shows 2 items at once
//           ),
//           itemCount: 2,
//           itemBuilder: (context, index) {
//             final colors = [Colors.blue, Colors.green];
//             final labels = ['First Item', 'Second Item'];

//             return Center(
//               child: Container(
//                 height: index == 0 ? 100 : 30000,
//                 width: constraints.maxWidth,
//                 padding: const EdgeInsets.all(24),
//                 color: colors[index],
//                 child: Text(labels[index], style: const TextStyle(color: Colors.white, fontSize: 24)),
//               ),
//             );
//           },
//         );
//       },
//     ),
//   );
// }
// }

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
      body: StackedScrollView(
        bottomPeekHeight: 100,
        topChild: Container(
          color: Colors.blue,
          child: const Center(
            child: Text('Top', style: TextStyle(color: Colors.white, fontSize: 32)),
          ),
        ),
        bottomChild: Container(
          height: 800,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, -2))],
          ),
          padding: const EdgeInsets.all(24),
          child: const Text('Bottom sheet content'),
        ),
      ),
    );
  }
}

class StackedScrollView extends StatefulWidget {
  final Widget topChild;
  final Widget bottomChild;
  final double bottomPeekHeight;

  const StackedScrollView({super.key, required this.topChild, required this.bottomChild, this.bottomPeekHeight = 80});

  @override
  State<StackedScrollView> createState() => _StackedScrollViewState();
}

class _StackedScrollViewState extends State<StackedScrollView> with SingleTickerProviderStateMixin {
  double _offset = 0;
  late double _maxOffset;
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController.unbounded(vsync: this)..addListener(_onAnimate);
  }

  void _onAnimate() {
    final clamped = _controller.value.clamp(0.0, _maxOffset);
    if (clamped != _offset) {
      setState(() => _offset = clamped);
    }
    // Stop the controller if we've hit a boundary
    if (_controller.value <= 0 || _controller.value >= _maxOffset) {
      _controller.stop();
    }
  }

  void _onDragUpdate(DragUpdateDetails details) {
    _controller.stop();
    setState(() {
      _offset = (_offset - details.delta.dy).clamp(0.0, _maxOffset);
    });
  }

  void _onDragEnd(DragEndDetails details) {
    final velocity = -(details.primaryVelocity ?? 0);
    final simulation = ClampingScrollSimulation(position: _offset, velocity: velocity);
    _controller.animateWith(simulation);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportHeight = constraints.maxHeight;
        _maxOffset = viewportHeight - widget.bottomPeekHeight;

        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onVerticalDragUpdate: _onDragUpdate,
          onVerticalDragEnd: _onDragEnd,
          child: ClipRect(
            child: SizedBox(
              height: viewportHeight,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Top child — fills the screen, scrolls up
                  Positioned(top: -_offset, left: 0, right: 0, height: viewportHeight, child: widget.topChild),
                  // Bottom child — overlaps, peeks from bottom
                  Positioned(
                    top: viewportHeight - widget.bottomPeekHeight - _offset,
                    left: 0,
                    right: 0,
                    child: widget.bottomChild,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
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

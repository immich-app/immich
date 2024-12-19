import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_svg/svg.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

@RoutePage()
class OnboardingPage extends HookConsumerWidget {
  const OnboardingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pageController = usePageController(keepPage: false);

    toNextPage() {
      pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: SvgPicture.asset(
          context.isDarkTheme
              ? 'assets/immich-logo-inline-dark.svg'
              : 'assets/immich-logo-inline-light.svg',
          height: 48,
        ),
        centerTitle: false,
        elevation: 0,
      ),
      body: SafeArea(
        child: PageView(
          controller: pageController,
          // physics: const NeverScrollableScrollPhysics(),
          children: [
            OnboardingWelcome(
              onNextPage: () => toNextPage(),
            ),
            OnboardingGalleryPermission(
              onNextPage: () => toNextPage(),
            ),
          ],
        ),
      ),
    );
  }
}

class OnboardingWelcome extends StatelessWidget {
  final VoidCallback onNextPage;

  const OnboardingWelcome({super.key, required this.onNextPage});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(18.0),
      child: ListView(
        physics: const ClampingScrollPhysics(),
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Card(
              clipBehavior: Clip.antiAlias,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.all(
                  Radius.circular(32),
                ),
              ),
              elevation: 3,
              child: AnimatedHeroImage(
                imagePath: 'assets/onboarding-1-screenshot.jpeg',
                color: context.colorScheme.primary.withOpacity(0.25),
                colorBlendMode: BlendMode.color,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(
              top: 32.0,
              left: 8.0,
              bottom: 8.0,
            ),
            child: Text(
              "WELCOME",
              style: context.textTheme.labelLarge?.copyWith(
                color: context.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Text(
              "Let’s get you setup with some permissions that the app needs",
              style: context.textTheme.headlineSmall,
            ),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.only(right: 8.0, top: 24.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                SizedBox(
                  width: 64,
                  height: 64,
                  child: MaterialButton(
                    onPressed: onNextPage,
                    color: context.primaryColor,
                    textColor: Colors.white,
                    shape: const CircleBorder(),
                    child: Icon(
                      Icons.chevron_right_rounded,
                      color: context.colorScheme.onPrimary,
                      size: 32,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AnimatedHeroImage extends StatefulWidget {
  final String imagePath;
  final Color color;
  final BlendMode colorBlendMode;

  const AnimatedHeroImage({
    super.key,
    required this.imagePath,
    required this.color,
    required this.colorBlendMode,
  });

  @override
  AnimatedHeroImageState createState() => AnimatedHeroImageState();
}

class AnimatedHeroImageState extends State<AnimatedHeroImage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;
  late Animation<Offset> _parallaxAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 15),
      vsync: this,
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );

    _rotationAnimation = Tween<double>(begin: 0.0, end: 0.025).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );

    _parallaxAnimation =
        Tween<Offset>(begin: Offset.zero, end: const Offset(0.05, 0.05))
            .animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      child: Image(
        image: AssetImage(widget.imagePath),
        filterQuality: FilterQuality.high,
        isAntiAlias: true,
        // color: widget.color,
        // colorBlendMode: widget.colorBlendMode,
      ),
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Transform.rotate(
            angle: _rotationAnimation.value,
            child: Transform.translate(
              offset: _parallaxAnimation.value,
              child: child,
            ),
          ),
        );
      },
    );
  }
}

class OnboardingGalleryPermission extends StatelessWidget {
  final VoidCallback onNextPage;

  const OnboardingGalleryPermission({super.key, required this.onNextPage});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24.0),
      physics: const ClampingScrollPhysics(),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Icon(
              Icons.perm_media_outlined,
              size: 48,
              color: context.primaryColor.withAlpha(250),
            ),
          ],
        ),
        const SizedBox(height: 32),
        Text(
          "Gallery Permission",
          style: context.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "We need the read and write permission of the media gallery for the following actions",
          style: context.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w400,
            color: context.colorScheme.onSurface.withAlpha(220),
          ),
        ),
        const SizedBox(height: 40),
        const BulletList([
          'Display the local videos and images',
          'Read the file content to upload to your Immich instance',
          'Remove the media from the device on your request',
        ]),
        const SizedBox(height: 64),
        SizedBox(
          height: 48,
          child: ElevatedButton(
            onPressed: onNextPage,
            child: const Text(
              'OK',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class BulletList extends StatelessWidget {
  final List<String> strings;

  const BulletList(this.strings, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: strings.map((textString) {
          return Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '\u2022',
                  style: TextStyle(
                    fontSize: 20,
                    height: 1.25,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    textString,
                    textAlign: TextAlign.left,
                    softWrap: true,
                    style: context.textTheme.headlineSmall?.copyWith(
                      fontSize: 20,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

/// Spacing constants for gaps between widgets
abstract class ImmichSpacing {
  const ImmichSpacing._();

  /// Extra small spacing: 4.0
  static const double xs = 4.0;

  /// Small spacing: 8.0
  static const double sm = 8.0;

  /// Medium spacing (default): 12.0
  static const double md = 12.0;

  /// Large spacing: 16.0
  static const double lg = 16.0;

  /// Extra large spacing: 24.0
  static const double xl = 24.0;

  /// Extra extra large spacing: 32.0
  static const double xxl = 32.0;

  /// Extra extra extra large spacing: 48.0
  static const double xxxl = 48.0;
}

/// Border radius constants for consistent rounded corners
abstract class ImmichRadius {
  const ImmichRadius._();

  /// No radius: 0.0
  static const double none = 0.0;

  /// Extra small radius: 4.0
  static const double xs = 4.0;

  /// Small radius: 8.0
  static const double sm = 8.0;

  /// Medium radius (default): 12.0
  static const double md = 12.0;

  /// Large radius: 16.0
  static const double lg = 16.0;

  /// Extra large radius: 20.0
  static const double xl = 20.0;

  /// Extra extra large radius: 24.0
  static const double xxl = 24.0;

  /// Full circular radius: infinity
  static const double full = double.infinity;
}

/// Icon size constants for consistent icon sizing
abstract class ImmichIconSize {
  const ImmichIconSize._();

  /// Extra small icon: 16.0
  static const double xs = 16.0;

  /// Small icon: 20.0
  static const double sm = 20.0;

  /// Medium icon (default): 24.0
  static const double md = 24.0;

  /// Large icon: 32.0
  static const double lg = 32.0;

  /// Extra large icon: 40.0
  static const double xl = 40.0;

  /// Extra extra large icon: 48.0
  static const double xxl = 48.0;
}

/// Animation duration constants for consistent timing
abstract class ImmichDuration {
  const ImmichDuration._();

  /// Extra fast: 100ms
  static const Duration extraFast = Duration(milliseconds: 100);

  /// Fast: 150ms
  static const Duration fast = Duration(milliseconds: 150);

  /// Normal: 200ms
  static const Duration normal = Duration(milliseconds: 200);

  /// Moderate: 300ms
  static const Duration moderate = Duration(milliseconds: 300);

  /// Slow: 500ms
  static const Duration slow = Duration(milliseconds: 500);

  /// Extra slow: 700ms
  static const Duration extraSlow = Duration(milliseconds: 700);
}

/// Elevation constants for consistent shadows and depth
abstract class ImmichElevation {
  const ImmichElevation._();

  /// No elevation: 0.0
  static const double none = 0.0;

  /// Extra small elevation: 1.0
  static const double xs = 1.0;

  /// Small elevation: 2.0
  static const double sm = 2.0;

  /// Medium elevation: 4.0
  static const double md = 4.0;

  /// Large elevation: 8.0
  static const double lg = 8.0;

  /// Extra large elevation: 12.0
  static const double xl = 12.0;

  /// Extra extra large elevation: 16.0
  static const double xxl = 16.0;
}

/// Border width constants (similar to Tailwind's border-* scale)
abstract class ImmichBorderWidth {
  const ImmichBorderWidth._();

  /// No border: 0.0
  static const double none = 0.0;

  /// Hairline border: 0.5
  static const double hairline = 0.5;

  /// Default border: 1.0 (border)
  static const double base = 1.0;

  /// Medium border: 2.0 (border-2)
  static const double md = 2.0;

  /// Large border: 3.0 (border-4)
  static const double lg = 3.0;

  /// Extra large border: 4.0
  static const double xl = 4.0;
}

/// Text size constants with semantic HTML-like naming
/// These follow a type scale for harmonious text hierarchy
abstract class ImmichTextSize {
  const ImmichTextSize._();

  /// Caption text: 10.0
  /// Use for: Tiny labels, legal text, metadata, timestamps
  static const double caption = 10.0;

  /// Label text: 12.0
  /// Use for: Form labels, secondary text, helper text
  static const double label = 12.0;

  /// Body text: 14.0 (default)
  /// Use for: Main body text, paragraphs, default UI text
  static const double body = 14.0;

  /// Body emphasized: 16.0
  /// Use for: Emphasized body text, button labels, tabs
  static const double bodyLarge = 16.0;

  /// Heading 6: 18.0 (smallest heading)
  /// Use for: Subtitles, card titles, section headers
  static const double h6 = 18.0;

  /// Heading 5: 20.0
  /// Use for: Small headings, prominent labels
  static const double h5 = 20.0;

  /// Heading 4: 24.0
  /// Use for: Page titles, dialog titles
  static const double h4 = 24.0;

  /// Heading 3: 30.0
  /// Use for: Section headings, large headings
  static const double h3 = 30.0;

  /// Heading 2: 36.0
  /// Use for: Major section headings
  static const double h2 = 36.0;

  /// Heading 1: 48.0 (largest heading)
  /// Use for: Page hero headings, main titles
  static const double h1 = 48.0;

  /// Display text: 60.0
  /// Use for: Hero numbers, splash screens, extra large display
  static const double display = 60.0;
}

import 'dart:math';

class AffineMatrix {
  final double a;
  final double b;
  final double c;
  final double d;
  final double e;
  final double f;

  const AffineMatrix(this.a, this.b, this.c, this.d, this.e, this.f);

  @override
  String toString() {
    return 'AffineMatrix(a: $a, b: $b, c: $c, d: $d, e: $e, f: $f)';
  }

  factory AffineMatrix.identity() {
    return const AffineMatrix(1, 0, 0, 1, 0, 0);
  }

  AffineMatrix multiply(AffineMatrix other) {
    return AffineMatrix(
      a * other.a + c * other.b,
      b * other.a + d * other.b,
      a * other.c + c * other.d,
      b * other.c + d * other.d,
      a * other.e + c * other.f + e,
      b * other.e + d * other.f + f,
    );
  }

  factory AffineMatrix.compose([List<AffineMatrix> transformations = const []]) {
    return transformations.fold<AffineMatrix>(AffineMatrix.identity(), (acc, matrix) => acc.multiply(matrix));
  }

  factory AffineMatrix.rotate(double angle) {
    final cosAngle = cos(angle);
    final sinAngle = sin(angle);
    return AffineMatrix(cosAngle, -sinAngle, sinAngle, cosAngle, 0, 0);
  }

  factory AffineMatrix.flipY() {
    return const AffineMatrix(-1, 0, 0, 1, 0, 0);
  }

  factory AffineMatrix.flipX() {
    return const AffineMatrix(1, 0, 0, -1, 0, 0);
  }
}

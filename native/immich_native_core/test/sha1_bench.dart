// SHA-1 perf bench — run explicitly: `flutter test test/sha1_bench.dart`.
// (Not named *_test.dart so it stays out of the default `flutter test` run.)
//
// Three ways to hash a file, to isolate where the win is:
//   A) sha1File(path)                 — Rust: open + mmap + HW-SHA, no Dart read
//   B) File.read + sha1Hex(bytes)     — Dart reads into heap, Rust HW-SHA the bytes
//   C) File.read + crypto.sha1(bytes) — Dart reads into heap, pure-Dart SHA-1 (naive)
// A vs B = mmap/zero-copy win; B vs C = HW-SHA vs pure-Dart; A vs C = total vs naive.
//
// IMPORTANT — C (pure-Dart) is NOT immich's real baseline. immich already hashes
// assets natively + hardware-accelerated on BOTH platforms (Android Kotlin
// MessageDigest SHA-1, iOS Swift CryptoKit Insecure.SHA1), streamed over a read
// buffer, via pigeon. So the real-world comparison is A vs ~B (Rust mmap vs a
// buffered native read with HW-SHA), i.e. roughly the A/B gap (~1.3x), NOT A/C.
// ignore_for_file: avoid_print
import 'dart:io';
import 'dart:typed_data';

import 'package:crypto/crypto.dart' as crypto;
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_native_core/immich_native_core.dart';

void main() {
  test('sha1 throughput: mmap(Rust) vs read+Rust vs read+pure-Dart', () {
    final tmp = Directory.systemTemp.createTempSync('sha1_bench');
    final sizesMb = [1, 16, 64, 256];

    double msMin(int iters, void Function() f) {
      var best = double.infinity;
      for (var i = 0; i < iters; i++) {
        final sw = Stopwatch()..start();
        f();
        sw.stop();
        final ms = sw.elapsedMicroseconds / 1000.0;
        if (ms < best) best = ms;
      }
      return best;
    }

    String mbps(int mb, double ms) => (mb / (ms / 1000.0)).toStringAsFixed(0);

    print('');
    print('size │  A mmap(Rust)   │  B read+Rust    │  C read+pureDart │ A vs C');
    print('─────┼─────────────────┼─────────────────┼──────────────────┼───────');
    for (final mb in sizesMb) {
      final path = '${tmp.path}/f_$mb.bin';
      final chunk = Uint8List(1 << 20); // 1 MiB pattern
      for (var i = 0; i < chunk.length; i++) {
        chunk[i] = (i * 31 + 7) & 0xff;
      }
      final sink = File(path).openSync(mode: FileMode.write);
      for (var i = 0; i < mb; i++) {
        sink.writeFromSync(chunk);
      }
      sink.closeSync();

      final bytes = File(path).readAsBytesSync(); // for B/C; also baked into their totals below
      final tRead = msMin(3, () => File(path).readAsBytesSync());

      final tA = msMin(5, () => sha1File(path));
      final tB = tRead + msMin(5, () => sha1Hex(bytes));
      final tC = tRead + msMin(2, () => crypto.sha1.convert(bytes));

      final hA = sha1File(path);
      final hB = sha1Hex(bytes);
      final hC = crypto.sha1.convert(bytes).toString();
      expect(hA, hB);
      expect(hA, hC);

      final speedup = (tC / tA).toStringAsFixed(1);
      String cell(double ms, int mb) =>
          '${ms.toStringAsFixed(1)}ms ${mbps(mb, ms).padLeft(5)}MB/s';
      print(
        '${mb.toString().padLeft(3)}M │ ${cell(tA, mb)} │ ${cell(tB, mb)} │ ${cell(tC, mb).padRight(16)} │ ${speedup}x',
      );
    }
    print('(A/B/C identical SHA-1; read time included in B/C totals.)');
    print('(NOTE: immich already hashes natively+HW on both platforms — real');
    print(' baseline ~= B, not C. Rust mmap edge over it is the A/B gap (~1.3x).)');
    tmp.deleteSync(recursive: true);
  }, timeout: const Timeout(Duration(minutes: 10)));
}

import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:hooks/hooks.dart';
import 'package:native_toolchain_rust/native_toolchain_rust.dart';

// Builds crates/immich_core_ffi from source on every app build and bundles it as
// a code asset. assetName must match the ffigen output (its package URI is the
// @Native DefaultAsset id). The crate is a sibling, so point cratePath at it.
void main(List<String> args) async {
  await build(args, (input, output) async {
    await _ensureRustTarget(input);
    await RustBuilder(
      assetName: 'src/ffi/bindings.g.dart',
      cratePath: '../crates/immich_core_ffi',
    ).run(input: input, output: output);
  });
}

// rustup only auto-installs the rust-toolchain.toml targets when that file drives
// toolchain selection; with RUSTUP_TOOLCHAIN exported (mise does on CI) the file is
// bypassed and cross targets never install. Add the build target explicitly — a
// fast no-op when it's already present.
Future<void> _ensureRustTarget(BuildInput input) async {
  final code = input.config.code;
  final triple = switch (code.targetOS) {
    OS.android => switch (code.targetArchitecture) {
      Architecture.arm => 'armv7-linux-androideabi',
      Architecture.arm64 => 'aarch64-linux-android',
      Architecture.x64 => 'x86_64-linux-android',
      _ => null,
    },
    OS.iOS => switch ((code.targetArchitecture, code.iOS.targetSdk)) {
      (Architecture.arm64, IOSSdk.iPhoneSimulator) => 'aarch64-apple-ios-sim',
      (Architecture.arm64, _) => 'aarch64-apple-ios',
      (Architecture.x64, _) => 'x86_64-apple-ios',
      _ => null,
    },
    OS.macOS => switch (code.targetArchitecture) {
      Architecture.arm64 => 'aarch64-apple-darwin',
      Architecture.x64 => 'x86_64-apple-darwin',
      _ => null,
    },
    OS.linux => switch (code.targetArchitecture) {
      Architecture.arm64 => 'aarch64-unknown-linux-gnu',
      Architecture.x64 => 'x86_64-unknown-linux-gnu',
      _ => null,
    },
    _ => null,
  };
  if (triple == null) return;
  final crate = input.packageRoot
      .resolve('../crates/immich_core_ffi/')
      .toFilePath();
  // best effort — if rustup itself is broken the build below reports it properly
  await Process.run('rustup', [
    'target',
    'add',
    triple,
  ], workingDirectory: crate);
}

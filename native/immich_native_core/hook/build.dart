import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:hooks/hooks.dart';
import 'package:native_toolchain_rust/native_toolchain_rust.dart';

const _buildDependencies = [
  '../Cargo.toml',
  '../Cargo.lock',
  '../crates/immich_core/Cargo.toml',
  '../crates/immich_core_ffi/Cargo.toml',
  '../crates/immich_core_ffi/rust-toolchain.toml',
  '../crates/immich_core_ffi/build.rs',
  '../crates/immich_core_ffi/cbindgen.toml',
];

void main(List<String> args) async {
  await build(args, (input, output) async {
    if (!input.config.buildCodeAssets) return;
    output.dependencies.addAll(
      _buildDependencies.map(input.packageRoot.resolve),
    );
    await _ensureRustTarget(input);
    final rustFlags = _rustFlags(input);
    await RustBuilder(
      assetName: 'src/ffi/bindings.g.dart',
      cratePath: '../crates/immich_core_ffi',
      // Keep 16 KB alignment and override native_toolchain_rust's API 35 target.
      extraCargoEnvironmentVariables: {'RUSTFLAGS': ?rustFlags},
    ).run(input: input, output: output);
  });
}

String? _rustFlags(BuildInput input) {
  final code = input.config.code;
  if (code.targetOS != OS.android) return null;
  final triple = switch (code.targetArchitecture) {
    Architecture.arm => 'armv7a-linux-androideabi',
    Architecture.arm64 => 'aarch64-linux-android',
    Architecture.x64 => 'x86_64-linux-android',
    _ => throw UnsupportedError(
      'Unsupported Android architecture: ${code.targetArchitecture}',
    ),
  };
  final api = code.android.targetNdkApi;
  return '-C link-arg=-Wl,-z,max-page-size=16384 '
      '-C link-arg=--target=$triple$api';
}

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
    OS.windows => switch (code.targetArchitecture) {
      Architecture.arm64 => 'aarch64-pc-windows-msvc',
      Architecture.x64 => 'x86_64-pc-windows-msvc',
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
  final crate = input.packageRoot.resolve('../crates/immich_core_ffi/');
  final toolchainFile = crate.resolve('rust-toolchain.toml');
  final source = await File.fromUri(toolchainFile).readAsString();
  final channel = RegExp(
    r'^\s*channel\s*=\s*"([^"]+)"\s*$',
    multiLine: true,
  ).firstMatch(source)?.group(1);
  if (channel == null) {
    throw FormatException('Missing toolchain channel in $toolchainFile');
  }
  final args = ['target', 'add', '--toolchain', channel, triple];
  final result = await Process.run(
    'rustup',
    args,
    workingDirectory: crate.toFilePath(),
  );
  final out = '${result.stdout}';
  final err = '${result.stderr}';
  if (out.isNotEmpty) stdout.write(out);
  if (err.isNotEmpty) stderr.write(err);
  if (result.exitCode != 0) {
    throw ProcessException('rustup', args, err, result.exitCode);
  }
}

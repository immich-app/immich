import 'package:hooks/hooks.dart';
import 'package:native_toolchain_rust/native_toolchain_rust.dart';

// Builds crates/immich_core_dart from source on every app build and bundles it as
// a code asset. assetName must match the ffigen output (its package URI is the
// @Native DefaultAsset id). The crate is a sibling, so point cratePath at it.
void main(List<String> args) async {
  await build(args, (input, output) async {
    await RustBuilder(
      assetName: 'src/ffi/bindings.g.dart',
      cratePath: '../crates/immich_core_dart',
    ).run(input: input, output: output);
  });
}

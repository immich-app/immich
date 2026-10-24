// Synthetic media only: this test never uploads or includes personal videos.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const ffprobe = process.env.FFPROBE_PATH || "ffprobe";
const cuda = process.argv.includes("--cuda");
const run = (binary, args) => {
  const result = spawnSync(binary, args, {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `${binary} ${args.join(" ")}\n${result.stderr}`,
  );
  return result.stdout + result.stderr;
};

assert.match(run(ffmpeg, ["-version"]), /ffmpeg version 8\.1\.3/);
assert.match(run(ffprobe, ["-version"]), /ffprobe version 8\.1\.3/);
const filters = run(ffmpeg, ["-hide_banner", "-filters"]);
for (const filter of cuda
  ? ["tonemapx", "tonemap_cuda", "scale_cuda"]
  : ["tonemapx"])
  assert.ok(filters.includes(filter), filter);
if (cuda)
  assert.ok(run(ffmpeg, ["-hide_banner", "-encoders"]).includes("h264_nvenc"));

const dir = mkdtempSync(join(tmpdir(), "immich-hdr-"));
// NVDEC rejects tiny HEVC fixtures (some GPUs require a width of at least 144).
const width = 256;
const height = 256;
const pixels = width * height;
const raw = Buffer.alloc(pixels * 3);
for (let i = 0; i < pixels * 1.5; i++) raw.writeUInt16LE(512, i * 2);
// Three frames let HEVC's delayed decoder expose VUI metadata during probing.
writeFileSync(join(dir, "gray.yuv"), Buffer.concat([raw, raw, raw]));
const colorArgs = [
  "-color_primaries",
  "bt709",
  "-color_trc",
  "bt709",
  "-colorspace",
  "bt709",
  "-color_range",
  "pc",
];
const cpuFilter =
  "tonemapx=tonemap=hable:desat=0:p=bt709:t=bt709:m=bt709:r=pc:peak=100:format=yuv420p";
const gpuFilter =
  "tonemap_cuda=desat=0:matrix=bt709:primaries=bt709:range=pc:tonemap=hable:tonemap_mode=lum:transfer=bt709:peak=100:format=nv12";

const measure = (path) => {
  const rawPath = `${path}.yuv`;
  run(ffmpeg, [
    "-v",
    "error",
    "-i",
    path,
    "-frames:v",
    "1",
    "-pix_fmt",
    "yuv420p",
    "-f",
    "rawvideo",
    rawPath,
  ]);
  const y = readFileSync(rawPath).subarray(0, pixels);
  const mean = y.reduce((sum, value) => sum + value, 0) / y.length;
  assert.ok(
    mean > 32 && mean < 250,
    `HDR luminance was crushed or clipped: ${mean}`,
  );
  const probe = JSON.parse(
    run(ffprobe, [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_streams",
      "-of",
      "json",
      path,
    ]),
  );
  for (const field of ["color_primaries", "color_transfer", "color_space"])
    assert.equal(probe.streams[0][field], "bt709");
  return mean;
};

try {
  for (const transfer of ["arib-std-b67", "smpte2084"]) {
    const input = join(dir, `${transfer}.mkv`);
    run(ffmpeg, [
      "-v",
      "error",
      "-f",
      "rawvideo",
      "-pixel_format",
      "yuv420p10le",
      "-video_size",
      `${width}x${height}`,
      "-framerate",
      "1",
      "-i",
      join(dir, "gray.yuv"),
      "-frames:v",
      "3",
      "-c:v",
      "libx265",
      "-x265-params",
      `log-level=error:colorprim=9:transfer=${transfer === "arib-std-b67" ? 18 : 16}:colormatrix=9:range=full`,
      "-color_primaries",
      "bt2020",
      "-color_trc",
      transfer,
      "-colorspace",
      "bt2020nc",
      "-color_range",
      "pc",
      input,
    ]);
    const source = JSON.parse(
      run(ffprobe, [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-read_intervals",
        "%+#32",
        "-show_entries",
        "frame=color_primaries,color_transfer,color_space",
        "-of",
        "json",
        input,
      ]),
    );
    assert.equal(
      source.frames[0].color_transfer,
      transfer,
      JSON.stringify(source.frames[0]),
    );
    const cpu = join(dir, `${transfer}-cpu.mp4`);
    run(ffmpeg, [
      "-v",
      "error",
      "-i",
      input,
      "-vf",
      cpuFilter,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      ...colorArgs,
      cpu,
    ]);
    const cpuMean = measure(cpu);
    console.log(`${transfer}: software tone-map luma=${cpuMean.toFixed(1)}`);
    if (cuda) {
      const gpu = join(dir, `${transfer}-cuda.mp4`);
      run(ffmpeg, [
        "-v",
        "error",
        "-hwaccel",
        "cuda",
        "-hwaccel_output_format",
        "cuda",
        "-noautorotate",
        "-i",
        input,
        "-vf",
        gpuFilter,
        "-c:v",
        "h264_nvenc",
        ...colorArgs,
        gpu,
      ]);
      const gpuMean = measure(gpu);
      assert.ok(
        gpuMean / cpuMean > 0.5 && gpuMean / cpuMean < 1.5,
        `CUDA/software luminance mismatch: ${gpuMean}/${cpuMean}`,
      );
      console.log(`${transfer}: NVDEC/CUDA/NVENC luma=${gpuMean.toFixed(1)}`);
    }
  }
  console.log(
    cuda
      ? "HDR CUDA regression passed."
      : "HDR CPU smoke passed; use --cuda on an NVIDIA host to test the full GPU path.",
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}

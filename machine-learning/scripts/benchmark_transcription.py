"""Measure transcription throughput, memory footprint and the effect of VAD.

This is the harness behind the performance gate for automatic video subtitles.
It drives the production code path (`WhisperTranscriber`) and the production
audio extraction flags, so the numbers it reports are the numbers the job
queue would see, not a best case from a hand-tuned script.

    uv run scripts/benchmark_transcription.py VIDEO [--model small] [--threads 4]

It reports throughput as a *speed ratio* against real time: how many seconds of
media are transcribed per second of wall clock. Higher is better, and the gate
threshold is 2x.

Measure on a representative personal video. A continuous-speech benchmark clip
overstates the work per second of media, because VAD skips the silence that
makes up most of real footage, so it will understate the ratio you would
actually see in a library.
"""

from __future__ import annotations

import argparse
import gc
import json
import shutil
import subprocess
import tempfile
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from immich_ml.models.transcription.whisper import WhisperTranscriber

MIB = 1024 * 1024

# Ratio of media duration to wall time below which the gate escalates rather
# than silently accepting a slower model. See issue #4.
GATE_THRESHOLD = 2.0

# Mirrors MediaRepository.extractAudio in the server. Kept in sync by hand;
# there is no shared definition across the two languages.
FFMPEG_AUDIO_ARGS = ["-vn", "-ac", "1", "-ar", "16000", "-f", "wav"]


def read_rss_bytes() -> int:
    """Current resident set size of this process."""
    return _read_status_field("VmRSS")


def read_peak_rss_bytes() -> int:
    """High-water mark of resident set size since the process started.

    The kernel never lowers this, so a value sampled after a pass covers that
    pass *and* everything before it. Read the last pass for the true peak.
    """
    return _read_status_field("VmHWM")


def _read_status_field(field_name: str) -> int:
    for line in Path("/proc/self/status").read_text().splitlines():
        if line.startswith(f"{field_name}:"):
            # e.g. "VmRSS:\t  123456 kB"
            return int(line.split()[1]) * 1024
    raise RuntimeError(f"{field_name} not found in /proc/self/status (Linux only)")


def probe_duration_seconds(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def extract_audio(source: Path, destination: Path) -> float:
    """Extract 16kHz mono WAV exactly as the server does. Returns wall seconds."""
    started = time.perf_counter()
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-i", str(source), *FFMPEG_AUDIO_ARGS, str(destination)],
        capture_output=True,
        check=True,
    )
    return time.perf_counter() - started


@dataclass
class TranscribePass:
    """One decode of the whole audio, with VAD either on or off."""

    vad: bool
    wall_seconds: float
    speed_ratio: float
    segment_count: int
    # Total duration covered by emitted segments. This is what the model chose
    # to write down, which is not the same as what VAD considers speech: with
    # VAD off the model emits text over music and silence too.
    segment_coverage_seconds: float
    segment_coverage_fraction: float
    language: str
    peak_rss_mib: float


@dataclass
class BenchmarkResult:
    video: str
    media_seconds: float
    model_name: str
    cpu_threads: int
    compute_type: str
    # Speech as VAD sees it. Decode cost scales with this, not with duration.
    vad_speech_seconds: float
    vad_speech_fraction: float
    vad_detection_seconds: float
    audio_extraction_seconds: float
    model_load_seconds: float
    model_rss_mib: float
    baseline_rss_mib: float
    host_cpu: str
    loadavg_1min: float
    passes: list[TranscribePass] = field(default_factory=list)

    @property
    def vad_pass(self) -> TranscribePass:
        return next(p for p in self.passes if p.vad)


def measure_vad_speech(audio_path: Path) -> tuple[float, float]:
    """Return (speech seconds VAD detects, wall seconds VAD itself took)."""
    from faster_whisper.audio import decode_audio
    from faster_whisper.vad import VadOptions, get_speech_timestamps

    audio = decode_audio(str(audio_path), sampling_rate=16000)
    started = time.perf_counter()
    timestamps = get_speech_timestamps(audio, VadOptions())
    elapsed = time.perf_counter() - started
    speech_samples = sum(t["end"] - t["start"] for t in timestamps)
    return speech_samples / 16000, elapsed


def host_cpu_model() -> str:
    for line in Path("/proc/cpuinfo").read_text().splitlines():
        if line.startswith("model name"):
            return line.split(":", 1)[1].strip()
    return "unknown"


def run_pass(model: WhisperTranscriber, audio_path: Path, media_seconds: float, *, vad: bool) -> TranscribePass:
    gc.collect()
    started = time.perf_counter()
    # multilingual=True matches production: language is re-identified per window
    # rather than fixed from the first 30 seconds.
    segments, info = model.model.transcribe(str(audio_path), vad_filter=vad, multilingual=True)
    # transcribe() returns a generator and does no decoding until it is consumed,
    # so the list() is what actually performs the work being timed.
    decoded = list(segments)
    wall_seconds = time.perf_counter() - started

    coverage = sum(segment.end - segment.start for segment in decoded)
    return TranscribePass(
        vad=vad,
        wall_seconds=round(wall_seconds, 2),
        speed_ratio=round(media_seconds / wall_seconds, 2),
        segment_count=len(decoded),
        segment_coverage_seconds=round(coverage, 1),
        segment_coverage_fraction=round(coverage / media_seconds, 3),
        language=info.language,
        peak_rss_mib=round(read_peak_rss_bytes() / MIB, 1),
    )


def benchmark(video: Path, model_name: str, threads: int) -> BenchmarkResult:
    media_seconds = probe_duration_seconds(video)

    with tempfile.TemporaryDirectory() as tmp:
        # Load the model before touching any audio. Decoded audio and the VAD
        # model are hundreds of MiB in their own right, and letting them land
        # in the baseline first makes the model's own RSS delta unreadable.
        gc.collect()
        baseline_rss = read_rss_bytes()

        model = WhisperTranscriber(model_name, cpu_threads=threads)
        load_started = time.perf_counter()
        model.load()
        load_seconds = time.perf_counter() - load_started

        gc.collect()
        loaded_rss = read_rss_bytes()

        audio_path = Path(tmp) / "audio.wav"
        extraction_seconds = extract_audio(video, audio_path)

        vad_speech_seconds, vad_detection_seconds = measure_vad_speech(audio_path)

        result = BenchmarkResult(
            video=str(video),
            media_seconds=round(media_seconds, 1),
            model_name=model_name,
            cpu_threads=threads,
            compute_type="int8",
            vad_speech_seconds=round(vad_speech_seconds, 1),
            vad_speech_fraction=round(vad_speech_seconds / media_seconds, 3),
            vad_detection_seconds=round(vad_detection_seconds, 2),
            audio_extraction_seconds=round(extraction_seconds, 2),
            model_load_seconds=round(load_seconds, 2),
            model_rss_mib=round((loaded_rss - baseline_rss) / MIB, 1),
            baseline_rss_mib=round(baseline_rss / MIB, 1),
            host_cpu=host_cpu_model(),
            loadavg_1min=float(Path("/proc/loadavg").read_text().split()[0]),
        )

        for vad in (True, False):
            result.passes.append(run_pass(model, audio_path, media_seconds, vad=vad))

    return result


def format_report(result: BenchmarkResult) -> str:
    lines = [
        "",
        f"video                {Path(result.video).name}",
        f"media duration       {result.media_seconds:.1f}s ({result.media_seconds / 60:.1f} min)",
        f"model                faster-whisper-{result.model_name} "
        f"({result.compute_type}, {result.cpu_threads} threads)",
        f"host                 {result.host_cpu} (loadavg {result.loadavg_1min:.2f})",
        f"audio extraction     {result.audio_extraction_seconds:.2f}s",
        f"model load           {result.model_load_seconds:.2f}s",
        f"model memory (RSS)   {result.model_rss_mib:.1f} MiB over a {result.baseline_rss_mib:.1f} MiB baseline",
        f"speech per VAD       {result.vad_speech_seconds:.1f}s of {result.media_seconds:.1f}s "
        f"({result.vad_speech_fraction:.1%}), detected in {result.vad_detection_seconds:.2f}s",
        "",
    ]

    for p in result.passes:
        label = "VAD on " if p.vad else "VAD off"
        lines += [
            f"{label}              {p.wall_seconds:.2f}s wall -> {p.speed_ratio:.2f}x real time",
            f"                     {p.segment_count} segments covering {p.segment_coverage_seconds:.1f}s "
            f"({p.segment_coverage_fraction:.1%} of media), language={p.language}",
            f"                     peak RSS {p.peak_rss_mib:.1f} MiB (cumulative high-water mark)",
        ]

    on, off = result.vad_pass, next(p for p in result.passes if not p.vad)
    lines += [
        "",
        f"VAD effect           {off.wall_seconds / on.wall_seconds:.2f}x faster with VAD "
        f"({off.wall_seconds - on.wall_seconds:+.2f}s saved)",
        "",
    ]

    ratio = on.speed_ratio
    if ratio >= GATE_THRESHOLD:
        lines.append(f"GATE: PASS  {ratio:.2f}x >= {GATE_THRESHOLD:.1f}x real time. Model selection stands.")
    else:
        lines.append(
            f"GATE: FAIL  {ratio:.2f}x < {GATE_THRESHOLD:.1f}x real time. Escalate; do not substitute a smaller model."
        )

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("video", type=Path, help="path to a representative personal video")
    parser.add_argument("--model", default="small", help="whisper model name (default: small, matching server config)")
    parser.add_argument("--threads", type=int, default=4, help="CPU threads (default: 4, matching server config)")
    parser.add_argument("--json", type=Path, help="also write the raw measurements here")
    args = parser.parse_args()

    if not args.video.is_file():
        parser.error(f"no such file: {args.video}")
    for tool in ("ffmpeg", "ffprobe"):
        if shutil.which(tool) is None:
            parser.error(f"{tool} is required but was not found on PATH")

    result = benchmark(args.video, args.model, args.threads)
    print(format_report(result))

    if args.json:
        payload: dict[str, Any] = asdict(result)
        args.json.write_text(json.dumps(payload, indent=2) + "\n")
        print(f"raw measurements written to {args.json}")

    return 0 if result.vad_pass.speed_ratio >= GATE_THRESHOLD else 1


if __name__ == "__main__":
    raise SystemExit(main())

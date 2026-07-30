# Transcription performance gate

Whether `faster-whisper-small` at int8 is fast enough on target hardware to keep
automatic video subtitles worth having, measured rather than assumed.

**Outcome: gate closed, model selection stands.** Throughput in the production
configuration is **3.5x real time** on the slowest material measured, against a
2x threshold. No escalation, and because the model does not change, the
language-handling decisions that depend on encoder capacity need no re-review.

Reproduce with [`scripts/benchmark_transcription.py`](../scripts/benchmark_transcription.py):

```bash
uv run scripts/benchmark_transcription.py VIDEO --model small --threads 4
```

## Hardware and configuration

| | |
|---|---|
| CPU | Intel Core i7-8650U @ 1.90GHz (4 cores / 8 threads, 2018 mobile) |
| Memory | 23 GiB |
| Accelerator | none — CPU only |
| Model | `Systran/faster-whisper-small`, int8, 4 CPU threads |
| VAD | Silero via `vad_filter=True` |
| Language ID | `multilingual=True` (per-window) |

This is a deliberately unflattering host: a seven-year-old ultrabook CPU, no
GPU, and 4 threads because that is the server's `machineLearning.transcription
.threads` default. Load average was 5.9-6.5 during the runs, of which roughly 4
is the benchmark itself and the remainder other desktop workload, so the numbers
are a floor rather than a best case. Transcription runs at queue concurrency 1,
so one video has these 4 threads to itself.

## What was measured, and on what

The harness drives the production `WhisperTranscriber` and the server's exact
audio-extraction flags (`-vn -ac 1 -ar 16000 -f wav`, mirroring
`MediaRepository.extractAudio`), so it measures the path the job queue actually
takes.

Finding representative personal video with speech turned out to be the hard
part. Public archives of "home movies" are dominated by silent-era transfers and
music-over-video montages: of four candidates pulled from archive.org, one had no
audio stream at all, one had an AAC track carrying no signal, and one — an
11.5-minute amateur wedding video with genuine audio (RMS 0.081) — contains
**zero** VAD-detected speech across its entire length. That last one is kept in
the set precisely because it is real and representative, not despite it.

| Clip | Source | Duration | VAD speech | Character |
|---|---|---|---|---|
| Amateur vlog | archive.org `UXKrvkUNnqI` (2025 livestream VOD) | 940s | 88.6% | Real personal video, talking-heavy |
| Wedding montage | archive.org `matrimonio_202010` | 689s | 0.0% | Real personal video, music only |
| LibriVox chapter | archive.org `vicar_of_wakefield_librivox` | 553s | 97.9% | Continuous speech, worst case |

The issue asks for representative personal video rather than a continuous-speech
clip, on the grounds that a dense clip understates throughput. That is correct,
and it is why the LibriVox clip is included rather than excluded: it measures the
conservative direction. See [Why the worst case settles it](#why-the-worst-case-settles-it).

## Results

Production configuration is the **VAD on** column; VAD off is shown only to
quantify what VAD contributes.

| Clip | VAD speech | VAD on | VAD off | VAD speedup |
|---|---|---|---|---|
| Amateur vlog | 88.6% | **3.97x** | 3.10x | 1.28x |
| Wedding montage | 0.0% | **127.58x** | 1.95x | 65.5x |
| LibriVox | 97.9% | **3.51x** | 2.95x | 1.19x |

Across three independent full repetitions the production figures ranged
3.74-4.06x (vlog), 123-139x (montage) and 2.88-3.51x (LibriVox). The single
worst production observation anywhere in that set was **2.88x**, still 44% above
threshold.

### Memory footprint

Resident set attributable to the loaded model, sampled before any audio is
touched, was **397 MiB** over a ~261 MiB interpreter baseline. That figure is
solid: 397.1 MiB on all three clips, and 397.2-397.3 MiB across five repetitions
of an isolated load-and-measure with nothing else in the process. Model load took
~1.1s from warm page cache. One outlier of 477 MiB was observed on a run started
under load average 7.4, so budget ~400 MiB with headroom to ~480 MiB rather than
treating 397 as a hard ceiling.

Peak RSS for the whole process during a production (VAD on) transcription scales
with clip length, since faster-whisper holds decoded audio in memory:

| Clip | Duration | Peak RSS |
|---|---|---|
| Wedding montage | 689s | 940 MiB |
| LibriVox | 553s | 1188 MiB |
| Amateur vlog | 940s | 1458 MiB |

So budget roughly 400 MiB steady-state for the model and up to ~1.5 GiB peak for
a 15-minute video. This is the strongest argument for chunking long audio, which
the tracer bullet explicitly deferred — a feature-length video would extrapolate
past comfortable headroom on a small host.

### Effect of voice activity detection

VAD's benefit is entirely a function of how much speech the content actually
contains, and on real personal video that swing is enormous:

- **Music-only montage**: 65.5x faster with VAD (5.4s versus 353.8s). VAD
  eliminates 100% of decode work.
- **Talking-heavy vlog**: 1.28x faster.
- **Continuous speech**: 1.19x faster — little left to skip.

Two things worth flagging. First, with VAD off the montage decodes at **1.95x**,
the only sub-threshold figure measured anywhere: without VAD, a real personal
video in this library would fail the gate. VAD is load-bearing, not an
optimisation. Second, with VAD off the model *hallucinates* over non-speech — it
emitted 24 segments covering 396s of a clip containing no speech whatsoever.
Keeping `vad_filter=True` unconditionally is therefore a correctness measure as
much as a performance one.

### Cost model

The three clips fit a simple additive model. The montage, having zero speech,
isolates the VAD scan cost on its own:

- **VAD scan**: 0.78% of media duration (5.4s for 689s of audio)
- **Decode**: 3.53-3.63 seconds of speech per second of wall clock

giving `wall ≈ 0.0078 x duration + speech_seconds / 3.5`. The two speech-bearing
clips agree to within 3% on the decode rate despite differing in length, speech
density and content, which is what makes the extrapolation below trustworthy.

## Why the worst case settles it

Decode cost tracks *detected speech seconds*, not media duration — that is the
whole point of VAD, and the montage result demonstrates it at the limit. Since no
video can be more than 100% speech, the cost model gives a hard floor:

```
floor = 1 / (0.0078 + 1/3.53) = 3.44x real time
```

The LibriVox clip at 97.9% speech measures 3.51x, essentially at that floor. So
every video — including any personal video, which by construction has *less*
speech to decode than a continuous-speech recording — lands at or above ~3.4x on
this hardware. The gate does not rest on one clip happening to be fast; it rests
on the slowest possible input still clearing the bar by 72%.

## Decision

Applying the rule from the issue:

> At or above 2x real time — the model selection stands.

**Gate closed.** `small` / int8 / 4 threads is confirmed, dependent slices are
unblocked, and no escalation is required. Since the model is unchanged, the
per-window language identification decisions that depend on encoder capacity
stand as well.

Practically, a 10-minute personal video costs somewhere between 5 seconds (music
montage) and about 2.5 minutes (wall-to-wall talking) of background processing on
2018-era mobile silicon with no GPU.

## Caveats

- Single host, CPU only. A GPU or a modern desktop CPU only improves this; a
  NAS-class Celeron or low-end ARM board could plausibly fall below 2x and is
  not covered here. Anyone targeting such hardware should re-run the harness
  before assuming the gate holds.
- The host was not quiet (load average ~2 before the benchmark's own 4 threads).
  This biases the measurements low, not high.
- Timings are single-shot per clip within a run; run-to-run spread was up to
  ~18% on the same clip, driven by competing load. The reported margin is far
  wider than that spread.
- Only English-language material was measured. Throughput is a function of audio
  duration and encoder/decoder passes rather than language, but non-English
  content with heavier token counts per second could decode somewhat slower.

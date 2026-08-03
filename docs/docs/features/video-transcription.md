# Video Transcription

## Overview

Immich can automatically transcribe the speech in your videos, similarly to how it detects faces or recognizes text in images. Once a video has been transcribed, its transcript is used in three places:

- **Captions** are burned into the video player automatically, both in the main app and on shared links.
- **The transcript panel**, available from the asset viewer, shows the full transcript synced to playback position and lets you search or correct it.
- **Search** can match videos by what's spoken in them, in addition to the existing context, description, and OCR search types.

<img src={require('./img/video-transcription-1.webp').default} title='Live captions during playback' />

Opening the transcript panel from the asset viewer shows every segment, highlights the one currently playing, and lets you jump to any point in the video by clicking a segment.

<img src={require('./img/video-transcription-2.webp').default} title='Transcript panel' />

## Searching by transcript

Selecting **Transcript** as the search type finds videos by the words that are spoken in them.

<img src={require('./img/video-transcription-3.webp').default} title='Searching by transcript content' />

## Actions

Additional actions available on a video's transcript:

- **Correct a segment** — clicking the pencil icon next to a segment lets you edit its text. Corrected segments are locked so a future re-transcription won't overwrite your edit.
- **Refresh transcript** — available from the asset's context menu, this re-queues the video for transcription, for example after changing the configured model or language.
- **Bulk transcription** — administrators can queue transcription for the whole library from the Job Queues admin page, the same way other machine-learning jobs are managed.

## Administration

Machine Learning Settings has a **Transcription** section with:

- **Enable transcription** — if disabled, videos are never transcribed regardless of the settings below.
- **Transcription model** — the name of a [faster-whisper](https://huggingface.co/Systran) model. Larger models are slower and use more memory but produce better results.
- **Language** — the language to assume for every video in the library, or automatic per-video detection. Forcing a language when only one is ever spoken turns misdetection from unlikely into impossible.
- **Maximum video duration** — videos longer than this are never transcribed and are not re-examined by future transcription jobs, to bound worst-case processing time on very long videos. Leave blank for no limit.

<img src={require('./img/video-transcription-4.webp').default} title='Transcription settings' />

## How It Works

Transcription is handled by [faster-whisper](https://github.com/SYSTRAN/faster-whisper) running in the machine-learning service, the same way facial recognition and smart search use their own models there.

For a queued video, the audio track is extracted and split into windows aligned to silence, so a window boundary never falls in the middle of a word. Each window is transcribed independently, which lets processing resume from where it left off if a job is interrupted partway through a long video, instead of restarting from the beginning.

When language isn't forced by an administrator, each window's language is detected independently. Because Whisper's per-window language guess can be unreliable right at a language switch, detection is "sticky": a language only changes once nearby windows agree, which avoids flip-flopping between languages on a single ambiguous window.

A window that straddles a real language switch would otherwise mislabel up to a whole window's worth of audio with whichever language the switch happened not to fall closest to. Whisper's own confidence score identifies these windows on its own — a window entirely in one language reads back confidently, a window straddling a switch does not — so only the ambiguous windows pay for extra detection passes: both ends of the window are probed, and only if they disagree is the boundary between them located by bisection. A single-language recording, the common case, pays nothing extra for this.

Each resulting segment carries confidence and no-speech-probability signals from the model. Segments that look like Whisper's known hallucination patterns — for example, a phrase repeated over what's actually near-silent audio — are filtered out using these signals rather than being surfaced as if they were real speech.

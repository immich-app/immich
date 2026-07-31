import { videoPlayerManager } from '$lib/managers/video-player-manager.svelte';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import {
  AssetTypeEnum,
  getAssetTranscript,
  TranscriptionStatus,
  type AssetTranscriptResponseDto,
  type TranscriptSegmentResponseDto,
} from '@immich/sdk';
import { fireEvent, waitFor } from '@testing-library/svelte';
import TranscriptPanel from './TranscriptPanel.svelte';

vi.mock('@immich/sdk', async () => {
  const sdk = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...sdk,
    getAssetTranscript: vi.fn(),
  };
});

const segment = (startTime: number, text: string): TranscriptSegmentResponseDto => ({
  id: `segment-${startTime}`,
  startTime,
  endTime: startTime + 2,
  text,
  language: 'en',
});

const transcript = (
  status: TranscriptionStatus,
  segments: TranscriptSegmentResponseDto[],
  progressMs = 0,
): AssetTranscriptResponseDto => ({ status, progressMs, segments });

/** Stands in for the video element the viewer would have registered. */
const fakePlayer = () => ({ currentTime: 0 }) as HTMLVideoElement;

describe('TranscriptPanel', () => {
  const asset = assetFactory.build({ type: AssetTypeEnum.Video, duration: 600_000 });

  const renderPanel = () => renderWithTooltips(TranscriptPanel, { asset, onClose: () => {} });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists the transcript with a timestamp per line', async () => {
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello there'), segment(75, 'General Kenobi')]),
    );

    const { findByText, getByText } = renderPanel();

    expect(await findByText('Hello there')).toBeInTheDocument();
    expect(getByText('General Kenobi')).toBeInTheDocument();
    expect(getByText('00:00')).toBeInTheDocument();
    expect(getByText('01:15')).toBeInTheDocument();
  });

  it('narrows the lines to those matching the filter', async () => {
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello there'), segment(4, 'General Kenobi')]),
    );

    const { findByText, getByPlaceholderText, queryByText } = renderPanel();
    await findByText('Hello there');

    await fireEvent.input(getByPlaceholderText('filter_transcript'), { target: { value: 'kenobi' } });

    await waitFor(() => expect(queryByText('Hello there')).toBeNull());
    expect(queryByText('General Kenobi')).toBeInTheDocument();
  });

  it('reports a filter that matches nothing rather than an empty panel', async () => {
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello there')]),
    );

    const { findByText, getByPlaceholderText } = renderPanel();
    await findByText('Hello there');

    await fireEvent.input(getByPlaceholderText('filter_transcript'), { target: { value: 'nothing here' } });

    expect(await findByText('transcript_no_matches')).toBeInTheDocument();
  });

  it('seeks the video to the line that was clicked', async () => {
    const player = fakePlayer();
    videoPlayerManager.register(asset.id, player);
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello there'), segment(75, 'General Kenobi')]),
    );

    const { findByText } = renderPanel();

    await fireEvent.click(await findByText('General Kenobi'));

    expect(player.currentTime).toBe(75);
    videoPlayerManager.unregister(player);
  });

  it('highlights the line being spoken and moves the highlight as playback advances', async () => {
    const player = fakePlayer();
    videoPlayerManager.register(asset.id, player);
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello there'), segment(75, 'General Kenobi')]),
    );

    const { findByText } = renderPanel();
    const first = await findByText('Hello there');
    const second = await findByText('General Kenobi');

    expect(first.closest('button')).toHaveAttribute('aria-current', 'true');
    expect(second.closest('button')).not.toHaveAttribute('aria-current');

    player.currentTime = 80;
    videoPlayerManager.onTimeUpdate(player);

    await waitFor(() => expect(second.closest('button')).toHaveAttribute('aria-current', 'true'));
    expect(first.closest('button')).not.toHaveAttribute('aria-current');
    videoPlayerManager.unregister(player);
  });

  it('stops following playback once the reader scrolls, and offers to resume', async () => {
    const player = fakePlayer();
    videoPlayerManager.register(asset.id, player);
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello there')]),
    );

    const { container, findByText, queryByText } = renderPanel();
    await findByText('Hello there');

    expect(queryByText('transcript_follow_playback')).toBeNull();

    const list = container.querySelector('ol') as HTMLElement;
    await fireEvent.scroll(list);

    expect(await findByText('transcript_follow_playback')).toBeInTheDocument();

    await fireEvent.click(await findByText('transcript_follow_playback'));

    await waitFor(() => expect(queryByText('transcript_follow_playback')).toBeNull());
    videoPlayerManager.unregister(player);
  });

  it('shows the lines produced so far while transcription is still running', async () => {
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.InProgress, [segment(0, 'Hello there')], 300_000),
    );

    const { findByText, getByTestId } = renderPanel();

    expect(await findByText('Hello there')).toBeInTheDocument();
    expect(getByTestId('transcript-in-progress')).toBeInTheDocument();
  });

  it('distinguishes a transcript that has not started from one still running and one with no speech', async () => {
    vi.mocked(getAssetTranscript).mockResolvedValue(transcript(TranscriptionStatus.NotStarted, []));
    const notStarted = renderPanel();
    expect(await notStarted.findByText('transcript_not_started')).toBeInTheDocument();
    notStarted.unmount();

    vi.mocked(getAssetTranscript).mockResolvedValue(transcript(TranscriptionStatus.InProgress, []));
    const inProgress = renderPanel();
    expect(await inProgress.findByText('transcript_pending_lines')).toBeInTheDocument();
    inProgress.unmount();

    vi.mocked(getAssetTranscript).mockResolvedValue(transcript(TranscriptionStatus.Complete, []));
    const complete = renderPanel();
    expect(await complete.findByText('transcript_no_speech')).toBeInTheDocument();
    complete.unmount();
  });

  it('reports a failed load rather than an empty transcript', async () => {
    vi.mocked(getAssetTranscript).mockRejectedValue(new Error('offline'));

    const { findByText } = renderPanel();

    expect(await findByText('errors.unable_to_load_transcript')).toBeInTheDocument();
  });

  it('stops asking for a transcript once it is complete', async () => {
    vi.useFakeTimers();
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello there')]),
    );

    renderPanel();
    await vi.waitFor(() => expect(getAssetTranscript).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(60_000);

    expect(getAssetTranscript).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('keeps asking while the transcript is still being produced', async () => {
    vi.useFakeTimers();
    vi.mocked(getAssetTranscript).mockResolvedValue(transcript(TranscriptionStatus.InProgress, [], 1000));

    renderPanel();
    await vi.waitFor(() => expect(getAssetTranscript).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(15_000);

    expect(getAssetTranscript).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

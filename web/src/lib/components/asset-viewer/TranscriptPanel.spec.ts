import {
  AssetTypeEnum,
  getAssetTranscript,
  TranscriptionStatus,
  updateTranscriptSegment,
  type AssetTranscriptResponseDto,
  type TranscriptSegmentResponseDto,
} from '@immich/sdk';
import { fireEvent, waitFor } from '@testing-library/svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { videoPlayerManager } from '$lib/managers/video-player-manager.svelte';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import TranscriptPanel from './TranscriptPanel.svelte';

vi.mock('@immich/sdk', async () => {
  const sdk = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...sdk,
    getAssetTranscript: vi.fn(),
    updateTranscriptSegment: vi.fn(),
  };
});

const segment = (
  startTime: number,
  text: string,
  correctedText: string | null = null,
): TranscriptSegmentResponseDto => ({
  id: `segment-${startTime}`,
  startTime,
  endTime: startTime + 2,
  text,
  correctedText,
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
  const asset = assetFactory.build({ type: AssetTypeEnum.Video, duration: 600_000, ownerId: 'owner-id' });

  const renderPanel = () => renderWithTooltips(TranscriptPanel, { asset, onClose: () => {} });

  /** Edit and revert are only offered to whoever holds asset-update permission. */
  const signInAsOwner = () => {
    authManager.setUser(userAdminFactory.build({ id: asset.ownerId }));
    authManager.setPreferences(preferencesFactory.build());
  };

  afterEach(() => {
    authManager.reset();
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
    list.scrollTop = 240;
    await fireEvent.scroll(list);

    expect(await findByText('transcript_follow_playback')).toBeInTheDocument();

    await fireEvent.click(await findByText('transcript_follow_playback'));

    await waitFor(() => expect(queryByText('transcript_follow_playback')).toBeNull());
    videoPlayerManager.unregister(player);
  });

  it('does not mistake the list resizing under a filter for the reader scrolling', async () => {
    const player = fakePlayer();
    videoPlayerManager.register(asset.id, player);
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello there'), segment(4, 'General Kenobi')]),
    );

    const { container, findByText, getByPlaceholderText, queryByText } = renderPanel();
    await findByText('Hello there');

    await fireEvent.input(getByPlaceholderText('filter_transcript'), { target: { value: 'kenobi' } });
    // Fewer lines is a shorter scroll area, and the browser clamps the scroll position to fit,
    // which reaches the panel as a scroll event it did not cause.
    await fireEvent.scroll(container.querySelector('ol') as HTMLElement);

    expect(queryByText('transcript_follow_playback')).toBeNull();
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

  it('reports a video that exceeds the configured maximum duration, distinguishably from no speech found', async () => {
    vi.mocked(getAssetTranscript).mockResolvedValue(transcript(TranscriptionStatus.SkippedMaxDuration, []));

    const { findByText } = renderPanel();

    expect(await findByText('transcript_skipped_max_duration')).toBeInTheDocument();
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

  it('stops asking for a transcript once it is skipped for exceeding the maximum duration', async () => {
    vi.useFakeTimers();
    vi.mocked(getAssetTranscript).mockResolvedValue(transcript(TranscriptionStatus.SkippedMaxDuration, []));

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

  it('distinguishes a corrected line from machine output and keeps the original viewable', async () => {
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello Jon', 'Hello John')]),
    );

    const { findByText, getByTestId } = renderPanel();

    expect(await findByText('Hello John')).toBeInTheDocument();
    expect(getByTestId('transcript-corrected-badge')).toBeInTheDocument();
    expect(getByTestId('transcript-original-text')).toBeInTheDocument();
  });

  it('does not offer edit or revert controls to someone without asset-update access', async () => {
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Hello there', 'Corrected')]),
    );

    const { findByText, queryByTestId } = renderPanel();
    await findByText('Corrected');

    expect(queryByTestId('transcript-edit-button')).toBeNull();
    expect(queryByTestId('transcript-revert-button')).toBeNull();
  });

  it('lets the owner correct a line inline', async () => {
    signInAsOwner();
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Misheard name')]),
    );
    vi.mocked(updateTranscriptSegment).mockResolvedValue(segment(0, 'Misheard name', 'Corrected name'));

    const { findByText, getByTestId } = renderPanel();
    await findByText('Misheard name');

    await fireEvent.click(getByTestId('transcript-edit-button'));
    const input = getByTestId('transcript-segment-input') as HTMLTextAreaElement;
    await fireEvent.input(input, { target: { value: 'Corrected name' } });
    await fireEvent.focusOut(input);

    await waitFor(() =>
      expect(updateTranscriptSegment).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          segmentId: 'segment-0',
          updateTranscriptSegmentDto: { correctedText: 'Corrected name' },
        }),
      ),
    );
    expect(await findByText('Corrected name')).toBeInTheDocument();
    expect(getByTestId('transcript-corrected-badge')).toBeInTheDocument();
  });

  it('discards the edit on Escape without saving', async () => {
    signInAsOwner();
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Misheard name')]),
    );

    const { findByText, getByTestId } = renderPanel();
    await findByText('Misheard name');

    await fireEvent.click(getByTestId('transcript-edit-button'));
    const input = getByTestId('transcript-segment-input') as HTMLTextAreaElement;
    await fireEvent.input(input, { target: { value: 'Something else entirely' } });
    await fireEvent.keyDown(input, { key: 'Escape' });

    expect(await findByText('Misheard name')).toBeInTheDocument();
    expect(updateTranscriptSegment).not.toHaveBeenCalled();
  });

  it('lets the owner revert a correction back to the model text', async () => {
    signInAsOwner();
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Misheard name', 'Corrected name')]),
    );
    vi.mocked(updateTranscriptSegment).mockResolvedValue(segment(0, 'Misheard name'));

    const { findByText, getByTestId, queryByTestId } = renderPanel();
    await findByText('Corrected name');

    await fireEvent.click(getByTestId('transcript-revert-button'));

    await waitFor(() =>
      expect(updateTranscriptSegment).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          segmentId: 'segment-0',
          updateTranscriptSegmentDto: { correctedText: null },
        }),
      ),
    );
    expect(await findByText('Misheard name')).toBeInTheDocument();
    expect(queryByTestId('transcript-corrected-badge')).toBeNull();
  });

  it('matches a corrected line by its corrected text when filtering', async () => {
    vi.mocked(getAssetTranscript).mockResolvedValue(
      transcript(TranscriptionStatus.Complete, [segment(0, 'Misheard name', 'Corrected name')]),
    );

    const { findByText, getByPlaceholderText, queryByText } = renderPanel();
    await findByText('Corrected name');

    await fireEvent.input(getByPlaceholderText('filter_transcript'), { target: { value: 'corrected' } });

    await waitFor(() => expect(queryByText('Corrected name')).toBeInTheDocument());
  });
});

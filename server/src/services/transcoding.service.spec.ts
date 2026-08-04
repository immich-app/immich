import {
  HLS_BACKPRESSURE_PAUSE_SEGMENTS,
  HLS_BACKPRESSURE_RESUME_SEGMENTS,
  HLS_CLEANUP_INTERVAL_MS,
  HLS_INACTIVITY_TIMEOUT_MS,
  HLS_LEASE_DURATION_MS,
} from 'src/constants';
import { TranscodingService } from 'src/services/transcoding.service';
import { VIDEO_STREAM_SESSION_PK_CONSTRAINT } from 'src/utils/database';
import { eiffelTower, train, waterfall } from 'test/fixtures/media.stub';
import { mockSpawn, newTestService, ServiceMocks } from 'test/utils';
import { vi } from 'vitest';

describe(TranscodingService.name, () => {
  let sut: TranscodingService;
  let mocks: ServiceMocks;

  const sessionId = 'session-1';
  const assetId = 'asset-1';
  const ownerId = 'user-1';

  const completeSegment = (index: number) => {
    const listener = vi.mocked(mocks.storage.watchDir).mock.lastCall?.[1];
    expect(listener).toBeDefined();
    listener!('rename', `seg_${index}.m4s`);
  };

  const completeSegmentsThrough = (start: number, end: number) => {
    for (let i = start; i <= end; i++) {
      completeSegment(i);
    }
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(TranscodingService));
    mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { realtime: { enabled: true } } });
    mocks.videoStream.getForTranscoding.mockResolvedValue(eiffelTower);
  });

  describe('onSessionRequest', () => {
    it('creates the session row and emits HlsSessionResult on success', async () => {
      await sut.onSessionRequest({ sessionId, assetId, ownerId });

      expect(mocks.videoStream.createSession).toHaveBeenCalledWith({
        id: sessionId,
        assetId,
        expiresAt: expect.any(Date),
      });
      expect(mocks.websocket.serverSend).toHaveBeenCalledWith('HlsSessionResult', { sessionId });
    });

    it('treats a primary-key conflict as a no-op for replay tolerance', async () => {
      mocks.videoStream.createSession.mockRejectedValue({ constraint_name: VIDEO_STREAM_SESSION_PK_CONSTRAINT });

      await sut.onSessionRequest({ sessionId, assetId, ownerId });

      expect(mocks.websocket.serverSend).not.toHaveBeenCalled();
    });

    it('emits HlsSessionResult with an error on other DB failures', async () => {
      mocks.videoStream.createSession.mockRejectedValue(new Error('database is down'));

      await sut.onSessionRequest({ sessionId, assetId, ownerId });

      expect(mocks.websocket.serverSend).toHaveBeenCalledWith('HlsSessionResult', {
        sessionId,
        error: 'Failed to create HLS session',
      });
    });
  });

  describe('onSessionEnd', () => {
    it('removes the session, kills the transcode, and deletes the dir + DB row', async () => {
      await sut.onSessionRequest({ sessionId, assetId, ownerId });
      const process = mockSpawn(0, '', '');
      mocks.process.spawn.mockReturnValue(process);
      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 0 });

      await sut.onSessionEnd({ sessionId });

      expect(process.kill).toHaveBeenCalled();
      expect(mocks.storage.unlinkDir).toHaveBeenCalled();
      expect(mocks.videoStream.deleteSession).toHaveBeenCalledWith(sessionId);
    });

    it('is a no-op when the session is unknown', async () => {
      await sut.onSessionEnd({ sessionId: 'never-created' });

      expect(mocks.videoStream.deleteSession).not.toHaveBeenCalled();
      expect(mocks.storage.unlinkDir).not.toHaveBeenCalled();
    });
  });

  describe('onHeartbeat', () => {
    it('extends the DB lease when remaining time falls below half', async () => {
      vi.useFakeTimers();
      try {
        await sut.onSessionRequest({ sessionId, assetId, ownerId });
        vi.setSystemTime(Date.now() + HLS_LEASE_DURATION_MS / 2 + 1);

        await sut.onHeartbeat({ sessionId });

        expect(mocks.videoStream.extendSession).toHaveBeenCalledWith(sessionId, expect.any(Date));
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not extend the lease while it is still fresh', async () => {
      await sut.onSessionRequest({ sessionId, assetId, ownerId });

      await sut.onHeartbeat({ sessionId });

      expect(mocks.videoStream.extendSession).not.toHaveBeenCalled();
    });

    it('is a no-op when the session is unknown', async () => {
      await sut.onHeartbeat({ sessionId: 'never-created' });

      expect(mocks.videoStream.extendSession).not.toHaveBeenCalled();
    });
  });

  describe('onSegmentRequest', () => {
    beforeEach(async () => {
      await sut.onSessionRequest({ sessionId, assetId, ownerId });
      mocks.websocket.serverSend.mockClear();
    });

    it('spawns FFmpeg on the first request', async () => {
      mocks.process.spawn.mockReturnValue(mockSpawn(0, '', ''));

      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 0 });

      expect(mocks.process.spawn).toHaveBeenCalledTimes(1);
      expect(mocks.process.spawn).toHaveBeenCalledWith('ffmpeg', expect.any(Array), expect.any(Object));
    });

    it('kills and respawns when the variant changes', async () => {
      const first = mockSpawn(0, '', '');
      const second = mockSpawn(0, '', '');
      mocks.process.spawn.mockReturnValueOnce(first).mockReturnValueOnce(second);

      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 0 });
      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 1, segmentIndex: 0 });

      expect(first.kill).toHaveBeenCalled();
      expect(mocks.process.spawn).toHaveBeenCalledTimes(2);
    });

    it('kills and respawns when seeking before the start segment', async () => {
      const first = mockSpawn(0, '', '');
      const second = mockSpawn(0, '', '');
      mocks.process.spawn.mockReturnValueOnce(first).mockReturnValueOnce(second);

      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 5 });
      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 2 });

      expect(first.kill).toHaveBeenCalled();
      expect(mocks.process.spawn).toHaveBeenCalledTimes(2);
    });

    it('kills and respawns when the requested segment is too far ahead', async () => {
      const first = mockSpawn(0, '', '');
      const second = mockSpawn(0, '', '');
      mocks.process.spawn.mockReturnValueOnce(first).mockReturnValueOnce(second);

      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 0 });
      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 5 });

      expect(first.kill).toHaveBeenCalled();
      expect(mocks.process.spawn).toHaveBeenCalledTimes(2);
    });

    it('does not spawn when the session is unknown', async () => {
      await sut.onSegmentRequest({ sessionId: 'never-created', assetId, variantIndex: 0, segmentIndex: 0 });

      expect(mocks.process.spawn).not.toHaveBeenCalled();
    });

    it('accepts segments from a restart after the previous ffmpeg exited on its own', async () => {
      const first = mockSpawn(0, '', '');
      const second = mockSpawn(0, '', '');
      mocks.process.spawn.mockReturnValueOnce(first).mockReturnValueOnce(second);

      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 10 });
      completeSegment(10);

      const onCalls = vi.mocked(first.on).mock.calls as unknown as [string, (code: number) => void][];
      const exitHandler = onCalls.find(([event]) => event === 'exit')?.[1];
      exitHandler?.(0);

      mocks.websocket.serverSend.mockClear();
      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 2 });
      completeSegment(2);

      expect(mocks.websocket.serverSend).toHaveBeenCalledWith('HlsSegmentResult', {
        sessionId,
        variantIndex: 0,
        segmentIndex: 2,
      });
    });
  });

  describe('backpressure', () => {
    let proc: ReturnType<typeof mockSpawn>;

    beforeEach(async () => {
      proc = mockSpawn(0, '', '');
      mocks.process.spawn.mockReturnValue(proc);

      await sut.onSessionRequest({ sessionId, assetId, ownerId });
      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 0 });
    });

    it('pauses the transcode once the lead exceeds HLS_BACKPRESSURE_PAUSE_SEGMENTS', async () => {
      completeSegmentsThrough(0, HLS_BACKPRESSURE_PAUSE_SEGMENTS + 1);

      await sut.onHeartbeat({ sessionId, segmentIndex: 0 });

      expect(proc.kill).toHaveBeenCalledWith('SIGSTOP');
    });

    it('does not pause when the lead equals the pause threshold', async () => {
      completeSegmentsThrough(0, HLS_BACKPRESSURE_PAUSE_SEGMENTS);

      await sut.onHeartbeat({ sessionId, segmentIndex: 0 });

      expect(proc.kill).not.toHaveBeenCalled();
    });

    it('resumes once the lead drops below HLS_BACKPRESSURE_RESUME_SEGMENTS', async () => {
      completeSegmentsThrough(0, HLS_BACKPRESSURE_PAUSE_SEGMENTS + 1);
      await sut.onHeartbeat({ sessionId, segmentIndex: 0 });
      expect(proc.kill).toHaveBeenCalledWith('SIGSTOP');
      vi.mocked(proc.kill).mockClear();

      const requested = HLS_BACKPRESSURE_PAUSE_SEGMENTS + 1 - (HLS_BACKPRESSURE_RESUME_SEGMENTS - 1);
      await sut.onHeartbeat({ sessionId, segmentIndex: requested });

      expect(proc.kill).toHaveBeenCalledWith('SIGCONT');
    });

    it('stays paused while the lead is in the dead-band', async () => {
      completeSegmentsThrough(0, HLS_BACKPRESSURE_PAUSE_SEGMENTS + 1);
      await sut.onHeartbeat({ sessionId, segmentIndex: 0 });
      vi.mocked(proc.kill).mockClear();

      const requested = HLS_BACKPRESSURE_PAUSE_SEGMENTS + 1 - HLS_BACKPRESSURE_RESUME_SEGMENTS;
      await sut.onHeartbeat({ sessionId, segmentIndex: requested });

      expect(proc.kill).not.toHaveBeenCalled();
    });

    it('is a no-op when no segment has completed yet', async () => {
      await sut.onHeartbeat({ sessionId, segmentIndex: 0 });

      expect(proc.kill).not.toHaveBeenCalled();
    });

    it('is a no-op when the heartbeat omits segmentIndex', async () => {
      completeSegmentsThrough(0, HLS_BACKPRESSURE_PAUSE_SEGMENTS + 1);

      await sut.onHeartbeat({ sessionId });

      expect(proc.kill).not.toHaveBeenCalled();
    });

    it('resumes the paused transcode when the client requests the next in-range segment', async () => {
      completeSegmentsThrough(0, HLS_BACKPRESSURE_PAUSE_SEGMENTS + 1);
      await sut.onHeartbeat({ sessionId, segmentIndex: 0 });
      expect(proc.kill).toHaveBeenCalledWith('SIGSTOP');
      vi.mocked(proc.kill).mockClear();

      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex: 1 });

      expect(proc.kill).toHaveBeenCalledWith('SIGCONT');
      expect(mocks.process.spawn).toHaveBeenCalledTimes(1);
    });

    it('does not re-pause a freshly spawned transcode after a seek-driven restart', async () => {
      const newProc = mockSpawn(0, '', '');
      mocks.process.spawn.mockReturnValueOnce(newProc);

      completeSegmentsThrough(0, HLS_BACKPRESSURE_PAUSE_SEGMENTS + 1);
      await sut.onHeartbeat({ sessionId, segmentIndex: 0 });
      expect(proc.kill).toHaveBeenCalledWith('SIGSTOP');

      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 1, segmentIndex: 0 });
      vi.mocked(newProc.kill).mockClear();

      await sut.onHeartbeat({ sessionId, segmentIndex: 0 });

      expect(newProc.kill).not.toHaveBeenCalled();
    });

    it('ignores stale segment events from the prior transcode after a backward seek', async () => {
      const newProc = mockSpawn(0, '', '');
      mocks.process.spawn.mockReturnValueOnce(newProc);

      const completedAhead = HLS_BACKPRESSURE_PAUSE_SEGMENTS + 5;
      completeSegmentsThrough(1, completedAhead); // seg_0 was emitted in beforeEach

      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 1, segmentIndex: 0 });

      vi.mocked(newProc.kill).mockClear();
      mocks.websocket.serverSend.mockClear();
      completeSegment(completedAhead + 1);

      expect(mocks.websocket.serverSend).not.toHaveBeenCalledWith(
        'HlsSegmentResult',
        expect.objectContaining({ segmentIndex: completedAhead + 1 }),
      );
      expect(newProc.kill).not.toHaveBeenCalled();

      completeSegment(0);
      expect(mocks.websocket.serverSend).toHaveBeenCalledWith(
        'HlsSegmentResult',
        expect.objectContaining({ segmentIndex: 0 }),
      );
    });
  });

  describe('inactivity sweeper', () => {
    it('reaps a session whose last activity exceeds the inactivity timeout', async () => {
      vi.useFakeTimers();
      try {
        await sut.onSessionRequest({ sessionId, assetId, ownerId });
        mocks.websocket.serverSend.mockClear();
        await vi.advanceTimersByTimeAsync(HLS_INACTIVITY_TIMEOUT_MS + HLS_CLEANUP_INTERVAL_MS);

        expect(mocks.websocket.serverSend).toHaveBeenCalledWith('HlsSessionEnd', { sessionId });
        expect(mocks.videoStream.deleteSession).toHaveBeenCalledWith(sessionId);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('onShutdown', () => {
    it('ends every active session', async () => {
      await sut.onSessionRequest({ sessionId: 'session-a', assetId, ownerId });
      await sut.onSessionRequest({ sessionId: 'session-b', assetId, ownerId });

      await sut.onShutdown();

      expect(mocks.videoStream.deleteSession).toHaveBeenCalledWith('session-a');
      expect(mocks.videoStream.deleteSession).toHaveBeenCalledWith('session-b');
    });
  });

  describe('onHlsSessionCleanup', () => {
    it('reaps DB-expired sessions under a database lock', async () => {
      mocks.database.withLock.mockImplementation(async (_, fn) => fn());
      mocks.videoStream.getExpiredSessions.mockResolvedValue([
        { id: 'expired-1', ownerId: 'user-a' },
        { id: 'expired-2', ownerId: 'user-b' },
      ]);

      await sut.onHlsSessionCleanup();

      expect(mocks.videoStream.deleteSession).toHaveBeenCalledWith('expired-1');
      expect(mocks.videoStream.deleteSession).toHaveBeenCalledWith('expired-2');
      expect(mocks.storage.unlinkDir).toHaveBeenCalledTimes(2);
    });
  });

  describe('FFmpeg full command', () => {
    const baseCommand = [
      '-nostdin',
      '-nostats',
      '-i',
      'eiffel-tower.mp4',
      '-map',
      '0:0',
      '-map_metadata',
      '-1',
      '-map',
      '0:1',
      '-g',
      '50',
      '-keyint_min',
      '50',
      '-ac',
      '2',
      '-copyts',
      '-r',
      '50130000/2012441',
      '-avoid_negative_ts',
      'disabled',
      '-f',
      'hls',
      '-hls_time',
      '2',
      '-hls_list_size',
      '0',
      '-hls_segment_type',
      'fmp4',
      '-hls_fmp4_init_filename',
      'init.mp4',
      '-hls_segment_options',
      'movflags=+frag_discont',
      '-hls_flags',
      'temp_file',
      '-start_number',
      '0',
    ];

    it.each([
      {
        variantIndex: 6,
        expected: [
          ...baseCommand,
          '-c:v',
          'libsvtav1',
          '-c:a',
          'aac',
          '-preset',
          '12',
          '-crf',
          '35',
          '-svtav1-params',
          'hierarchical-levels=3:lookahead=0:enable-tf=0:mbr=4000k',
          '-hls_segment_filename',
          '/data/encoded-video/user-1/se/ss/session-1/6/seg_%d.m4s',
          '/data/encoded-video/user-1/se/ss/session-1/6/playlist.m3u8',
        ].sort(),
      },
      {
        variantIndex: 4,
        expected: [
          ...baseCommand,
          '-c:v',
          'hevc',
          '-c:a',
          'aac',
          '-tag:v',
          'hvc1',
          '-preset',
          'ultrafast',
          '-crf',
          '28',
          '-maxrate',
          '2500k',
          '-bufsize',
          '5000k',
          '-x265-params',
          'no-scenecut=1:no-open-gop=1',
          '-vf',
          'scale=720:-2',
          '-hls_segment_filename',
          '/data/encoded-video/user-1/se/ss/session-1/4/seg_%d.m4s',
          '/data/encoded-video/user-1/se/ss/session-1/4/playlist.m3u8',
        ].sort(),
      },
      {
        variantIndex: 2,
        expected: [
          ...baseCommand,
          '-c:v',
          'h264',
          '-c:a',
          'aac',
          '-preset',
          'ultrafast',
          '-crf',
          '23',
          '-maxrate',
          '2500k',
          '-bufsize',
          '5000k',
          '-sc_threshold:v',
          '0',
          '-vf',
          'scale=480:-2',
          '-hls_segment_filename',
          '/data/encoded-video/user-1/se/ss/session-1/2/seg_%d.m4s',
          '/data/encoded-video/user-1/se/ss/session-1/2/playlist.m3u8',
        ].sort(),
      },
    ])('builds the expected FFmpeg command for $codec (variant $variantIndex)', async ({ variantIndex, expected }) => {
      mocks.process.spawn.mockReturnValue(mockSpawn(0, '', ''));

      await sut.onSessionRequest({ sessionId, assetId, ownerId });
      await sut.onSegmentRequest({ sessionId, assetId, variantIndex, segmentIndex: 0 });

      expect(mocks.process.spawn.mock.calls[0][1].toSorted()).toEqual(expected);
    });
  });

  describe('FFmpeg seek per segment', () => {
    const eiffelSeeks = [
      0, 1.98715, 3.994372222222222, 6.001594444444444, 8.008816666666666, 10.016038888888888, 12.023261111111111,
      14.030483333333333, 16.037705555555554, 18.044927777777776, 20.052149999999997, 22.059372222222223,
    ];
    const waterfallSeeks = [
      0, 1.994642826321467, 4.006047357065803, 6.0174518878101395, 8.028856418554476, 10.040260949298812,
    ];
    const trainSeeks = [
      0, 1.9916666666666667, 3.9916666666666667, 5.991666666666666, 7.991666666666666, 9.991666666666667,
      11.991666666666667, 13.991666666666667, 15.991666666666667, 17.991666666666667, 19.991666666666667,
    ];
    const cases = [
      ...eiffelSeeks.map((expected, segmentIndex) => ({
        name: `${eiffelTower.originalPath} K=${segmentIndex}`,
        fixture: eiffelTower,
        segmentIndex,
        expected,
      })),
      ...waterfallSeeks.map((expected, segmentIndex) => ({
        name: `${waterfall.originalPath} K=${segmentIndex}`,
        fixture: waterfall,
        segmentIndex,
        expected,
      })),
      ...trainSeeks.map((expected, segmentIndex) => ({
        name: `${train.originalPath} K=${segmentIndex}`,
        fixture: train,
        segmentIndex,
        expected,
      })),
    ];

    it.each(cases)('$name', async ({ fixture, segmentIndex, expected }) => {
      mocks.videoStream.getForTranscoding.mockResolvedValue(fixture);
      mocks.process.spawn.mockReturnValue(mockSpawn(0, '', ''));

      await sut.onSessionRequest({ sessionId, assetId, ownerId });
      await sut.onSegmentRequest({ sessionId, assetId, variantIndex: 0, segmentIndex });

      const args = mocks.process.spawn.mock.calls[0][1] as string[];
      if (expected === 0) {
        expect(args).toEqual(expect.arrayContaining(['-copyts', '-avoid_negative_ts', 'disabled']));
        expect(args).not.toContain('-ss');
      } else {
        expect(args).toEqual(
          expect.arrayContaining(['-ss', String(expected), '-copyts', '-avoid_negative_ts', 'disabled']),
        );
      }
    });
  });
});

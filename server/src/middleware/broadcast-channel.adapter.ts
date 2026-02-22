import {
  ClusterAdapterWithHeartbeat,
  type ClusterAdapterOptions,
  type ClusterMessage,
  type ClusterResponse,
  type ServerId,
} from 'socket.io-adapter';

const BC_CHANNEL_NAME = 'immich:socketio';

interface BroadcastChannelPayload {
  type: 'message' | 'response';
  sourceUid: string;
  targetUid?: string;
  data: unknown;
}

/**
 * Socket.IO adapter using Node.js BroadcastChannel
 *
 * Relays messages between worker_threads within a single OS process.
 * Zero external dependencies. Does NOT work across containers — use
 * the Postgres adapter for multi-replica deployments.
 */
class BroadcastChannelAdapter extends ClusterAdapterWithHeartbeat {
  private readonly channel: BroadcastChannel;

  constructor(nsp: any, opts?: Partial<ClusterAdapterOptions>) {
    super(nsp, opts ?? {});

    this.channel = new BroadcastChannel(BC_CHANNEL_NAME);
    this.channel.addEventListener('message', (event: MessageEvent<BroadcastChannelPayload>) => {
      const msg = event.data;
      if (msg.sourceUid === this.uid) {
        return;
      }
      if (msg.type === 'message') {
        this.onMessage(msg.data as ClusterMessage);
      } else if (msg.type === 'response' && msg.targetUid === this.uid) {
        this.onResponse(msg.data as ClusterResponse);
      }
    });

    this.init();
  }

  override doPublish(message: ClusterMessage): Promise<string> {
    this.channel.postMessage({
      type: 'message',
      sourceUid: this.uid,
      data: message,
    });
    return Promise.resolve('');
  }

  override doPublishResponse(requesterUid: ServerId, response: ClusterResponse): Promise<void> {
    this.channel.postMessage({
      type: 'response',
      sourceUid: this.uid,
      targetUid: requesterUid,
      data: response,
    });
    return Promise.resolve();
  }

  override close(): void {
    super.close();
    this.channel.close();
  }
}

export function createBroadcastChannelAdapter(opts?: Partial<ClusterAdapterOptions>) {
  const options: Partial<ClusterAdapterOptions> = {
    ...opts,
  };

  return function (nsp: any) {
    return new BroadcastChannelAdapter(nsp, options);
  };
}

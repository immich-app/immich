import type {
  DefaultEventsMap,
  EventsMap,
  ReservedOrUserEventNames,
  ReservedOrUserListener,
} from '@socket.io/component-emitter';
import type { Socket } from 'socket.io-client';

export function createEventEmitter<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = ListenEvents,
  ReservedEvents extends EventsMap = NonNullable<unknown>,
>(socket: Socket<ListenEvents, EmitEvents>) {
  function on<Ev extends ReservedOrUserEventNames<ReservedEvents, ListenEvents>>(
    ev: Ev,
    listener: ReservedOrUserListener<ReservedEvents, ListenEvents, Ev>,
  ) {
    socket.on(ev, listener);
    return () => {
      socket.off(ev, listener);
    };
  }

  function once<Ev extends ReservedOrUserEventNames<ReservedEvents, ListenEvents>>(
    ev: Ev,
    listener: ReservedOrUserListener<ReservedEvents, ListenEvents, Ev>,
  ) {
    socket.once(ev, listener);
    return () => {
      socket.off(ev, listener);
    };
  }

  function off<Ev extends ReservedOrUserEventNames<ReservedEvents, ListenEvents>>(
    ev: Ev,
    listener: ReservedOrUserListener<ReservedEvents, ListenEvents, Ev>,
  ) {
    socket.off(ev, listener);
  }

  return { on, once, off };
}

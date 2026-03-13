import { websocketMock } from './websocket.mock';

describe('websocket mock', () => {
  it('should export mocked websocket store', () => {
    expect(websocketMock.websocketStore).toBeDefined();
    expect(websocketMock.websocketStore.connected).toBeDefined();
  });

  it('should export mocked functions', () => {
    expect(websocketMock.openWebsocketConnection).toBeDefined();
    expect(websocketMock.closeWebsocketConnection).toBeDefined();
    expect(websocketMock.waitForWebsocketEvent).toBeDefined();
  });

  it('should allow configuring waitForWebsocketEvent', async () => {
    websocketMock.waitForWebsocketEvent.mockResolvedValue(undefined as never);
    const result = await websocketMock.waitForWebsocketEvent('on_asset_update');
    expect(result).toBeUndefined();
  });
});

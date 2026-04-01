import { describe, expect, it } from 'vitest';
import { useDuckStore } from './duck.store';

describe('duck store', () => {
  it('tracks open state and unread counter', () => {
    const state = useDuckStore.getState();
    state.resetConversation();
    state.close();

    useDuckStore.getState().pushAssistantMessage('test message');
    expect(useDuckStore.getState().unreadCount).toBe(1);

    useDuckStore.getState().open();
    expect(useDuckStore.getState().isOpen).toBe(true);
    expect(useDuckStore.getState().unreadCount).toBe(0);

    useDuckStore.getState().pushUserMessage('hello');
    expect(useDuckStore.getState().messages.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';
import { APP_TITLE } from '../src/App';

describe('scaffold', () => {
  it('has the app title', () => {
    expect(APP_TITLE).toBe('ORBIT 72 - Bắt Sóng Cứu Hộ');
  });
});

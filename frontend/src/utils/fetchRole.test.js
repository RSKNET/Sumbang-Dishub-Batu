import fetchRole from './fetchRole';

describe('fetchRole utility', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns role on successful fetch', async () => {
    localStorage.setItem('accessToken', 'mock-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, role: 'admin' }),
    });

    const role = await fetchRole();
    expect(role).toBe('admin');
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/users/role`,
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer mock-token',
        },
      })
    );
  });

  test('returns null when fetch fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const role = await fetchRole();
    expect(role).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
const mockCookieStore = {
  getAll: vi.fn(() => []),
  get: vi.fn(() => undefined),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock @supabase/ssr
const mockGetUser = vi.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
  from: vi.fn(),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

// Set required env vars
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

describe('getSupabaseAndUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user: null when not authenticated', async () => {
    // Arrange
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Act
    const { getSupabaseAndUser } = await import('./server');
    const { supabase, user } = await getSupabaseAndUser();

    // Assert
    expect(user).toBeNull();
    expect(supabase).toBe(mockSupabaseClient);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it('should use getUser() for authentication (not getSession)', async () => {
    // Arrange
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Act
    const { getSupabaseAndUser } = await import('./server');
    await getSupabaseAndUser();

    // Assert - verify getUser was called (security requirement)
    expect(mockGetUser).toHaveBeenCalled();
  });

  it('should return user when authenticated', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Act
    const { getSupabaseAndUser } = await import('./server');
    const { supabase, user } = await getSupabaseAndUser();

    // Assert
    expect(user).toEqual(mockUser);
    expect(supabase).toBe(mockSupabaseClient);
  });
});

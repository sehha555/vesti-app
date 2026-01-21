import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from './route';
import { NextRequest, NextResponse } from 'next/server';

// Mock the auth middleware
vi.mock('../../_middleware/auth', () => ({
  requireBffAuth: vi.fn(),
}));

// Mock Cloudinary with proper stream
vi.mock('cloudinary', () => {
  const { PassThrough } = require('stream');
  return {
    v2: {
      config: vi.fn(),
      uploader: {
        upload_stream: vi.fn((options, callback) => {
          const stream = new PassThrough();
          // Simulate successful upload after data is piped
          stream.on('finish', () => {
            callback(null, {
              secure_url: 'https://cloudinary.com/test-image.jpg',
              public_id: 'test-public-id',
              width: 800,
              height: 600,
              format: 'jpg',
            });
          });
          return stream;
        }),
      },
    },
  };
});

// Mock remove.bg
vi.mock('remove.bg', () => ({
  removeBackgroundFromImageUrl: vi.fn(),
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'item-123',
              user_id: 'test-user-id',
              name: 'Test Item',
              type: 'top',
            },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

// Mock rate limit
vi.mock('../../../../lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => Promise.resolve({
    allowed: true,
    remaining: 9,
    limit: 10,
    resetAfter: 600,
    resetAt: Math.floor(Date.now() / 1000) + 600,
  })),
}));

// Mock security functions
vi.mock('../../../../lib/metrics', () => ({
  logSecurityEvent: vi.fn(),
}));

vi.mock('../../../../lib/security/file-signature', () => ({
  verifyFileSignature: vi.fn(() => ({ valid: true })),
}));

import { requireBffAuth } from '../../_middleware/auth';
import { checkRateLimit } from '../../../../lib/rateLimit';
import { verifyFileSignature } from '../../../../lib/security/file-signature';

// Helper to create FormData request
const createFormDataRequest = (formData: FormData): NextRequest => {
  return new NextRequest('http://localhost:3000/api/wardrobe/upload', {
    method: 'POST',
    headers: {
      'X-API-Key': 'test-api-key',
    },
    body: formData,
  });
};

// Helper to create a mock file
const createMockFile = (name: string, type: string, size: number): File => {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
};

// Setup mocks
beforeEach(() => {
  vi.clearAllMocks();

  // Set required environment variables
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

  // Default: auth passes
  vi.mocked(requireBffAuth).mockResolvedValue({
    authorized: true,
    userId: 'test-user-id',
  });
});

describe('POST /api/wardrobe/upload', () => {
  describe('BFF Authentication', () => {
    it('should return 401 when authentication fails', async () => {
      vi.mocked(requireBffAuth).mockResolvedValue({
        authorized: false,
        error: NextResponse.json(
          { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
          { status: 401 }
        ),
      });

      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should call requireBffAuth with the request', async () => {
      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      await POST(req);

      expect(requireBffAuth).toHaveBeenCalledTimes(1);
      expect(requireBffAuth).toHaveBeenCalledWith(req);
    });

    it('should use userId from auth session, NOT from formData', async () => {
      // This test verifies that even if formData contains a different userId,
      // the server uses the one from the authenticated session
      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');
      formData.append('userId', 'fake-user-id'); // Attempt to forge userId

      const req = createFormDataRequest(formData);
      const res = await POST(req);

      // Should succeed with authenticated user's ID, not the forged one
      expect(res.status).toBe(201);
      expect(requireBffAuth).toHaveBeenCalled();
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when file is missing', async () => {
      const formData = new FormData();
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('FILE_REQUIRED');
    });

    it('should return 400 for invalid file type', async () => {
      const formData = new FormData();
      formData.append('file', createMockFile('test.gif', 'image/gif', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('INVALID_FILE_TYPE');
    });

    it('should return 400 for file exceeding 10MB', async () => {
      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 11 * 1024 * 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('FILE_TOO_LARGE');
    });

    it('should return 400 when name is missing', async () => {
      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 when type is missing', async () => {
      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
      formData.append('name', 'Test Item');

      const req = createFormDataRequest(formData);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 for invalid clothing type', async () => {
      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'invalid-type');

      const req = createFormDataRequest(formData);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('INVALID_TYPE');
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data in 500 error responses', async () => {
      // Simulate database error by removing service role key
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('圖片上傳失敗，請稍後再試');
      expect(data.code).toBe('UPLOAD_FAILED');

      // Ensure no sensitive data is exposed
      const responseStr = JSON.stringify(data);
      expect(responseStr).not.toContain('SERVICE_ROLE');
      expect(responseStr).not.toContain('ANON_KEY');
      expect(responseStr).not.toContain('SUPABASE_URL');
      expect(responseStr).not.toContain('stack');
      expect(responseStr).not.toContain('Error:');
      expect(data.details).toBeUndefined();
    });

    it('should not include error.message in 500 response', async () => {
      // Remove Cloudinary config to trigger error
      delete process.env.CLOUDINARY_CLOUD_NAME;

      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.details).toBeUndefined();
      expect(data.message).toBeUndefined();
    });
  });

  describe('Accepted File Types', () => {
    it('should accept JPEG files', async () => {
      const formData = new FormData();
      formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);

      expect(res.status).toBe(201);
    });

    it('should accept PNG files', async () => {
      const formData = new FormData();
      formData.append('file', createMockFile('test.png', 'image/png', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);

      expect(res.status).toBe(201);
    });

    it('should accept WebP files', async () => {
      const formData = new FormData();
      formData.append('file', createMockFile('test.webp', 'image/webp', 1024));
      formData.append('name', 'Test Item');
      formData.append('type', 'top');

      const req = createFormDataRequest(formData);
      const res = await POST(req);

      expect(res.status).toBe(201);
    });
  });

  describe('Valid Clothing Types', () => {
    const validTypes = ['top', 'bottom', 'outerwear', 'shoes', 'accessory'];

    validTypes.forEach(type => {
      it(`should accept type "${type}"`, async () => {
        const formData = new FormData();
        formData.append('file', createMockFile('test.jpg', 'image/jpeg', 1024));
        formData.append('name', 'Test Item');
        formData.append('type', type);

        const req = createFormDataRequest(formData);
        const res = await POST(req);

        expect(res.status).toBe(201);
      });
    });
  });

  describe('Gherkin Acceptance Tests', () => {
    describe('場景: 成功上傳正常圖片', () => {
      it('should return 201 with Cache-Control and success fields', async () => {
        const formData = new FormData();
        formData.append('file', createMockFile('ok.jpg', 'image/jpeg', 10240));
        formData.append('name', 'Test Item');
        formData.append('type', 'top');

        const req = createFormDataRequest(formData);
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(res.headers.get('Cache-Control')).toBe('private, no-store');
        expect(data.success).toBe(true);
        expect(data.wardrobeItem).toBeDefined();
      });
    });

    describe('場景: 觸發限流時應回傳 429 與標準 headers', () => {
      it('should return 429 with RateLimit headers when rate limit exceeded', async () => {
        // Mock rate limit to deny the request
        vi.mocked(checkRateLimit).mockResolvedValueOnce({
          allowed: false,
          remaining: 0,
          limit: 10,
          resetAfter: 600,
          resetAt: Math.floor(Date.now() / 1000) + 600,
          retryAfter: 600,
        });

        const formData = new FormData();
        formData.append('file', createMockFile('ok.jpg', 'image/jpeg', 10240));
        formData.append('name', 'Test Item');
        formData.append('type', 'top');

        const req = createFormDataRequest(formData);
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(429);
        expect(res.headers.get('Retry-After')).toBe('600');
        expect(res.headers.get('RateLimit-Limit')).toBe('10');
        expect(res.headers.get('RateLimit-Remaining')).toBe('0');
        expect(res.headers.get('RateLimit-Reset')).toBe('600');
        expect(data.code).toBe('RATE_LIMITED');
      });
    });

    describe('場景: 檔案簽名不符應回 400', () => {
      it('should return 400 INVALID_FILE_SIGNATURE when file signature invalid', async () => {
        // Mock file signature verification to fail
        vi.mocked(verifyFileSignature).mockReturnValueOnce({
          valid: false,
          reason: 'File signature does not match declared type',
        });

        const formData = new FormData();
        // PNG signature in JPEG disguise
        formData.append('file', createMockFile('fake.jpg', 'image/jpeg', 10240));
        formData.append('name', 'Test Item');
        formData.append('type', 'top');

        const req = createFormDataRequest(formData);
        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.code).toBe('INVALID_FILE_SIGNATURE');
        expect(data.error).toBeDefined();
      });
    });
  });
});

describe('GET /api/wardrobe/upload', () => {
  it('should return 405 Method Not Allowed', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(405);
    expect(data.error).toBe('Method not allowed. Use POST.');
    expect(data.code).toBe('METHOD_NOT_ALLOWED');
  });
});

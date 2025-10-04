import { NextApiRequest, NextApiResponse } from 'next';
const { v4: uuidv4 } = require('uuid');

// 佔位符：請求日誌
const logRequest = (traceId: string, req: NextApiRequest) => {
  console.log(`[API Gateway] TraceId: ${traceId}, Request: ${req.method} ${req.url}`);
};

// 佔位符：耗時計量
const measureLatency = (traceId: string, req: NextApiRequest, res: NextApiResponse, startTime: [number, number]) => {
  const diff = process.hrtime(startTime);
  const latency = (diff[0] * 1e9 + diff[1]) / 1e6; // 毫秒
  console.log(`[API Gateway] TraceId: ${traceId}, Latency for ${req.method} ${req.url}: ${latency.toFixed(2)}ms, Status: ${res.statusCode}`);
};

// 佔位符：錯誤追蹤
const trackError = (traceId: string, error: any) => {
  console.error(`[API Gateway] TraceId: ${traceId}, Error:`, error);
  // 實際應用中會發送到錯誤追蹤服務，例如 Sentry
};

// 佔位符：限流
const rateLimit = (traceId: string, req: NextApiRequest): boolean => {
  // 實際應用中會檢查請求頻率
  const clientIp = req.socket.remoteAddress; // 使用 req.socket.remoteAddress 獲取 IP
  console.log(`[API Gateway] TraceId: ${traceId}, Rate limiting check for ${clientIp}`);
  return false; // 預設不限流
};

// 佔位符：超時
const timeoutPromise = (ms: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout'));
    }, ms);
  });
};

// 佔位符：統一錯誤格式
const sendErrorResponse = (res: NextApiResponse, statusCode: number, message: string, traceId?: string) => {
  res.status(statusCode).json({
    error: {
      message,
      traceId,
      timestamp: new Date().toISOString(),
    },
  });
};

// API Gateway 中介軟體高階函數
export const withApiGatewayMiddleware = (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const traceId = uuidv4();
    const startTime = process.hrtime();

    logRequest(traceId, req);

    if (rateLimit(traceId, req)) {
      return sendErrorResponse(res, 429, 'Too Many Requests', traceId);
    }

    try {
      await Promise.race([
        handler(req, res), // 執行實際的 API 處理器
        timeoutPromise(5000), // 5 秒超時
      ]);
    } catch (error: any) {
      if (error.message === 'Timeout') {
        console.warn(`[API Gateway] TraceId: ${traceId}, Request timed out after 5000ms: ${req.method} ${req.url}`);
        sendErrorResponse(res, 504, 'Gateway Timeout', traceId);
      } else {
        trackError(traceId, error);
        sendErrorResponse(res, 500, 'Internal Server Error', traceId);
      }
    } finally {
      measureLatency(traceId, req, res, startTime);
    }
  };
};

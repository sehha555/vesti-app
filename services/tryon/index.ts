import { NextApiRequest, NextApiResponse } from 'next';
import { CreateTryOnSessionRequestSchema, GetTryOnSessionResponseSchema } from '@/packages/types/src/tryon';

const TRYON_ENABLED = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!TRYON_ENABLED) {
    return res.status(200).json({ status: 'unavailable', message: 'Coming soon' });
  }

  if (req.method === 'POST') {
    const parseResult = CreateTryOnSessionRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }
    // In a real implementation, we would create a session and return its ID.
    res.status(200).json({ sessionId: 'mock-session-id' });
  } else if (req.method === 'GET') {
    const { id } = req.query;
    // In a real implementation, we would check the status of the session.
    res.status(200).json({ status: 'unavailable', message: 'Coming soon' });
  } else {
    res.status(405).end();
  }
}

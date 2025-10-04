import { NextApiRequest, NextApiResponse } from 'next';
import { UserEvent } from '../../../../packages/types/src/reco';
import { preferenceLogger } from '../../modules/preference/logger';
import { withApiGatewayMiddleware } from '../../../api-gateway';

async function eventLoggerHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const eventData = req.body as Omit<UserEvent, 'timestamp' | 'id'>;

    if (!eventData.userId || !eventData.eventType || !eventData.payload) {
      res.status(400).json({ message: 'Request body must include userId, eventType, and payload.' });
      return;
    }

    const eventId = await preferenceLogger.logEvent(eventData);
    res.status(201).json({ message: 'Event logged successfully', eventId });
  } catch (error) {
    console.error('Error in eventLoggerHandler:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

export default withApiGatewayMiddleware(eventLoggerHandler);

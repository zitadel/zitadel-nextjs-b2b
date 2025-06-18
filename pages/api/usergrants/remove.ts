import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { handleFetchErrors } from '../../../lib/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) return res.status(401).end();

  // For DELETE requests, parameters can come from body or query
  const body = req.body;
  const query = req.query;
  
  const userId = body?.userId || query?.userId;
  const grantId = body?.grantId || query?.grantId;
  const orgId = body?.orgId || query?.orgId;
  
  if (!userId || !grantId || !orgId) {
    console.error('Missing parameters:', { userId, grantId, orgId });
    return res.status(400).json({ 
      error: 'Missing userId, grantId, or orgId',
      received: { userId, grantId, orgId }
    });
  }

  const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
  const url = `${process.env.ZITADEL_API}/management/v1/users/${userId}/grants/${grantId}`;

  console.log(
    new Date().toLocaleString(),
    '\n',
    `call to ${url} to remove user grant ${grantId} for user ${userId}`,
    '\n',
    `Using grant-specific org context: ${orgId}`
  );

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        'x-zitadel-orgid': orgId,
        'content-type': 'text/plain',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response (${response.status}):`, errorText);
      return res.status(response.status).json({ error: errorText });
    }
    
    res.status(200).json({ success: true });
  } catch (e) {
    console.error('Error removing user grant:', e);
    console.error('Error details:', e.message);
    res.status(500).json({ error: e.message });
  }
}

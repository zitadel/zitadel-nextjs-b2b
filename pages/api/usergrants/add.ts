import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { handleFetchErrors } from '../../../lib/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) return res.status(401).end();

  const { userId, projectId, projectGrantId, roles, orgId } = req.body;
  
  if (!userId || !projectId || !projectGrantId || !roles) {
    return res.status(400).json({ error: 'Missing userId, projectId, projectGrantId, or roles' });
  }

  const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
  // Use provided orgId or fall back to environment default
  const targetOrgId = orgId || process.env.ORG_ID;
  const url = `${process.env.ZITADEL_API}/management/v1/users/${userId}/grants`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-zitadel-orgid': targetOrgId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        projectGrantId,
        roleKeys: roles,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

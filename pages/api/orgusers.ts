import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { handleFetchErrors } from '../../lib/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) return res.status(401).end();

  const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
  const orgId = req.query.orgId as string || process.env.ORG_ID;
  const url = `${process.env.ZITADEL_API}/v2/users`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          offset: "0",
          limit: 100,
          asc: true
        },
        sortingColumn: "USER_FIELD_NAME_USER_NAME",
        queries: [
          {
            organizationIdQuery: {
              organizationId: orgId
            }
          }
        ]
      }),
    });
    
    await handleFetchErrors(response);
    const data = await response.json();
    
    res.status(200).json(data.result ?? []);
  } catch (e) {
    console.error('Error fetching org users:', e);
    res.status(500).json({ error: e.message });
  }
}

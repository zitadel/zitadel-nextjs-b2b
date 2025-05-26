import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { handleFetchErrors } from '../../lib/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) return res.status(401).end();

  const { projectId, orgId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'Missing projectId' });

  const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
  const targetOrgId = (Array.isArray(orgId) ? orgId[0] : orgId) || process.env.ORG_ID;
  const url = `${process.env.ZITADEL_API}/management/v1/projects/${projectId}/roles/_search`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-zitadel-org': targetOrgId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          limit: 100,
          asc: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching project roles (${response.status}):`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const roles = data.result?.map((role: any) => role.key) || [];
    
    console.log(`Project ${projectId} available roles:`, roles);
    res.status(200).json(roles);
  } catch (e) {
    console.error('Error fetching project roles:', e);
    res.status(500).json({ error: e.message });
  }
}

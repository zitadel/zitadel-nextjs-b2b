import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { handleFetchErrors } from '../../../lib/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) return res.status(401).end();

  const { userId, grantId, roles, orgId } = req.body;
  if (!userId || !grantId || !roles || !orgId) return res.status(400).json({ error: 'Missing userId, grantId, roles, or orgId' });

  const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
  const url = `${process.env.ZITADEL_API}/management/v1/users/${userId}/grants/${grantId}`;

  console.log(
    new Date().toLocaleString(),
    '\n',
    `call to ${url} to update user grant ${grantId} for user ${userId} with roles:`,
    roles,
    '\n',
    `Using org context: ${orgId}`
  );

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'x-zitadel-orgid': orgId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        roleKeys: roles,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response (${response.status}):`, errorText);
      return res.status(response.status).json({ error: errorText });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    console.error('Error updating user grant:', e);
    console.error('Error details:', e.message);
    res.status(500).json({ error: e.message });
  }
}

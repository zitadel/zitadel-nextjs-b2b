import { NextApiRequest, NextApiResponse } from 'next';
import { handleFetchErrors } from '../../lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

async function getUserGrants(accessToken: string, orgId?: string, limit?: number, offset?: number): Promise<any> {
  const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
  const targetOrgId = orgId || process.env.ORG_ID;
  const request = `${process.env.ZITADEL_API}/management/v1/users/grants/_search`;

  const queries: any[] = [
    {
      withGrantedQuery: {
        withGranted: true,
      },
    },
  ];

  try {
    const response = await fetch(request, {
      headers: {
        authorization: `Bearer ${token}`,
        'x-zitadel-org': targetOrgId,
        'content-type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        query: {
          limit: limit || 1000, // Increase limit to get more results
          offset: offset || 0,
          asc: true,
        },
        queries: queries,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ZITADEL API error (${response.status}):`, errorText);
      throw new Error(`ZITADEL API error: ${response.status} ${errorText}`);
    }

    const resp = await response.json();
    return {
      result: resp.result ?? [],
      totalResult: resp.details?.totalResult || 0
    };
  } catch (error) {
    console.error('Error in getUserGrants:', error);
    // Always return the expected format even on error
    return {
      result: [],
      totalResult: 0,
      error: error.message
    };
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) {
    return res.status(401).end();
  }

  if (req.method === 'GET') {
    const { orgId, limit, offset } = req.query;
    const targetOrgId = Array.isArray(orgId) ? orgId[0] : orgId;
    const limitNum = limit ? parseInt(Array.isArray(limit) ? limit[0] : limit, 10) : undefined;
    const offsetNum = offset ? parseInt(Array.isArray(offset) ? offset[0] : offset, 10) : undefined;
    
    try {
      const resp = await getUserGrants(session.accessToken, targetOrgId, limitNum, offsetNum);
      return res.status(200).json(resp);
    } catch (error) {
      console.error('Error fetching user grants:', error);
      // Return a proper error response with the expected format
      return res.status(500).json({
        result: [],
        totalResult: 0,
        error: error.message || 'Failed to fetch user grants'
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};

export default handler;

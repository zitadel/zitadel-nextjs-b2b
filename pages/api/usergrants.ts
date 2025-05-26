import { NextApiRequest, NextApiResponse } from 'next';
import { handleFetchErrors } from '../../lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

async function getUserGrants(accessToken: string, orgId?: string): Promise<any> {
  const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
  const targetOrgId = orgId || process.env.ORG_ID;
  const request = `${process.env.ZITADEL_API}/management/v1/users/grants/_search`;

  return fetch(request, {
    headers: {
      authorization: `Bearer ${token}`,
      'x-zitadel-org': targetOrgId,
      'content-type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      query: {
        limit: 100,
        asc: true,
      },
      queries: [
        {
          withGrantedQuery: {
            withGranted: true,
          },
        },
      ],
    }),
  })
    .then(handleFetchErrors)
    .then((resp) => resp.json())
    .then((resp) => {
      return resp.result ?? [];
    });
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) {
    return res.status(401).end();
  }

  if (req.method === 'GET') {
    const { orgId } = req.query;
    const targetOrgId = Array.isArray(orgId) ? orgId[0] : orgId;
    return getUserGrants(session.accessToken, targetOrgId)
      .then((resp) => {
        res.status(200).json(resp);
      })
      .catch((error) => {
        res.status(500).json(error);
      });
  }
};

export default handler;

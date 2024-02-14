import { NextApiRequest, NextApiResponse } from 'next';

import { handleFetchErrors } from '../../lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

async function getOrgs(accessToken: string): Promise<any> {
  const request = `${process.env.ZITADEL_API}/auth/v1/global/projectorgs/_search`;

  console.log(
    new Date().toLocaleString(),
    '\n',
    `call to ${process.env.ZITADEL_API}/auth/v1/global/projectorgs/_search to load orgs.`,
  );

  return fetch(request, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    method: 'POST',
  })
    .then(handleFetchErrors)
    .then((resp) => {
      return resp.json();
    })
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
    return getOrgs(session.accessToken)
      .then((resp) => {
        res.status(200).json(resp);
      })
      .catch((error) => {
        console.error('got an error', error);
        res.status(500).json(error);
      });
  }
};

export default handler;

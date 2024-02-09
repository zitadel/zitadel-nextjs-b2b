import { NextApiRequest, NextApiResponse } from 'next';

import { handleFetchErrors } from '../../lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

export async function getUserInfo(accessToken: string): Promise<any> {
  const request = `${process.env.ZITADEL_API}/oidc/v1/userinfo`;
  console.log(new Date().toLocaleString(), '\n', `call to ${process.env.ZITADEL_API}/oidc/v1/userinfo to load roles.`);

  return fetch(request, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    method: 'GET',
  })
    .then(handleFetchErrors)
    .then((resp) => {
      return resp.json();
    });
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) {
    return res.status(401).end();
  }

  if (req.method === 'GET') {
    return getUserInfo(session.accessToken)
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

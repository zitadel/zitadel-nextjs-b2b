import { NextApiRequest, NextApiResponse } from 'next';

import { handleFetchErrors } from '../../lib/middleware';
import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';

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
  const token = await getToken({ req });
  if (!token?.accessToken) {
    return res.status(401).end();
  }

  if (req.method === 'GET') {
    return getUserInfo(token.accessToken)
      .then((resp) => {
        console.log(resp);
        res.status(200).json(resp);
      })
      .catch((error) => {
        console.error('got an error', error);
        res.status(500).json(error);
      });
  }
};

export default handler;

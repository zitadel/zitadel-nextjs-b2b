import type { NextApiRequest, NextApiResponse } from 'next';
import { handleFetchErrors } from '../../lib/middleware';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

const getSessions = async (req: NextApiRequest, res: NextApiResponse, accessToken: string) => {
  const request = `${process.env.ZITADEL_API}/auth/v1/users/me/sessions/_search`;
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
    .then((userSessions) => {
      return res.status(200).send(userSessions.result);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await getServerSession(req, res, authOptions);
  if (!token?.accessToken) {
    return res.status(401).end();
  }

  switch (req.method) {
    case 'GET':
      return getSessions(req, res, token.accessToken);
    default:
      return res.status(405).end();
  }
};

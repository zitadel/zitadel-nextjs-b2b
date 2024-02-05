import { NextApiRequest, NextApiResponse } from 'next';

import { hasRole } from '../../lib/hasRole';
import { handleFetchErrors } from '../../lib/middleware';

function getUserGrants(
  orgId: string,
  authorizationHeader: string
): Promise<any> {
  return hasRole("admin", orgId, authorizationHeader)
    .then((isAllowed) => {
      if (isAllowed) {
        const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
        const request = `${process.env.ZITADEL_API}/management/v1/users/grants/_search`;

        const logHeaders = JSON.stringify({
          "x-zitadel-org": process.env.ORG_ID,
          "content-type": "application/json",
        });

        const logBody = JSON.stringify({
          query: {
            limit: 100,
            asc: true,
          },
          queries: [
            {
              projectIdQuery: {
                projectId: process.env.PROJECT_ID,
              },
            },
            {
              withGrantedQuery: {
                withGranted: true,
              },
            },
          ],
        });

        console.log(
          new Date().toLocaleString(),
          "\n",
          `call to ${process.env.ZITADEL_API}/management/v1/users/grants/_search to load ZITADEL user grants.`,
          "\n",
          `header: ${logHeaders}, body: ${logBody}`
        );

        return fetch(request, {
          headers: {
            authorization: `Bearer ${token}`,
            "x-zitadel-org": process.env.ORG_ID,
            "content-type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            query: {
              limit: 100,
              asc: true,
            },
            queries: [
              {
                projectIdQuery: {
                  projectId: process.env.PROJECT_ID,
                },
              },
              {
                withGrantedQuery: {
                  withGranted: true,
                },
              },
            ],
          }),
        })
          .then(handleFetchErrors)
          .then((resp) => {
            return resp.json();
          })
          .then((resp) => {
            const grants = resp.result
              ? resp.result.filter((grant) => grant.orgId === orgId)
              : [];
            const newResp = {
              ...resp,
              result: grants,
            };
            return newResp;
          });
      } else {
        throw new Error("not allowed");
      }
    })

    .catch((error) => {
      throw new Error("not allowed");
    });
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    const orgId = req.headers.orgid as string;
    const authorizationHeader = req.headers.authorization as string;

    return getUserGrants(orgId, authorizationHeader)
      .then((resp) => {
        res.status(200).json(resp);
      })
      .catch((error) => {
        console.error("got an error", error);
        res.status(500).json(error);
      });
  }
};

export default handler;

import { NextApiRequest, NextApiResponse } from 'next';

export function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: any
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export const handleFetchErrors = (response: any) => {
  if (!response.ok) {
    console.error("handleFetchErrors: not ok");
    console.error(response);
    throw new Error(response?.statusText ?? "Unknown Error");
  } else {
    return response;
  }
};

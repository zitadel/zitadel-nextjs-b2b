import { getSession } from 'next-auth/react';
import useSWR from 'swr';

import orgStore from '../lib/org';

export default function UserGrantTable() {
  const fetcher = async (url: string) => {
    const session = (await getSession()) as any;
    const org = orgStore.getState().org;

    return fetch(`${url}`, {
      method: 'GET',
      headers: {
        'content-Type': 'application/json',
        authorization: `Bearer ${session.accessToken}`,
        orgid: org.id,
      },
    })
      .then((res) => res.json())
      .then((resp) => resp.result ?? [])
      .catch((error) => {
        console.error(error);
      });
  };

  const { data: usergrants, error: orgError } = useSWR('/api/usergrants', (url) => fetcher(url));

  return (
    <div className="max-w-7xl mx-auto px-6">
      <h2 className="mb-4 text-2xl mt-4">User Grants</h2>

      <p className="text-sm text-gray-300 mb-4">These are the unfiltered user grants of your organization</p>
      <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
        <div className="inline-block min-w-full shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-white/20  text-left text-xs  text-gray-200 uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3 border-b-2 border-white/20  text-left text-xs  text-gray-200 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-5 py-3 border-b-2 border-white/20 text-left text-xs  text-gray-200 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-5 py-3 border-b-2 border-white/20 text-left text-xs  text-gray-200 uppercase tracking-wider">
                  Roles
                </th>
              </tr>
            </thead>
            <tbody>
              {usergrants &&
                usergrants.map((grant, i) => {
                  return (
                    <tr key={`${grant.id}${i}`} className="group">
                      <td className="px-5 py-1 border-b border-gray-600 text-sm group">
                        <div className="flex flex-col">
                          <p className="text-white whitespace-no-wrap">{grant.displayName}</p>
                          <p className="block text-sm text-gray-400 whitespace-no-wrap">{grant.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-600 text-sm group">
                        <p className="text-white whitespace-no-wrap">{grant.orgName}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-600 text-sm group">
                        <p className="text-white whitespace-no-wrap">{grant.projectName}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-600 text-sm group">
                        <p className="text-white whitespace-no-wrap">{grant.roleKeys ? grant.roleKeys.join(', ') : ''}</p>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {usergrants?.length === 0 && (
            <div className="w-full flex flex-row items-center justify-center py-2 px-6 bg-black/5 dark:bg-white/5">
              <i className="las la-exclamation text-icon"> </i>
              <p className="text-center text-sm italic">No entries</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import orgStore from '../lib/org';

export default function UserGrant({ roles }: { roles: string[] }) {
  const org = orgStore((state) => (state as any).org);

  const { data: session } = useSession();

  return (
    session && (
      <div className="py-4">
        You have{' '}
        <strong className={`${roles && roles.length ? 'text-green-500' : 'text-red-500'}`}>
          {roles && roles.length ? roles.join(',') : 'no'}
        </strong>{' '}
        roles for this application and the organization set above.
      </div>
    )
  );
}

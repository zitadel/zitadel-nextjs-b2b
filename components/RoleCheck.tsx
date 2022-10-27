import { useSession } from 'next-auth/react';
import { useContext } from 'react';

import roleStore from '../lib/roles';

export default function RolesCheck(props: any) {
  const { data: session } = useSession();
  const roles = roleStore((state) => (state as any).roles);

  const hasRoles = !!(
    roles && (props.requiredRole ? roles.includes(props.requiredRole) : true)
  );

  return session && hasRoles
    ? props.children
    : props.fallback || (
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col items-center">
            <p className="mb-4 text-red-500">
              You don&apos;t have any roles for this organization
            </p>
          </div>
        </div>
      );
}

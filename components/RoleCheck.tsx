import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

export default function RolesCheck({
  roles,
  requiredRole,
  children,
  fallback,
}: {
  roles: string[];
  requiredRole: string;
  children: JSX.Element;
  fallback?: JSX.Element;
}) {
  const { data: session } = useSession();

  const hasRoles = !!(roles && (requiredRole ? roles.includes(requiredRole) : true));

  return session && hasRoles
    ? children
    : fallback || (
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col items-center">
            <p className="mb-4 text-red-500">You don&apos;t have any roles for this organization</p>
          </div>
        </div>
      );
}

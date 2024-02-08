import { useEffect, useState } from 'react';

import AuthCheck from '../components/AuthCheck';
import GrantedProjects from '../components/GrantedProjects';
import GrantRadio from '../components/GrantRadio';
import RolesCheck from '../components/RoleCheck';
import UserGrant from '../components/UserGrant';
import UserGrantTable from '../components/UserGrantTable';
import orgStore from '../lib/org';
import { ROLES } from '../lib/roles';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Home() {
  return (
    <AuthCheck>
      <HomePage key="grantedprojects"></HomePage>
    </AuthCheck>
  );
}

function HomePage() {
  const org = orgStore((state) => (state as any).org);

  const [selected, setSelected] = useState(ROLES[0]);

  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (org) {
      setIsLoading(true);
      fetch(`/api/userinfo`)
        .then(async (resp) => {
          const scope = 'urn:zitadel:iam:org:project:roles';
          const userinfo = await resp.json();
          const roles = userinfo[scope];

          if (!roles) {
            throw Error('No roles in userinfo.');
          }

          const mappedRoles: string[] = Object.keys(roles).map((role) => {
            return roles[role][org.id] ? role : null;
          });

          setIsLoading(false);
          setRoles(mappedRoles);
        })
        .catch((error) => {
          console.error(error);
          setIsLoading(false);
        });
    }
  }, [org]);

  return (
    <>
      <div className="py-10 pb-6 bg-gray-50 dark:bg-zitadelblue-700 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto max-w-7xl flex justify-between flex-wrap px-6">
          <div className="flex flex-col mb-4">
            <div className="flex items-center mb-1">
              <h1 className="text-3xl">{org ? `${org.name} ` : null}Granted projects</h1>
            </div>
            <p className="text-black dark:text-white text-opacity-80 dark:text-opacity-80">
              These are the projects on which your organization has grants (project-grants)
            </p>
            {!org && <p className="my-4 text-red-500">Please select an organization in the navbar above!</p>}
            <UserGrant roles={roles}></UserGrant>
          </div>
          <span className="flex-1"></span>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6">
        {isLoading && <LoadingSpinner className="ml-6 h-7 w-7 self-center my-4 mb-2" />}
      </div>

      <RolesCheck roles={roles} requiredRole="reader">
        <>
          <GrantRadio roles={roles} selected={selected} setSelected={(role) => setSelected(role)} />
          {selected === ROLES[0] ? <GrantedProjects /> : null}
          {selected === ROLES[1] ? <UserGrantTable /> : null}
        </>
      </RolesCheck>
    </>
  );
}

import { getSession, useSession } from "next-auth/react";
import { useEffect } from "react";

import { getRolesFromUserInfo } from "../lib/hasRole";
import orgStore from "../lib/org";
import roleStore from "../lib/roles";

export default function UserGrant() {
  const org = orgStore((state) => (state as any).org);

  const { data: session } = useSession();

  const roles = roleStore((state) => (state as any).roles);
  const setRoles = roleStore((state) => (state as any).setRoles);

  useEffect(() => {
    getSession().then((session) => {
      if (org) {
        getRolesFromUserInfo(`Bearer ${session.accessToken}`).then((roles) => {
          const mappedRoles: string[] = Object.keys(roles).map((role) => {
            return roles[role][org.id] ? role : null;
          });

          setRoles(mappedRoles);
        });
      }
    });
  }, [org]);

  return (
    session && (
      <div className="py-4">
        You have{" "}
        <strong
          className={`${
            roles && roles.length ? "text-green-500" : "text-red-500"
          }`}
        >
          {roles && roles.length ? roles.join(",") : "no"}
        </strong>{" "}
        roles for this application and the organization set above.
      </div>
    )
  );
}

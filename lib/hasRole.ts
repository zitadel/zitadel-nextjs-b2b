export function hasRole(role: string, orgId: string): Promise<boolean> {
  return getRolesFromUserInfo()
    .then((roles) => roles[role] && roles[role][orgId])
    .catch(() => {
      return false;
    });
}

export function getRolesFromUserInfo(): Promise<any> {
  return fetch('/api/userinfo', {
    headers: {
      'content-type': 'application/json',
    },
    method: 'GET',
  })
    .then((resp) => resp.json())
    .then((resp) => {
      const scope = 'urn:zitadel:iam:org:project:roles';
      const roles = resp[scope];

      return roles;
    });
}

export function hasRole(
  role: string,
  orgId: string,
  authHeader: string
): Promise<boolean> {
  return getRolesFromUserInfo(authHeader)
    .then((roles) => roles[role] && roles[role][orgId])
    .catch(() => {
      return false;
    });
}

export function getRolesFromUserInfo(authHeader): Promise<any> {
  const userInfoEndpoint = `${process.env.NEXT_PUBLIC_ZITADEL_ISSUER}/oidc/v1/userinfo`;

  return (
    fetch(userInfoEndpoint, {
      headers: {
        authorization: authHeader,
        "content-type": "application/json",
      },
      method: "GET",
    })
      // .then(handleFetchErrors)
      .then((resp) => resp.json())
      .then((resp) => {
        const scope = "urn:zitadel:iam:org:project:roles";
        const roles = resp[scope];

        return roles;
      })
  );
}

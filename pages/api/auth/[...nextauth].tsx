import NextAuth from 'next-auth';

export default NextAuth({
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      if (profile?.sub) {
        token.sub = profile.sub;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      token.idToken ??= account?.id_token;
      if (typeof user !== typeof undefined) {
        token.user = user;
      }
      return token;
    },
    async session({
      session,
      token: {
        id,
        sub,
        user,
        error: tokenError,
        accessToken,
        idToken: idToken,
      },
    }) {
      session.accessToken = accessToken;
      session.id = id;
      session.sub = sub;
      session.user = user;
      session.idToken = idToken;
      session.error = tokenError;

      return session;
    },
  },
  debug: true,
  providers: [
    {
      id: "zitadel",
      name: "zitadel",
      type: "oauth",
      version: "2",
      wellKnown: process.env.NEXT_PUBLIC_ZITADEL_ISSUER,
      authorization: {
        params: {
          scope: `openid email profile urn:zitadel:iam:org:project:id:zitadel:aud`,
        },
      },
      idToken: true,
      checks: ["pkce", "state"],
      client: {
        token_endpoint_auth_method: "none",
      },
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          email: profile.email,
          loginName: profile.preferred_username,
          image: profile.picture,
          roles: profile["urn:zitadel:iam:org:project:roles"],
        };
      },

      clientId: process.env.ZITADEL_CLIENT_ID,
    },
  ],
});

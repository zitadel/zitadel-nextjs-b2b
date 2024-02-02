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
    async session({ session, token: { id, sub, user, error: tokenError, accessToken, idToken } }) {
      session.accessToken = accessToken;
      session.idToken = idToken as string;
      session.user = {
        id: user?.id,
        email: user?.email,
        image: user?.image,
        name: user?.name,
        loginName: user?.loginName,
        orgName: user?.organization.name,
      };
      session.clientId = process.env.ZITADEL_CLIENT_ID;
      session.error = tokenError;

      return session;
    },
  },
  debug: true,
  providers: [
    {
      id: 'zitadel',
      name: 'zitadel',
      type: 'oauth',
      version: '2',
      wellKnown: process.env.NEXT_PUBLIC_ZITADEL_ISSUER,
      authorization: {
        params: {
          scope: `openid email profile urn:zitadel:iam:org:project:id:zitadel:aud`,
        },
      },
      idToken: true,
      checks: ['pkce', 'state'],
      client: {
        token_endpoint_auth_method: 'none',
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
          roles: profile['urn:zitadel:iam:org:project:roles'],
          organization: {
            id: profile['urn:zitadel:iam:user:resourceowner:id'],
            name: profile['urn:zitadel:iam:user:resourceowner:name'],
            primaryDomain: profile['urn:zitadel:iam:user:resourceowner:primary_domain'],
          },
        };
      },

      clientId: process.env.ZITADEL_CLIENT_ID,
    },
  ],
});

import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';
import ZitadelProvider from 'next-auth/providers/zitadel';
import { Issuer } from 'openid-client';

const authconfig = async (req: NextApiRequest, res: NextApiResponse) =>
  NextAuth(req, res, {
    callbacks: {
      async jwt({ token, user, account }) {
        if (req.url?.startsWith('/api/auth/session?orgName=')) {
          if (req.query.orgName && typeof req.query.orgName === 'string' && token.user && token.user.organization) {
            token.user.organization.name = req.query.orgName;
          }
        }

        token.user ??= user;
        token.accessToken ??= account?.access_token;
        token.refreshToken ??= account?.refresh_token;
        token.expiresAt ??= (account?.expires_at ?? 0) * 1000;
        token.error = undefined;
        // Return previous token if the access token has not expired yet
        if (Date.now() < (token.expiresAt as number)) {
          return token;
        }

        // Access token has expired, try to update it
        return refreshAccessToken(token);
      },
      async session({ session, token: { user, error: tokenError } }) {
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
      ZitadelProvider({
        issuer: process.env.ZITADEL_API,
        clientId: process.env.ZITADEL_CLIENT_ID,
        clientSecret: process.env.ZITADEL_CLIENT_SECRET,
        authorization: {
          params: {
            scope: `openid email profile offline_access urn:zitadel:iam:user:resourceowner urn:zitadel:iam:org:project:id:zitadel:aud`,
          },
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
            organization: {
              id: profile['urn:zitadel:iam:user:resourceowner:id'],
              name: profile['urn:zitadel:iam:user:resourceowner:name'],
              primaryDomain: profile['urn:zitadel:iam:user:resourceowner:primary_domain'],
            },
          };
        },
      }),
    ],
  });

export default authconfig;

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const issuer = await Issuer.discover(process.env.ZITADEL_API);
    const client = new issuer.Client({
      client_id: process.env.ZITADEL_CLIENT_ID || '',
      token_endpoint_auth_method: 'none',
    });

    const { refresh_token, access_token, expires_at } = await client.refresh(token.refreshToken as string);

    return {
      ...token,
      accessToken: access_token,
      expiresAt: (expires_at ?? 0) * 1000,
      refreshToken: refresh_token, // Fall back to old refresh token
    };
  } catch (error) {
    console.error('Error during refreshAccessToken', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

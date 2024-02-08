import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token?.user && !token.error,
  },
});

export const config = { matcher: ['/:path*'] };

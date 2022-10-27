import '../styles/globals.scss';

import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';

import Layout from '../components/Layout';

export default function MyApp({ Component, pageProps }: any) {
  return (
    <>
      <Head>
        <title>ZITADEL • B2B Demo</title>
        <meta name="description" content="This is a ZITADEL Demo" />
      </Head>

      <SessionProvider session={pageProps.session}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SessionProvider>
    </>
  );
}

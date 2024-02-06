import Head from 'next/head';
import React, { useEffect, useState } from 'react';

import Footer from './Footer';
import Nav from './Nav';

declare const window: any;

type Props = {
  children: any;
};

type State = {};

class Layout extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <>
        <Head>
          <title>ZITADEL • B2B Demo</title>
        </Head>
        <div className="dark">
          <div className="relative flex flex-col min-h-screen w-full bg-zitadelblue-800 text-white">
            <Nav></Nav>
            <main className="flex-grow w-full pt-14">{this.props.children}</main>
            <Footer></Footer>
          </div>
        </div>
      </>
    );
  }
}

export default Layout;

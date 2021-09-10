import { NextPage } from "next";
import Head from "next/head";

const Header: NextPage<{ title: string }> = ({ title }) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Crypto Store Exchange" />
      <meta property="og:type" content="website" />
      <meta
        property="og:description"
        content="Exchange crypto for store credit"
      />
      <meta name="theme-color" content="#2e5792"></meta>
    </Head>
  );
};

export default Header;

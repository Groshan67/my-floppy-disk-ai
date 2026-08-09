import type { AppProps } from 'next/app';
import { IBM_Plex_Mono, Press_Start_2P } from 'next/font/google';
// import { DocsThemeConfig, useConfig } from 'nextra-theme-docs';
// import { Footer, Layout, Navbar, ThemeSwitch } from 'nextra-theme-docs';
import meta from './_meta.json';

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm',
});

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
});

export default function App({ Component, pageProps }: AppProps) {
  console.log(meta);

  return (
    <main
      className={`${ibmPlexMono.variable} ${pressStart2P.variable} font-ibm`}
    >
      <Component {...pageProps} />
    </main>
  );
}
import Link from 'next/link';

interface Props {
  external?: boolean;
  status?: boolean;
  href: string;
  children: any;
}

export default function FooterLink(props: Props) {
  return props.external ? (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className={`my-3 ${
        props.status ? 'sp-status mt-0' : ''
      } flex items-center hover:text-purple-700 dark:hover:text-zitadelaccent-400`}
    >
      {props.children}
      <i className="text-xl h-5 -mt-2 ml-2 las la-external-link-alt"></i>
    </a>
  ) : (
    <Link href={props.href} className={`flex items-center my-3 hover:text-purple-700 dark:hover:text-zitadelaccent-400`}>
      {props.children}
    </Link>
  );
}

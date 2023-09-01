export default function Header() {
  return (
    <div className="relative overflow-hidden">
      <div className="flex max-w-7xl items-center mx-auto py-4 px-6">
        <div className="my-10 md:my-20 md:mt-48 z-10 md:w-7/12">
          <h1 className="font-semibold text-5xl w-5/12 md:w-full uppercase my-8">
            Always run a <br />
            <span className="text-purple-500 dark:text-zitadelaccent-500">
              changing
            </span>{" "}
            system
            <span className="text-purple-500 dark:text-zitadelaccent-500">
              .
            </span>
          </h1>
          <p className="text-lg opacity-80 dark:opacity-80 mb-8">
            ZITADEL - Identity infrastructure, simplified for you.
          </p>
        </div>
      </div>

      <img
        className="z-0 absolute w-2/3 top-0 right-0 block dark:hidden"
        src="/waves/header-light.png"
        alt={`background waves`}
      />
      <img
        className="z-0 absolute w-2/3 top-0 right-0 hidden dark:block"
        src="/waves/header.png"
        alt={`background waves`}
      />
      <img
        className="animate-waves z-0 absolute w-2/3 -top-96 -right-40 block dark:hidden"
        src="/waves/right-flair-light.png"
        alt={`background waves`}
      />
      <img
        className="animate-waves z-0 absolute w-2/3 -top-60 right-0 hidden dark:block"
        src="/waves/right-flair.png"
        alt={`background waves`}
      />
    </div>
  );
}

import Link from "next/link";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "~/server/auth";
import { db } from "~/server/db";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const appleStock = session?.user
    ? await db
        .selectFrom("StockHistory")
        .selectAll()
        .where("StockHistory.stock", "=", "AAPL")
        .execute()
    : null;

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
      <h1 className="text-5xl font-extrabold tracking-tight text-zinc-200 sm:text-[5rem]">
        Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
        <Link
          className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-zinc-200 hover:bg-white/20"
          href="https://create.t3.gg/en/usage/first-steps"
          target="_blank"
        >
          <h3 className="text-2xl font-bold">First Steps →</h3>
          <div className="text-lg">
            Just the basics - Everything you need to know to set up your
            database and authentication.
          </div>
        </Link>
        <Link
          className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-zinc-200 hover:bg-white/20"
          href="https://create.t3.gg/en/introduction"
          target="_blank"
        >
          <h3 className="text-2xl font-bold">Documentation →</h3>
          <div className="text-lg">
            Learn more about Create T3 App, the libraries it uses, and how to
            deploy it.
          </div>
        </Link>
      </div>
      <AuthShowcase session={session} />
      <div className="flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-zinc-200">
          {session?.user
            ? "Stock History for AAPL"
            : "Log in to see stock data"}
        </h2>
        <div className="flex flex-col items-center justify-center gap-4">
          {appleStock?.map((row) => (
            <div className="flex flex-col items-center justify-center gap-4 text-zinc-200">
              {dateFormatter.format(row.date)} - ${Math.round(row.average)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthShowcase(props: { session: Session | null }) {
  const { session } = props;
  const signedIn = !!session?.user;
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-zinc-200">
        {signedIn && <span>Logged in as {session.user?.name}</span>}
      </p>
      <Link
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-zinc-200 no-underline transition hover:bg-white/20"
        href={signedIn ? "/api/auth/signout" : "/api/auth/signin"}
      >
        {signedIn ? "Sign out" : "Sign in"}
      </Link>
    </div>
  );
}

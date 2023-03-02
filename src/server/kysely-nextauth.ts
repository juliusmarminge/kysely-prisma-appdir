import {
  type AdapterUser,
  type Adapter,
  VerificationToken,
} from "next-auth/adapters";
import { db } from "./db";
import { nanoid } from "nanoid";

export const KyselyAdapter: Adapter = {
  createUser: async (data) =>
    (await db
      .insertInto("User")
      .values({ id: nanoid(), ...data })
      .executeTakeFirstOrThrow()
      .then(async () => {
        return await db
          .selectFrom("User")
          .selectAll()
          .where("email", "=", `${data.email}`)
          .executeTakeFirstOrThrow();
      })) as AdapterUser,
  getUser: async (id) =>
    ((await db
      .selectFrom("User")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()) as AdapterUser) ?? null,
  getUserByEmail: async (email) =>
    ((await db
      .selectFrom("User")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst()) as AdapterUser) ?? null,
  getUserByAccount: async ({ providerAccountId, provider }) =>
    ((await db
      .selectFrom("User")
      .innerJoin("Account", "User.id", "Account.userId")
      .selectAll("User")
      .where("Account.providerAccountId", "=", providerAccountId)
      .where("Account.provider", "=", provider)
      .executeTakeFirst()) as AdapterUser) ?? null,
  updateUser: async ({ id, ...user }) => {
    if (!id) throw new Error("User not found");
    return (await db
      .updateTable("User")
      .set(user)
      .where("id", "=", id)
      .executeTakeFirstOrThrow()
      .then(async () => {
        return await db
          .selectFrom("User")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirstOrThrow();
      })) as AdapterUser;
  },
  deleteUser: async (userId) => {
    await db.deleteFrom("User").where("User.id", "=", userId).execute();
  },
  linkAccount: async (account) => {
    await db
      .insertInto("Account")
      .values({ id: nanoid(), ...account })
      .executeTakeFirstOrThrow();
  },
  unlinkAccount: async ({ providerAccountId, provider }) => {
    await db
      .deleteFrom("Account")
      .where("Account.providerAccountId", "=", providerAccountId)
      .where("Account.provider", "=", provider)
      .executeTakeFirstOrThrow();
  },
  createSession: async (data) =>
    await (async () => {
      await db
        .insertInto("Session")
        .values({ id: nanoid(), ...data })
        .executeTakeFirstOrThrow();
      return await db
        .selectFrom("Session")
        .selectAll()
        .where("sessionToken", "=", data.sessionToken)
        .executeTakeFirstOrThrow();
    })(),
  getSessionAndUser: async (sessionTokenArg) => {
    const result = await db
      .selectFrom("Session")
      .innerJoin("User", "User.id", "Session.userId")
      .selectAll("User")
      .select([
        "Session.id as sessionId",
        "Session.userId",
        "Session.sessionToken",
        "Session.expires",
      ])
      .where("Session.sessionToken", "=", sessionTokenArg)
      .executeTakeFirst();
    if (!result) return null;
    const { sessionId: id, userId, sessionToken, expires, ...user } = result;
    return {
      user: user as AdapterUser,
      session: { id, userId, sessionToken, expires },
    };
  },
  updateSession: async (session) =>
    await db
      .updateTable("Session")
      .set(session)
      .where("Session.sessionToken", "=", session.sessionToken)
      .executeTakeFirstOrThrow()
      .then(async () => {
        return await db
          .selectFrom("Session")
          .selectAll()
          .where("Session.sessionToken", "=", session.sessionToken)
          .executeTakeFirstOrThrow();
      }),
  deleteSession: async (sessionToken) => {
    await db
      .deleteFrom("Session")
      .where("Session.sessionToken", "=", sessionToken)
      .executeTakeFirstOrThrow();
  },
  createVerificationToken: async (verificationToken) =>
    await db
      .insertInto("VerificationToken")
      .values(verificationToken)
      .executeTakeFirstOrThrow()
      .then(async () => {
        return await db
          .selectFrom("VerificationToken")
          .selectAll()
          .where("token", "=", verificationToken.token)
          .executeTakeFirstOrThrow();
      }),
  useVerificationToken: async ({ identifier, token }) =>
    ((await db
      .selectFrom("VerificationToken")
      .selectAll()
      .where("token", "=", token)
      .executeTakeFirst()
      .then(async (res) => {
        await db
          .deleteFrom("VerificationToken")
          .where("VerificationToken.token", "=", token)
          .where("VerificationToken.identifier", "=", identifier)
          .executeTakeFirst();
        return res;
      })) as VerificationToken) ?? null,
};

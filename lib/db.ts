import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrisma> };

/**
 * Runtime DB connection (Next.js / server):
 * - `DATABASE_URL` with `postgresql://` → Postgres via `@prisma/adapter-pg` (Neon pooled URL, local, etc.).
 *   **Do not** route the app through `DATABASE_DIRECT_URL` when both are set: Neon expects the
 *   pooled URL at runtime and a separate direct URL only for Prisma CLI (`migrate`, `db push`).
 * - `DATABASE_URL` with `prisma+postgres://` or `prisma://` → Prisma Accelerate, unless
 *   `DATABASE_DIRECT_URL` is a `postgresql://` URL (bypass Accelerate for local/dev).
 */
function createPrisma() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const directOverride = process.env.DATABASE_DIRECT_URL?.trim();

  // Plain Postgres (Neon pooled, Docker, RDS, …)
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
  }

  // Prisma Accelerate — optional direct Postgres bypass (e.g. local DB while URL points at Accelerate)
  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    if (directOverride?.startsWith("postgresql") || directOverride?.startsWith("postgres://")) {
      const adapter = new PrismaPg({ connectionString: directOverride });
      return new PrismaClient({ adapter });
    }
    return new PrismaClient({
      accelerateUrl: url,
    }).$extends(withAccelerate());
  }

  throw new Error(
    "DATABASE_URL must be postgresql://, postgres://, prisma+postgres://, or prisma://",
  );
}

/** Models added after initial deploy — if missing on the cached client, rebuild Prisma (see getPrismaSingleton). */
const REQUIRED_DELEGATES = ["emailVerificationOtp", "registrationVerification"] as const;

function clientHasRequiredDelegates(client: unknown): boolean {
  if (!client || typeof client !== "object") return false;
  const c = client as Record<string, { deleteMany?: unknown } | undefined>;
  return REQUIRED_DELEGATES.every((name) => typeof c[name]?.deleteMany === "function");
}

function getPrismaSingleton(): ReturnType<typeof createPrisma> {
  const cached = globalForPrisma.prisma;
  if (cached && clientHasRequiredDelegates(cached)) {
    return cached;
  }

  const fresh = createPrisma();
  if (!clientHasRequiredDelegates(fresh)) {
    throw new Error(
      "Prisma Client is out of date (missing RegistrationVerification or EmailVerificationOtp). Run `npx prisma generate`, then restart `npm run dev`.",
    );
  }

  globalForPrisma.prisma = fresh;
  return fresh;
}

export const prisma = getPrismaSingleton() as PrismaClient;

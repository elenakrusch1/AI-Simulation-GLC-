/**
 * One-off CLI to create (or reset) an administrator account.
 *
 * This is the ONLY supported way to create the first admin — there is
 * no public registration route. Run it once after the database is
 * migrated:
 *
 *   ADMIN_LOGIN_IDENTIFIER=admin@example.com ADMIN_PASSWORD='...' npm run seed:admin
 *
 * or, for local development, omit the env vars and answer the
 * prompts. Never hardcode a production password — this script always
 * requires one to be supplied explicitly, either way.
 *
 * Re-running it for an identifier that already exists resets that
 * account's password and reactivates it — useful for account
 * recovery, not just first-time setup.
 */
import { createInterface } from "node:readline/promises";
import { createInterface as createCallbackInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { passwordPolicySchema } from "../src/lib/validation/password-policy";

const prisma = new PrismaClient();

async function promptVisible(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Prompts for a value without echoing it back to the terminal. */
async function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createCallbackInterface({ input: stdin, output: stdout });
    // @ts-expect-error -- accessing an internal readline field is the
    // standard (if unofficial) technique for muting echo in Node.
    const originalWrite = rl._writeToOutput.bind(rl);
    let masking = false;
    // @ts-expect-error -- see above
    rl._writeToOutput = (chunk: string) => {
      originalWrite(masking ? "" : chunk);
    };
    stdout.write(question);
    masking = true;
    rl.question("", (answer) => {
      masking = false;
      stdout.write("\n");
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  let identifier = process.env.ADMIN_LOGIN_IDENTIFIER?.trim();
  let password = process.env.ADMIN_PASSWORD;
  const usingEnvPassword = !!password;

  if (!identifier) {
    identifier = await promptVisible("Admin email or username: ");
  }
  if (!password) {
    password = await promptHidden("Admin password: ");
    const confirm = await promptHidden("Confirm admin password: ");
    if (password !== confirm) {
      console.error("Passwords did not match. Aborting.");
      process.exitCode = 1;
      return;
    }
  }

  if (!identifier || identifier.length < 3 || identifier.length > 200) {
    console.error("A login identifier of 3–200 characters is required.");
    process.exitCode = 1;
    return;
  }

  const passwordCheck = passwordPolicySchema.safeParse(password);
  if (!passwordCheck.success) {
    console.error("Password does not meet requirements:");
    for (const issue of passwordCheck.error.issues) {
      console.error(` - ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(passwordCheck.data);

  const user = await prisma.user.upsert({
    where: { loginIdentifier: identifier },
    update: {
      passwordHash,
      role: "ADMIN",
      active: true,
      failedLoginCount: 0,
      lockedUntil: null,
    },
    create: {
      loginIdentifier: identifier,
      passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: null,
      action: "ADMIN_SEEDED_VIA_CLI",
      entityType: "User",
      entityId: user.id,
      reason: usingEnvPassword
        ? "Created/reset via seed:admin with env-supplied credentials"
        : "Created/reset via seed:admin interactive prompt",
    },
  });

  console.log(`Admin account ready: ${user.loginIdentifier}`);
}

main()
  .catch((error) => {
    console.error("seed:admin failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

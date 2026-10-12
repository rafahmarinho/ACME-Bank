const PASSWORDS = "acme-demo-passwords-v1",
  RECOVERY = "acme-demo-recovery-v1";
export const DEMO_PASSWORD = "AcmeDemo!2026";
const digest = async (password: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)),
    ),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
export async function demoAuthenticate(email: string, password: string) {
  const stored = JSON.parse(localStorage.getItem(PASSWORDS) ?? "{}") as Record<
    string,
    string
  >;
  return stored[email.toLowerCase()]
    ? stored[email.toLowerCase()] === (await digest(password))
    : password === DEMO_PASSWORD;
}
export async function demoSetPassword(email: string, password: string) {
  if (password.length < 12)
    throw new Error("Use at least 12 characters for your password.");
  const stored = JSON.parse(localStorage.getItem(PASSWORDS) ?? "{}");
  stored[email.toLowerCase()] = await digest(password);
  localStorage.setItem(PASSWORDS, JSON.stringify(stored));
}
export function demoRecovery(email: string) {
  const token = crypto.randomUUID();
  localStorage.setItem(
    RECOVERY,
    JSON.stringify({ token, email, expires: Date.now() + 15 * 60 * 1000 }),
  );
  return `/reset-password?token=${token}`;
}
export async function demoResetPassword(token: string, password: string) {
  const recovery = JSON.parse(localStorage.getItem(RECOVERY) ?? "null");
  if (!recovery || token !== recovery.token || recovery.expires < Date.now())
    throw new Error("This recovery link has expired. Request another one.");
  await demoSetPassword(recovery.email, password);
  localStorage.removeItem(RECOVERY);
}

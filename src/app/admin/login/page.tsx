import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign-in · wiTTy's Translation Rescue" };

export default function LoginPage() {
  return (
    <main className="viz-root flex min-h-dvh items-center justify-center px-4">
      <LoginForm />
    </main>
  );
}

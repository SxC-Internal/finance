import { useCallback, useState, type FormEvent } from "react";
import type { User } from "@/types";

interface LoginResponse {
  success: boolean;
  data: {
    user: User;
  } | null;
  error: string | null;
}

export function useLoginForm(onLogin: (user: User) => void) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        setError("Email and password are required.");
        return;
      }

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
            password: trimmedPassword,
          }),
        });

        const payload = (await response.json()) as LoginResponse;

        if (response.ok && payload.success && payload.data?.user) {
          setError("");
          onLogin(payload.data.user);
          return;
        }

        setError(payload.error ?? "Login failed.");
      } catch {
        setError("Network error. Please try again.");
      }
    },
    [email, password, onLogin],
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    handleSubmit,
  };
}

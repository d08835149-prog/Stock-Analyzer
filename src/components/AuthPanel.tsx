"use client";

import { useEffect, useState } from "react";

type User = {
  id: string | number;
  nickname: string;
};

type Props = {
  onUserChange?: (user: User | null) => void;
};

export default function AuthPanel({
  onUserChange,
}: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (res.ok && data.user) {
          setUser(data.user);
          onUserChange?.(data.user);
        }
      } catch {
        // ignore
      }
    };

    loadSession();
  }, [onUserChange]);

  const submit = async () => {
    if (!nickname.trim() || !password) {
      setMessage("Nickname and password are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : "/api/auth/signup";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Something went wrong.");
        return;
      }

      if (mode === "signup") {
        setMessage("Account created. Please log in.");
        setMode("login");
        setPassword("");
        return;
      }

      setUser(data.user);
      onUserChange?.(data.user);
      setMessage("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    setUser(null);
    onUserChange?.(null);
    setNickname("");
    setPassword("");
    setMessage("");
  };

  if (user) {
    return (
      <section>
        <h3>👤 {user.nickname}</h3>

        <button
          type="button"
          className="primary-button"
          onClick={logout}
        >
          Logout
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === "login" ? "auth-tab active" : "auth-tab"}
          onClick={() => {
            setMode("login");
            setMessage("");
          }}
        >
          Login
        </button>

        <button
          type="button"
          className={mode === "signup" ? "auth-tab active" : "auth-tab"}
          onClick={() => {
            setMode("signup");
            setMessage("");
          }}
        >
          Sign Up
        </button>
      </div>

      <input
        type="text"
        placeholder="Nickname"
        className="input"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {message && (
        <div className="auth-message">
          {message}
        </div>
      )}

      <button
        type="button"
        className="primary-button"
        onClick={submit}
        disabled={loading}
      >
        {loading
          ? "Please wait..."
          : mode === "login"
          ? "Login"
          : "Create Account"}
      </button>
    </section>
  );
}
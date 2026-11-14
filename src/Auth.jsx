import React, { useState } from "react";
import { supabase } from "./supabase.js";

export default function Auth() {
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }

      if (isSignUp && !result.data.session) {
        setSuccessMessage("Check your email for a confirmation link, then sign in.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to authenticate. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setErrorMessage("");
    setSuccessMessage("");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="brand auth-brand" href="/" aria-label="Buildwise home">
          <span className="brand-icon"><span /><span /><span /><span /></span>
          <span className="brand-name">buildwise<span>.</span></span>
        </a>
        <p className="eyebrow">CONSTRUCTION ESTIMATING WORKSPACE</p>
        <h1>{isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-description">
          {isSignUp ? "Sign up to access your rate library." : "Sign in to continue to your rate library."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </label>
          {errorMessage && <p className="auth-message error" role="alert">{errorMessage}</p>}
          {successMessage && <p className="auth-message success" role="status">{successMessage}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? "Already have an account?" : "New to Buildwise?"}{" "}
          <button type="button" onClick={() => changeMode(isSignUp ? "sign-in" : "sign-up")}>
            {isSignUp ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}

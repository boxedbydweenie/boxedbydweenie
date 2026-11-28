import { useEffect, useState } from "react";
import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useUser } from "@/hooks/use-shop";
import { signIn, signUp } from "@/services/account";
import { C, StepHeader } from "@/components/app/kit";

export const Route = createFileRoute("/app/signin")({
  validateSearch: z.object({ mode: z.enum(["up", "in"]).optional().catch(undefined) }),
  component: AppSignIn,
});

/** 1.2 Create account, or sign in. One BBD account works here, in the shop and for Secret Santa. */
function AppSignIn() {
  const { mode = "up" } = Route.useSearch();
  const user = useUser();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");

  // Already signed in (and not in the middle of signing up): go straight to the calendar.
  // Only while this screen is really showing: after sign-up the app moves on to the
  // "Check your inbox" step, and this screen can briefly re-appear during that move.
  const onThisScreen = useLocation({ select: (l) => l.pathname.replace(/\/$/, "") === "/app/signin" });
  useEffect(() => {
    if (user && !busy && onThisScreen) void navigate({ to: "/app", replace: true });
  }, [user, busy, onThisScreen, navigate]);

  const strength = [
    pw.length >= 8,
    /[A-Z]/.test(pw) || /[^a-z0-9]/i.test(pw),
    /\d/.test(pw),
    pw.length >= 12,
  ].filter(Boolean).length;
  const strengthText = [
    "Too short",
    "Weak password",
    "Fair password",
    "Strong password",
    "Very strong password",
  ][pw.length < 8 ? 0 : strength]!;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    setErr("");
    if (mode === "up" && pw.length < 8)
      return setErr("Choose a password of at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "up") {
        await signUp({
          name: `${v("name")} ${v("lastName")}`.trim(),
          firstName: v("name"),
          lastName: v("lastName"),
          email: v("email"),
          phone: "",
          password: pw,
          marketing: f.get("marketing") === "on",
        });
        void navigate({ to: "/app/welcome", search: { step: "verify" }, replace: true });
      } else {
        await signIn(v("email"), pw);
        void navigate({ to: "/app", replace: true });
      }
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="a-top-pattern"
      style={{
        minHeight: "100dvh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        padding: "calc(env(safe-area-inset-top,0px) + 28px) 22px 28px",
      }}
    >
      {mode === "up" ? (
        <StepHeader step={1} onBack={() => void navigate({ to: "/app" })} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            to="/app"
            aria-label="Back"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `1.5px solid ${C.line}`,
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              className="a-ico"
              style={{ width: 20, height: 20 }}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m15 5-7 7 7 7" />
            </svg>
          </Link>
          <img
            src="/brand/logo-primary.svg"
            alt="Boxed by Dweenie"
            style={{ height: 24, width: "auto" }}
          />
          <span style={{ width: 44 }} />
        </div>
      )}

      <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 26 }}>
        {mode === "up" ? (
          <>
            Let&rsquo;s set up your <span style={{ color: C.goldText }}>gift calendar.</span>
          </>
        ) : (
          <>
            Welcome <span style={{ color: C.goldText }}>back.</span>
          </>
        )}
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: C.muted, margin: "10px 0 0" }}>
        {mode === "up"
          ? "Your dates stay safe and sync between your phone and computer."
          : "Sign in with your Boxed by Dweenie account. It's the same one you use in the shop."}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}>
        {mode === "up" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field id="su-name" name="name" label="First name" autoComplete="given-name" required />
            <Field
              id="su-last"
              name="lastName"
              label="Last name"
              autoComplete="family-name"
              required
            />
          </div>
        )}
        <Field
          id="su-email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
        />
        <div>
          <label htmlFor="su-pass" style={lab}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="su-pass"
              name="password"
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              required
              minLength={mode === "up" ? 8 : undefined}
              style={{ ...inp, paddingRight: 64 }}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              style={{
                position: "absolute",
                right: 6,
                top: 6,
                height: 40,
                padding: "0 10px",
                border: 0,
                background: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: C.nero,
              }}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {mode === "up" && pw && (
            <>
              <div style={{ display: "flex", gap: 4, marginTop: 8 }} aria-hidden="true">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background:
                        pw.length >= 8 && n <= strength
                          ? strength >= 3
                            ? C.sage
                            : C.gold
                          : C.line,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: strength >= 3 && pw.length >= 8 ? C.forest : C.muted,
                  marginTop: 6,
                  fontWeight: 600,
                }}
              >
                {strengthText}
              </div>
            </>
          )}
        </div>
      </div>

      {mode === "up" && (
        <label
          htmlFor="su-opt"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginTop: 16,
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          <input
            id="su-opt"
            name="marketing"
            type="checkbox"
            defaultChecked
            style={{ width: 20, height: 20, margin: 0, accentColor: C.nero, flexShrink: 0 }}
          />
          Send me gift ideas before big dates. You can turn this off any time.
        </label>
      )}

      {err && (
        <p role="alert" style={{ fontSize: 13, color: C.oxblood, fontWeight: 600, marginTop: 14 }}>
          {err}
        </p>
      )}
      <div style={{ flex: 1, minHeight: 24 }} />
      <button
        type="submit"
        className="a-abtn a-lg a-ink"
        disabled={busy}
        style={{ opacity: busy ? 0.6 : 1 }}
      >
        {busy ? "One moment…" : mode === "up" ? "Create account" : "Sign in"}
      </button>
      <div style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 14 }}>
        {mode === "up" ? "Already have an account? " : "New to Boxed by Dweenie? "}
        <Link
          to="/app/signin"
          search={{ mode: mode === "up" ? "in" : "up" }}
          style={{ fontWeight: 600, color: C.nero, textDecoration: "underline" }}
        >
          {mode === "up" ? "Sign in" : "Create an account"}
        </Link>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  ...rest
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} style={lab}>
        {label}
      </label>
      <input id={id} {...rest} style={inp} />
    </div>
  );
}

const lab = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 } as const;
const inp = {
  width: "100%",
  boxSizing: "border-box",
  height: 52,
  border: `1.5px solid ${C.line}`,
  borderRadius: 14,
  background: "#FFFFFF",
  padding: "0 14px",
  font: "400 15px 'Parkinsans','Segoe UI',system-ui,sans-serif",
  color: C.nero,
} as const;

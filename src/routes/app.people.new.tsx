import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { usePeople } from "@/hooks/use-calendar";
import { BackButton, C } from "@/components/app/kit";
import { PersonForm } from "@/components/app/PersonForm";

export const Route = createFileRoute("/app/people/new")({
  validateSearch: z.object({
    edit: z.string().optional().catch(undefined),
    add: z.coerce.boolean().optional().catch(undefined),
  }),
  component: NewPerson,
});

function NewPerson() {
  const { edit, add } = Route.useSearch();
  const editing = usePeople().find((p) => p.id === edit);
  const navigate = useNavigate();
  const router = useRouter();
  return (
    <div
      className="a-top-pattern"
      style={{
        padding: "calc(env(safe-area-inset-top,0px) + 28px) 22px 28px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BackButton
          onClick={() =>
            window.history.length > 1 ? router.history.back() : void navigate({ to: "/app/people" })
          }
        />
        <img
          src="/brand/logo-primary.svg"
          alt="Boxed by Dweenie"
          style={{ height: 24, width: "auto" }}
        />
        <span style={{ width: 44 }} />
      </div>
      <h1 className="a-dsp" style={{ fontSize: 38, marginTop: 24 }}>
        {editing && add ? (
          <>
            Add an occasion for{" "}
            <span style={{ color: C.goldText }}>{editing.name.split(" ")[0]}.</span>
          </>
        ) : editing ? (
          <>
            Edit <span style={{ color: C.goldText }}>{editing.name.split(" ")[0]}.</span>
          </>
        ) : (
          <>
            Who should we <span style={{ color: C.goldText }}>never let you forget?</span>
          </>
        )}
      </h1>
      <PersonForm
        key={editing?.id ?? "new"}
        editing={editing}
        startAdding={Boolean(add)}
        onSaved={(p) =>
          void navigate({ to: "/app/people/$personId", params: { personId: p.id }, replace: true })
        }
      />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ComingSoon, Empty } from "@/components/admin/AdminBits";
import { SOON, SOON_ICON } from "@/components/admin/nav";

export const Route = createFileRoute("/admin/soon/$slug")({ component: Soon });

function Soon() {
  const { slug } = Route.useParams();
  const s = SOON[slug];
  if (!s) return <Empty icon={SOON_ICON} title="That page does not exist"><Link to="/admin" className="underline">Back to the dashboard</Link></Empty>;
  return <ComingSoon title={s.title} group={s.group} icon={s.icon} blurb={s.blurb} will={s.will} />;
}

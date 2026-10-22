import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead, SendTable } from "@/components/admin/EmailBits";

export const Route = createFileRoute("/admin/email-log")({ component: EmailLog });

function EmailLog() {
  return <div>
    <PageHead eyebrow="Email marketing" title="Send log" intro="Every marketing email we have sent: who, when, which campaign and what happened. Tick failed or bounced rows to resend them together." />
    <Card className="mt-8" accent="from-[#E7B93B] via-[#EB826C] to-[#86BAA3]"><SendTable /></Card>
    <p className="mt-4 text-xs text-muted-foreground">Delivered, opened and bounced statuses arrive from Resend once the webhook is connected. Hard bounces are never resent.</p>
  </div>;
}

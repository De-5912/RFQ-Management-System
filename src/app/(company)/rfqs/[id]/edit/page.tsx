import { updateRFQAction } from "@/app/actions/rfqs";
import { RFQFields } from "@/components/rfq-fields";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companyRfqWhere } from "@/lib/rfq-access";

export default async function EditRFQPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const rfq = await prisma.rFQ.findFirst({
    where: { ...companyRfqWhere(user), id },
    include: { items: { orderBy: { lineNumber: "asc" } } },
  });

  if (!rfq) {
    return <PageHeader title="RFQ not found" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${rfq.rfqNumber}`}
        description="Edits are audited. Existing quotation visibility and vendor access are preserved."
      />
      <form action={updateRFQAction} className="space-y-6">
        <RFQFields rfq={rfq} />
        <div className="flex justify-end">
          <SubmitButton>Save RFQ</SubmitButton>
        </div>
      </form>
    </div>
  );
}

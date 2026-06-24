import { updateRFQAction } from "@/app/actions/rfqs";
import { RFQFields } from "@/components/rfq-fields";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fallbackDepartments, fallbackItemServices } from "@/lib/master-data";
import { prisma } from "@/lib/prisma";
import { companyRfqWhere } from "@/lib/rfq-access";

export default async function EditRFQPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const [rfq, departments, itemServices] = await Promise.all([
    prisma.rFQ.findFirst({
      where: { ...companyRfqWhere(user), id },
      include: { items: { orderBy: { lineNumber: "asc" } } },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.itemServiceCatalog.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

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
        <RFQFields
          rfq={rfq}
          departments={departments.map((department) => department.name).concat(departments.length ? [] : fallbackDepartments)}
          itemServices={itemServices.map((item) => item.name).concat(itemServices.length ? [] : fallbackItemServices)}
        />
        <div className="flex justify-end">
          <SubmitButton>Save RFQ</SubmitButton>
        </div>
      </form>
    </div>
  );
}

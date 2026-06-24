import { createRFQAction } from "@/app/actions/rfqs";
import { RFQFields } from "@/components/rfq-fields";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { fallbackDepartments, fallbackItemServices } from "@/lib/master-data";
import { prisma } from "@/lib/prisma";

export default async function NewRFQPage() {
  await requirePermission("create_rfqs");
  const [departments, itemServices] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.itemServiceCatalog.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create RFQ Request"
        description="Create an RFQ request with item lines, specifications, deadline, delivery details, warranty, and optional attachments."
      />
      <form action={createRFQAction} className="space-y-6">
        <RFQFields
          departments={departments.map((department) => department.name).concat(departments.length ? [] : fallbackDepartments)}
          itemServices={itemServices.map((item) => item.name).concat(itemServices.length ? [] : fallbackItemServices)}
        />
        <div className="flex justify-end">
          <SubmitButton>Create RFQ</SubmitButton>
        </div>
      </form>
    </div>
  );
}

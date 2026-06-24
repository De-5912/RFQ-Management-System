import { createRFQAction } from "@/app/actions/rfqs";
import { RFQFields } from "@/components/rfq-fields";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader } from "@/components/ui";

export default function NewRFQPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prepare RFQ"
        description="Prepare an RFQ with multiple item lines, specifications, deadline, delivery details, and optional attachments."
      />
      <form action={createRFQAction} className="space-y-6">
        <RFQFields />
        <div className="flex justify-end">
          <SubmitButton>Create RFQ</SubmitButton>
        </div>
      </form>
    </div>
  );
}

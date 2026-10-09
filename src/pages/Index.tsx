import { AppShell } from "@/components/app/AppShell";
import { PackingWorkbench } from "@/components/app/PackingWorkbench";
import { ExcelInspector } from "@/components/app/ExcelInspector";
import { ContractPhaseOverview } from "@/components/app/ContractPhaseOverview";

const Index = () => (
  <AppShell>
    <PackingWorkbench />
    <ExcelInspector />
    <details className="mt-8 rounded-2xl border bg-card p-5">
      <summary className="cursor-pointer font-semibold">Bronregister en contractstatus</summary>
      <div className="mt-6"><ContractPhaseOverview /></div>
    </details>
  </AppShell>
);
export default Index;

import { AppShell } from "@/components/app/AppShell";
import { ContractPhaseOverview } from "@/components/app/ContractPhaseOverview";
import { ExcelInspector } from "@/components/app/ExcelInspector";

const Index = () => (
  <AppShell>
    <ExcelInspector />
    <div className="mt-10">
      <ContractPhaseOverview />
    </div>
  </AppShell>
);

export default Index;

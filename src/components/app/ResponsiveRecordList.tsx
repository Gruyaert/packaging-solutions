import type { ReactNode } from "react";

export function ResponsiveRecordList({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  return <div className="min-w-0">{desktop}<div className="md:hidden">{mobile}</div></div>;
}

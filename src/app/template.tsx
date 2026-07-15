import { ViewTransition } from "react";

// Route transition (native View Transitions API): on navigation the browser snapshots the old page
// and the new page; CSS in globals.css holds the OLD snapshot static and slides the NEW one up from
// the bottom to cover it (the jesusinthestreet.org effect). `template` remounts per navigation, so
// the wrapped subtree is what the browser diffs. Nav + PageBackground live in the layout (outside
// this) and are anchored/held via their own view-transition groups.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-up" exit="page-hold">
      {children}
    </ViewTransition>
  );
}

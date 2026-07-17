import RegistryManager from "./client";

/** Re-exported so consumers keep importing these from the page. See checklist/page.tsx. */
export type { RegistryItem, RegistryClaim } from "../demo-types";

export default function RegistryManagerPage () {
  return <RegistryManager />;
}

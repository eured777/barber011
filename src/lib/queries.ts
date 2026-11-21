import { queryOptions } from "@tanstack/react-query";

import { listCatalog } from "./catalog.functions";

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => listCatalog(),
  staleTime: 5 * 60_000,
});

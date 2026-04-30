"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setQueryClient } from "@/lib/socket";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000, // 30s
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
    setQueryClient(qc);
    return qc;
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

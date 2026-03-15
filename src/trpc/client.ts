import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "./root";

export const api = createTRPCReact<AppRouter>();

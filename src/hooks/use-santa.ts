import { useSyncExternalStore } from "react";
import { santaStore } from "@/services/secretSanta";

export const useSanta = () => useSyncExternalStore(santaStore.subscribe, santaStore.get, santaStore.server);

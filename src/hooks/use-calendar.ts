import { useSyncExternalStore } from "react";
import { peopleStore, scheduledStore } from "@/services/calendar";

export const usePeople = () => useSyncExternalStore(peopleStore.subscribe, peopleStore.get, peopleStore.server);
export const useScheduledGifts = () => useSyncExternalStore(scheduledStore.subscribe, scheduledStore.get, scheduledStore.server);

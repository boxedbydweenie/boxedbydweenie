import { useSyncExternalStore } from "react";
import { customMomentsStore, momentsStore, peopleStore, scheduledStore } from "@/services/calendar";

export const usePeople = () =>
  useSyncExternalStore(peopleStore.subscribe, peopleStore.get, peopleStore.server);
export const useScheduledGifts = () =>
  useSyncExternalStore(scheduledStore.subscribe, scheduledStore.get, scheduledStore.server);

export const useMoments = () =>
  useSyncExternalStore(momentsStore.subscribe, momentsStore.get, momentsStore.server);

export const useCustomMoments = () =>
  useSyncExternalStore(
    customMomentsStore.subscribe,
    customMomentsStore.get,
    customMomentsStore.server,
  );

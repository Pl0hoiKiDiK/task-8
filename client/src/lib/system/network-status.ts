import { useSyncExternalStore } from "react";

let requestFailed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setRequestFailed(value: boolean) {
    if (requestFailed === value) return;
    requestFailed = value;
    emit();
}

function subscribe(cb: () => void) {
    listeners.add(cb);
    window.addEventListener("online", cb);
    window.addEventListener("offline", cb);
    return () => {
        listeners.delete(cb);
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
    };
}

export function useNoInternet() {
    const failed = useSyncExternalStore(subscribe, () => requestFailed, () => false);
    const offline = useSyncExternalStore(subscribe, () => !navigator.onLine, () => false);
    return failed || offline;
} 
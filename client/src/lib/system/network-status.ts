import { useSyncExternalStore } from "react";

let requestFailed = false;
let reloadOnRetry = false;
let pending: { promise: Promise<void>; resolve: () => void } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setRequestFailed(value: boolean) {
    if (requestFailed === value) return;
    requestFailed = value;
    emit();
}

export const isRequestFailed = () => requestFailed;

export function reportNonReplayableFailure() {
    // A lost response does not tell us whether the server completed the mutation.
    reloadOnRetry = true;
    setRequestFailed(true);
}

export function waitForRetry(): Promise<true> {
    if (!pending) {
        let resolve!: () => void;
        const promise = new Promise<void>((r) => { resolve = r; });
        pending = { promise, resolve };
        setRequestFailed(true);
    }
    return pending.promise.then(() => true as const);
}

export function retryFailedRequests() {
    const current = pending;
    const shouldReload = reloadOnRetry || !current;
    pending = null;
    reloadOnRetry = false;
    setRequestFailed(false);
    current?.resolve();
    return shouldReload;
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

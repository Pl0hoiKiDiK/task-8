import { ErrorScreen } from "@/components/system/error-screen";

export function UnsupportedDevice() {
    return (
        <div className="hidden max-md:block">
            <ErrorScreen title="Oops">
                This app isn’t supported on mobile devices. <br />
                Please open it on a desktop or tablet to continue.
            </ErrorScreen>
        </div>
    )
}
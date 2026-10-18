"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";

const fieldControl = "h-12 w-full rounded-none border border-[#aeaeae] bg-transparent px-3 text-base font-normal leading-6 tracking-[.15px] text-[var(--text)]";
const actionButton = "h-12 w-40 cursor-default rounded-full text-sm font-medium leading-[24.5px] tracking-[.4px] uppercase max-[600px]:min-w-0";

function ProfileField({ label, value }: { label: string; value: string }) {
  return <label className="block min-w-0">
    <span className="block pl-4 text-xs leading-4 text-[var(--muted)]">{label}</span>
    <input className={fieldControl} value={value} readOnly />
  </label>;
}

function ProfileSelect({ label, value }: { label: string; value: string }) {
  return <div className="block min-w-0">
    <span className="block pl-4 text-xs leading-4 text-[var(--muted)]">{label}</span>
    <div className={`${fieldControl} flex items-center justify-between`} aria-label={`${label}: ${value}`}>
      {value}<AppIcon name="chevron" className="-rotate-90 text-[var(--muted)]" />
    </div>
  </div>;
}

export function MyProfilePreview() {
  const [toastVisible, setToastVisible] = useState(true);

  return <div className="relative">
    {toastVisible && <div className="fixed top-6 right-6 z-30 flex min-h-[100px] w-[360px] justify-between gap-3 rounded-xl border border-[#335d35] bg-[#66bb6a] p-[14px] text-[#335d35] max-[900px]:top-auto max-[900px]:bottom-6 max-[900px]:w-[min(360px,calc(100vw-104px))]" role="status">
      <div><strong className="block text-xl font-medium leading-6 tracking-[.15px]">Success</strong><p className="mt-1.5 mb-0 text-sm leading-[20.02px]">Description text<br />The second row text</p></div>
      <button type="button" className="grid size-6 self-start place-items-center border-0 bg-transparent p-0" aria-label="Dismiss notification" onClick={() => setToastVisible(false)}><AppIcon name="cross-green" /></button>
    </div>}

    <section className="mx-auto mt-3 w-full max-w-[852px]" aria-label="My profile">
      <div className="flex h-[120px] translate-x-5 items-center justify-center gap-[76px] max-[900px]:gap-[38px] max-[600px]:translate-x-0 max-[600px]:gap-5 max-[480px]:h-auto max-[480px]:flex-col max-[480px]:gap-3">
        <div className="grid size-[120px] shrink-0 place-items-center rounded-full bg-[light-dark(#aeaeae,#626262)] text-[40px] leading-[48px] font-normal text-[light-dark(#f5f5f7,#2e2e2e)]" aria-label="Profile avatar placeholder">R</div>
        <div className="w-[280px] max-[600px]:w-auto max-[600px]:min-w-0 max-[480px]:w-full">
          <button type="button" className="flex cursor-default items-center gap-3 border-0 bg-transparent p-0 text-xl leading-8 font-medium tracking-[.15px] whitespace-nowrap text-[var(--text)] max-[600px]:gap-1 max-[600px]:text-base max-[480px]:mx-auto" disabled title="Avatar upload is not connected yet"><AppIcon name="download" className="!size-[35px]" /><span>Upload avatar image</span></button>
          <p className="m-0 text-base leading-7 font-normal tracking-[.15px] whitespace-nowrap text-[var(--text)] opacity-60 max-[600px]:text-xs max-[600px]:whitespace-normal max-[480px]:text-center">PNG, JPG, JPEG or GIF, up to 5 MB</p>
        </div>
      </div>
      <div className="mt-8 text-center"><h1 className="mt-0 mb-2 text-2xl leading-[32.02px] font-normal">Rostislav Harlanov</h1><p className="m-0 text-base leading-6 font-normal tracking-[.15px] text-[var(--muted)]">thorn_pear@icloud.com</p><p className="m-0 text-base leading-6 font-normal tracking-[.15px]">A member since Sun Jan 14 2024</p></div>
      <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-5 max-[900px]:grid-cols-1">
        <ProfileField label="First Name" value="Rostislav" />
        <ProfileField label="Last Name" value="Harlanov" />
        <ProfileSelect label="Department" value="React" />
        <ProfileSelect label="Position" value="Software Engineer" />
        <div className="col-span-full mt-4 flex justify-end gap-6 max-[600px]:gap-3">
          <button type="button" className={`${actionButton} border border-[light-dark(#626262,#e2e2e4)] bg-transparent text-[light-dark(#626262,#e2e2e4)]`} disabled title="Email verification is not connected yet">Verify email</button>
          <button type="button" className={`${actionButton} border-0 bg-[var(--red)] text-[#f5f5f7]`} disabled title="Profile updates are not connected yet">Update</button>
        </div>
      </div>
    </section>
  </div>;
}

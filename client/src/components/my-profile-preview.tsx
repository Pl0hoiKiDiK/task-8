"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block min-w-0 [&>span]:block [&>span]:pl-4 [&>span]:text-xs [&>span]:leading-4 [&>span]:text-[var(--muted)] [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[#aeaeae] [&>input]:bg-transparent [&>input]:px-3 [&>input]:text-base [&>input]:leading-6 [&>input]:tracking-[.15px] [&>input]:text-[var(--text)]">
      <span>{label}</span>
      <input value={value} readOnly />
    </label>
  );
}

function ProfileSelect({ label, value }: { label: string; value: string }) {
  return (
    <div className="block min-w-0 [&>span]:block [&>span]:pl-4 [&>span]:text-xs [&>span]:leading-4 [&>span]:text-[var(--muted)] [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[#aeaeae] [&>input]:bg-transparent [&>input]:px-3 [&>input]:text-base [&>input]:leading-6 [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] ">
      <span>{label}</span>
      <div className="flex h-12 w-full items-center justify-between rounded-none border border-[#aeaeae] bg-transparent px-3 text-base leading-6 tracking-[.15px] text-[var(--text)]" aria-label={`${label}: ${value}`}>
        {value}
        <AppIcon name="chevron" className="rotate-[-90deg] text-[var(--muted)]" />
      </div>
    </div>
  );
}

export function MyProfilePreview() {
  const [toastVisible, setToastVisible] = useState(true);

  return (
    <>
      <div className="relative">
        {toastVisible && (
          <div className="fixed top-6 right-6 z-30 flex min-h-[100px] w-[360px] justify-between gap-3 rounded-xl border border-[#335d35] bg-[#66bb6a] p-3.5 text-[#335d35] max-[900px]:top-auto max-[900px]:bottom-6 max-[900px]:w-[min(360px,calc(100vw_-_104px))] [&_strong]:block [&_strong]:text-xl [&_strong]:font-medium [&_strong]:leading-6 [&_strong]:tracking-[.15px] [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-sm [&_p]:leading-5 [&_p]:tracking-[.15px] [&_button]:grid [&_button]:size-6 [&_button]:place-items-center [&_button]:self-start [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0" role="status">
            <div>
              <strong>Success</strong>
              <p>Description text<br />The second row text</p>
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => setToastVisible(false)}>
              <AppIcon name="cross-green" />
            </button>
          </div>
        )}

        <section className="mx-auto mt-3 w-[min(852px,100%)] max-[900px]:w-full" aria-label="My profile">
          <div className="flex h-[120px] translate-x-5 items-center justify-center gap-[76px] max-[900px]:gap-[38px] max-[600px]:translate-x-0 max-[600px]:gap-5">
            <div className="grid size-[120px] shrink-0 place-items-center rounded-full bg-[var(--avatar-surface)] text-[40px] leading-[48px] text-[var(--avatar-text)]" aria-label="Profile avatar placeholder">R</div>
            <div className="w-[280px] max-[600px]:w-auto max-[600px]:min-w-0 [&>button]:flex [&>button]:items-center [&>button]:gap-3 [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-xl [&>button]:font-medium [&>button]:leading-8 [&>button]:tracking-[.15px] [&>button]:whitespace-nowrap [&>button]:text-[var(--text)] [&>button]:cursor-default max-[600px]:[&>button]:gap-1 max-[600px]:[&>button]:text-base [&>p]:m-0 [&>p]:text-base [&>p]:leading-7 [&>p]:tracking-[.15px] [&>p]:whitespace-nowrap [&>p]:text-[var(--text)] [&>p]:opacity-60 max-[600px]:[&>p]:text-xs max-[600px]:[&>p]:whitespace-normal">
              <button type="button" disabled title="Avatar upload is not connected yet">
                <AppIcon name="download" className="!size-[35px]" />
                <span>Upload avatar image</span>
              </button>
              <p>png, jpg or gif no more than 0.5MB</p>
            </div>
          </div>

          <div className="mt-8 text-center [&>h1]:mt-0 [&>h1]:mb-2 [&>h1]:text-2xl [&>h1]:font-normal [&>h1]:leading-8 [&>p]:m-0 [&>p]:text-base [&>p]:leading-6 [&>p]:tracking-[.15px]">
            <h1>Rostislav Harlanov</h1>
            <p className="text-[var(--muted)]">thorn_pear@icloud.com</p>
            <p>A member since Sun Jan 14 2024</p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-5 max-[900px]:grid-cols-1">
            <ProfileField label="First Name" value="Rostislav" />
            <ProfileField label="Last Name" value="Harlanov" />
            <ProfileSelect label="Department" value="React" />
            <ProfileSelect label="Position" value="Software Engineer" />
            <div className="col-span-full mt-4 flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase [&>button]:cursor-default max-[600px]:[&>button]:min-w-0">
              <button type="button" className="border border-[var(--verify-border)] bg-transparent text-[var(--verify-text)]" disabled title="Email verification is not connected yet">Verify email</button>
              <button type="button" className="border-0 bg-[var(--red)] text-[#f5f5f7]" disabled title="Profile updates are not connected yet">Update</button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

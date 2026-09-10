import React from "react";

const FASTBOTS_CHAT_URL =
  "https://app.fastbots.ai/embed/cmtvuqxvs03xmqf31vlxss031";

export default function ChatSupport() {
  return (
    <main className="h-[calc(100vh-68px)] w-full overflow-hidden bg-[#020817] text-white">
      <div className="flex h-full w-full">

        {/* CHAT WINDOW */}
        <section className="relative min-w-0 flex-1 overflow-hidden border-r border-white/10">
          <iframe
            src={FASTBOTS_CHAT_URL}
            title="Ocean Data AI Chat Support"
            className="h-full w-full border-0"
            allow="microphone; camera; clipboard-write"
          />
        </section>

        {/* DEVELOPERS PANEL */}
        <aside className="h-full w-[320px] shrink-0 overflow-y-auto border-l border-white/10 bg-white/[0.035] px-6 py-8 backdrop-blur-xl">

          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Project Team
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              About the Developers
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Meet the team behind the Ocean Data Visualization System.
            </p>
          </div>

          {/* Developer 1 */}
          <div className="mb-5 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-300">
                AK
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Adnan Khan
                </h2>

                <p className="text-xs text-slate-500">
                  Developer
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Frontend development, 3D visualization and system integration.
            </p>
          </div>

          {/* Developer 2 */}
          <div className="mb-5 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-400/20 bg-blue-400/10 text-sm font-bold text-blue-300">
                AA
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Developer Name
                </h2>

                <p className="text-xs text-slate-500">
                  Developer
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Backend services, API integration and scientific data handling.
            </p>
          </div>

          {/* Developer 3 */}
          <div className="mb-8 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-purple-400/20 bg-purple-400/10 text-sm font-bold text-purple-300">
                DK
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Developer Name
                </h2>

                <p className="text-xs text-slate-500">
                  Developer
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Data processing, visualization research and system testing.
            </p>
          </div>

          {/* Project information */}
          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              About the Project
            </p>

            <h2 className="mt-2 text-sm font-semibold text-white">
              Ocean Data Visualization System
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              An interactive scientific visualization platform for exploring
              ocean model data, Argo observations and other oceanographic
              datasets in a 3D environment.
            </p>
          </div>

        </aside>
      </div>
    </main>
  );
}
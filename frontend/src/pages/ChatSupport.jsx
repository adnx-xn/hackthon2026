import React from "react";

const FASTBOTS_CHAT_URL =
  "https://app.fastbots.ai/embed/cmtvuqxvs03xmqf31vlxss031";

export default function ChatSupport() {
  return (
    <main className="h-[calc(100vh-68px)] w-full overflow-hidden bg-[#020817] text-white pt-[68px]" >
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
              Meet the team behind the Oceanis 3D.
            </p>
          </div>



{/* Developer 1 */}
          <div className="mb-5 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-400/20 bg-blue-400/10 text-sm font-bold text-blue-300">
                AK
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Adnan Khan
                </h2>

                <p className="text-xs text-slate-500">
                  Team Lead & Lead Developer
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
             Overall system architecture, backend/API, scientific data pipeline, 
             NetCDF integration, 3D visualization integration, application state, 
             major frontend development, integration and debugging
            </p>
          </div>
          

          {/* Developer 2 */}
          <div className="mb-5 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-300">
                GA
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Gunjan Aswani
                </h2>

                <p className="text-xs text-slate-500">
                 UI/UX & 3D Visualization Developer
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
            Visualization interface, glassmorphic UI, control panel, status bar, 
            scientific legend, colormap controls, visual presentation of ocean data
            </p>
          </div>

          {/* Developer 3 */}
          <div className="mb-5 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-300">
                SK
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Shaizee Khan
                </h2>

                <p className="text-xs text-slate-500">
                  Frontend & Web Components Developer
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              React pages, reusable web components, frontend structure and interactions
            </p>
          </div>

          

          {/* Developer 4 */}
          <div className="mb-8 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-purple-400/20 bg-purple-400/10 text-sm font-bold text-purple-300">
                TK
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Abu Talha Khan
                </h2>

                <p className="text-xs text-slate-500">
                Documentation & Presentation 
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              SRS, architecture/documentation, requirements organization, 
              PPT preparation, diagrams, presentation structure and supporting material
            </p>
          </div>


           {/* Developer 5 */}
          <div className="mb-8 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-purple-400/20 bg-purple-400/10 text-sm font-bold text-purple-300">
                AC
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Anjali Choudhary
                </h2>

                <p className="text-xs text-slate-500">
                  Research & Domain Analysis
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Problem-statement research, oceanographic/domain research,
               existing-solution analysis, feature research and technical references
            </p>
          </div>

          {/* Developer 6 */}
          <div className="mb-8 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-purple-400/20 bg-purple-400/10 text-sm font-bold text-purple-300">
                BM
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Bilal Mohd
                </h2>

                <p className="text-xs text-slate-500">
                 Testing, Integration & QA Support
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Feature testing, UI/functionality verification,
               bug identification, demo preparation and integration support
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
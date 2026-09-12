import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';

import OceanCanvas from '../components/OceanCanvas/OceanCanvas';
import ControlPanel from '../components/ControlPanel/ControlPanel';
import StatusBar from '../components/StatusBar/StatusBar';

export default function Visualization() {
  const {
    isLoading,
    error
  } = useAppState();

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div
      className="
    relative
    h-screen
    w-full
    overflow-hidden
    bg-red-500
  "
    >

      {/* =====================================================
          LOADING INDICATOR
      ====================================================== */}

      {isLoading && (
        <div
          className="
            absolute
            right-5
            top-5
            z-[1000]
            flex
            items-center
            gap-2
            rounded-full
            border
            border-cyan-400/20
            bg-slate-950/70
            px-4
            py-2
            text-sm
            font-medium
            text-cyan-100
            shadow-lg
            shadow-black/20
            backdrop-blur-xl
          "
        >
          <span
            className="
              h-2
              w-2
              animate-pulse
              rounded-full
              bg-cyan-400
              shadow-[0_0_10px_rgba(34,211,238,0.8)]
            "
          />

          Loading...
        </div>
      )}


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            absolute
            left-0
            right-0
            top-0
            z-[100]
            border-b
            border-red-400/20
            bg-red-950/80
            px-5
            py-3
            text-center
            text-red-200
            shadow-lg
            shadow-black/20
            backdrop-blur-xl
          "
        >
          <p className="m-0 text-sm font-medium">
            Error:{' '}
            {error.message ||
              'An unexpected error occurred.'}
          </p>
        </div>
      )}


      {/* =====================================================
          FULL VISUALIZATION AREA
      ====================================================== */}

      <main
        className="
          absolute
          inset-0
          overflow-hidden
        "
      >

        {/* ===================================================
            FULL WIDTH BACKGROUND
        ==================================================== */}

        <div
          className="
            absolute
            inset-0
            overflow-hidden
            bg-[radial-gradient(circle_at_50%_45%,rgba(14,116,144,0.16),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.08),transparent_35%),#020817]
          "
        >

          {/* Grid */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-40
              [background-image:linear-gradient(rgba(56,189,248,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.025)_1px,transparent_1px)]
              [background-size:50px_50px]
              [mask-image:radial-gradient(circle_at_center,black_15%,transparent_80%)]
            "
          />


          {/* Vignette */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,8,23,0.35)_100%)]
            "
          />


          {/* =================================================
              OCEAN CANVAS

              FULL WIDTH.
              NO RIGHT COLUMN.
              CONTROL PANEL FLOATS ABOVE IT.
          ================================================== */}

          <div className="absolute inset-0 overflow-hidden">
            <div className="h-full w-full">
              <OceanCanvas />
            </div>
          </div>

        </div>


        {/* =====================================================
            FLOATING CONTROL PANEL
        ====================================================== */}

        <div
          className="
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            z-50
            w-[320px]

            max-lg:w-[280px]

            max-md:left-3
            max-md:right-3
            max-md:w-auto
          "
        >

          {/* =================================================
              CONTROL PANEL BAR

              ALWAYS VISIBLE
          ================================================== */}

          <button
            type="button"
            onClick={() => setIsPanelOpen((previous) => !previous)}
            aria-expanded={isPanelOpen}
            aria-label={
              isPanelOpen
                ? 'Collapse control panel'
                : 'Expand control panel'
            }
            className="
              relative
              z-30

              flex
              h-11
              w-full
              items-center
              justify-between

              rounded-xl
              border
              border-cyan-300/30

              bg-white/[0.06]

              px-4

              text-sm
              font-semibold
              tracking-wide
              text-cyan-100

              shadow-lg
              shadow-black/30

              backdrop-blur-xl

              transition-all
              duration-200

              hover:border-cyan-400/45
              hover:bg-white/[0.08]

              focus:outline-none
              focus:ring-1
              focus:ring-cyan-400/40
            "
          >

            <span>
              CONTROL PANEL
            </span>

            <span
              className="
                text-lg
                font-semibold
                leading-none
                text-cyan-400
                transition-transform
                duration-300
              "
            >
              {isPanelOpen ? '↑' : '↓'}
            </span>

          </button>


          {/* =================================================
              CONTROL PANEL CONTENT

              VERTICAL SLIDE ONLY
          ================================================== */}

          <div
            className={`
              relative
              z-20

              overflow-hidden

              rounded-b-xl

              border-x
              border-b
              border-cyan-400/20

              bg-white/[0.04]

              shadow-2xl
              shadow-black/40

              backdrop-blur-xl

              transition-[max-height,opacity,transform]
              duration-300
              ease-out

              ${
                isPanelOpen
                  ? 'max-h-[calc(100vh-140px)] translate-y-0 opacity-100'
                  : 'max-h-0 -translate-y-2 opacity-0 pointer-events-none'
              }
            `}
          >

            {/* Internal scrolling happens here */}
            <div
              className="
                max-h-[calc(100vh-184px)]
                overflow-y-auto

                scrollbar-thin
                scrollbar-track-transparent
                scrollbar-thumb-cyan-400/20
              "
            >

              {/* Existing Control Panel */}
              <div className="p-4 max-lg:p-3">
                <ControlPanel />
              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            STATUS BAR
        ====================================================== */}

        <footer
           className="
    absolute
    bottom-0
    left-0
    right-0
    z-40
    flex
    h-8
    items-center
    border-t
    border-cyan-400/10
    bg-slate-950/90
    text-[0.7rem]
    text-slate-500
    backdrop-blur-xl
  "
        >
          <StatusBar />
        </footer>

      </main>

    </div>
  );
}
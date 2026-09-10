import React, { useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';

import {
  listDatasets,
  getDataset,
  listObservations,
  getInstruments,
  getProfile
} from '../../api/apiClient';

import { useAnimation } from '../../hooks/useAnimation';

import ColormapWidget from '../ColormapWidget/ColormapWidget';
import LayerControls from '../LayerControls/LayerControls';
import ProfilePanel from '../ProfilePanel/ProfilePanel';

import datasetProfiles from '../../config/datasetProfiles.json';

export default function ControlPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const {
    isAnimating,
    startAnimation,
    stopAnimation,
    fetchFrame
  } = useAnimation();

  // =========================================================
  // DATASET LOGIC
  // =========================================================

  const allDatasets = useMemo(() => {
    const backendDatasets = state.availableDatasets || [];

    const backendDatasetIds = new Set(
      backendDatasets.map(d => d.id)
    );

    const combined = [...backendDatasets];

    for (const [id, profile] of Object.entries(datasetProfiles)) {
      if (!backendDatasetIds.has(id)) {
        combined.push({
          id,
          name: profile.displayName || id,
          status: 'planned'
        });
      }
    }

    return combined;
  }, [state.availableDatasets]);

  // =========================================================
  // VIEW STATUS
  // =========================================================

  const viewStatuses = useMemo(() => {
    const vars = state.variables || [];
    const profile = datasetProfiles[state.activeDatasetId];

    if (!profile || !profile.views) return {};

    const statuses = {};

    for (const [viewName, config] of Object.entries(profile.views)) {
      if (config.status === 'planned') {
        statuses[viewName] = {
          isAvailable: false,
          reason: 'Coming soon'
        };

        continue;
      }

      let hasVars = false;

      if (config.renderType === 'surfaceVectors') {
        hasVars =
          vars.includes(config.uVariable) &&
          vars.includes(config.vVariable);
      } else {
        hasVars = vars.includes(config.variable);
      }

      statuses[viewName] = hasVars
        ? {
            isAvailable: true,
            reason: ''
          }
        : {
            isAvailable: false,
            reason: 'Not available'
          };
    }

    return statuses;
  }, [
    state.variables,
    state.activeDatasetId
  ]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    let active = true;

    const fetchInitialData = async () => {
      dispatch({
        type: 'SET_LOADING',
        payload: true
      });

      dispatch({
        type: 'SET_ERROR',
        payload: null
      });

      try {
        const [models, obs] = await Promise.all([
          listDatasets(),
          listObservations().catch(() => [])
        ]);

        if (active) {
          dispatch({
            type: 'SET_AVAILABLE_DATASETS',
            payload: models
          });

          dispatch({
            type: 'SET_AVAILABLE_OBSERVATIONS',
            payload: obs
          });

          if (models.length > 0) {
            handleDatasetSelect(models[0].id);
          }
        }
      } catch (err) {
        if (active) {
          dispatch({
            type: 'SET_ERROR',
            payload: err
          });
        }
      } finally {
        if (active) {
          dispatch({
            type: 'SET_LOADING',
            payload: false
          });
        }
      }
    };

    fetchInitialData();

    return () => {
      active = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // DATASET SELECTION
  // =========================================================

  const handleDatasetSelect = async (datasetId) => {
    dispatch({
      type: 'SET_LOADING',
      payload: true
    });

    dispatch({
      type: 'SET_ERROR',
      payload: null
    });

    try {
      const meta = await getDataset(datasetId);

      dispatch({
        type: 'SET_ACTIVE_DATASET',
        payload: {
          id: datasetId,
          meta: meta,
          variables: meta.variables,
          depths: meta.depth_levels || [],
          times: meta.time_steps || []
        }
      });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err
      });
    } finally {
      dispatch({
        type: 'SET_LOADING',
        payload: false
      });
    }
  };

  // =========================================================
  // ACTIVE VARIABLE
  // =========================================================

  useEffect(() => {
    let targetVar = null;

    if (
      state.primaryView !== 'None' &&
      state.primaryView !== 'Currents' &&
      state.activeDatasetId
    ) {
      const profile =
        datasetProfiles[state.activeDatasetId];

      if (
        profile &&
        profile.views &&
        profile.views[state.primaryView]
      ) {
        targetVar =
          profile.views[state.primaryView].variable;
      }
    }

    dispatch({
      type: 'SET_ACTIVE_VARIABLE',
      payload: targetVar || null
    });
  }, [
    state.primaryView,
    state.activeDatasetId,
    dispatch
  ]);

  // =========================================================
  // FETCH SURFACE DATA
  // =========================================================

  useEffect(() => {
    if (
      !state.activeDatasetId ||
      !state.activeVariable ||
      state.isAnimating
    ) {
      return;
    }

    const status =
      viewStatuses[state.primaryView];

    if (!status || !status.isAvailable) {
      return;
    }

    fetchFrame(state.activeTimeIndex);
  }, [
    state.activeDatasetId,
    state.activeVariable,
    state.primaryView,
    state.isAnimating,
    viewStatuses,
    fetchFrame,
    state.activeTimeIndex
  ]);

  // =========================================================
  // OBSERVATION DATASET
  // =========================================================

  const handleObsDatasetSelect = async (datasetId) => {
    dispatch({
      type: 'SET_ACTIVE_OBS_DATASET',
      payload: datasetId
    });

    if (!datasetId) {
      dispatch({
        type: 'SET_INSTRUMENTS',
        payload: []
      });

      return;
    }

    try {
      const insts =
        await getInstruments(datasetId);

      dispatch({
        type: 'SET_INSTRUMENTS',
        payload: insts
      });
    } catch (err) {
      console.error(
        'Failed to fetch instruments:',
        err
      );
    }
  };

  // =========================================================
  // PROFILE
  // =========================================================

  useEffect(() => {
    let active = true;

    const fetchProf = async () => {
      if (
        !state.activeObsDatasetId ||
        !state.selectedInstrumentId
      ) {
        return;
      }

      try {
        const prof = await getProfile(
          state.activeObsDatasetId,
          state.selectedInstrumentId
        );

        if (active) {
          dispatch({
            type: 'SET_PROFILE_DATA',
            payload: prof
          });
        }
      } catch (err) {
        console.error(
          'Failed to load profile:',
          err
        );
      }
    };

    fetchProf();

    return () => {
      active = false;
    };
  }, [
    state.activeObsDatasetId,
    state.selectedInstrumentId,
    dispatch
  ]);

  // =========================================================
  // DISPLAY CONDITIONS
  // =========================================================

  const profile =
    datasetProfiles[state.activeDatasetId];

  const viewConfig =
    profile?.views?.[state.primaryView];

  const showDataControls =
    viewConfig &&
    viewConfig.renderType === 'scalarSurface' &&
    viewStatuses[state.primaryView]?.isAvailable;

  const showVectorControls =
    state.primaryView === 'Currents' &&
    viewStatuses[state.primaryView]?.isAvailable;

  // =========================================================
  // COMMON STYLES
  // =========================================================

  const selectClass = `
    w-full h-10 px-3
    rounded-lg
    border border-white/10
    bg-slate-950/70
    text-sm font-medium text-slate-100
    outline-none
    transition-all duration-200
    hover:border-cyan-400/30
    hover:bg-slate-900/80
    focus:border-cyan-400/60
    focus:ring-2
    focus:ring-cyan-400/10
    disabled:cursor-not-allowed
    disabled:opacity-50
  `;

  const secondaryButtonClass = `
    flex-1 h-9
    rounded-lg
    border border-cyan-400/15
    bg-slate-900/70
    px-2
    text-xs font-semibold
    text-slate-200
    transition-all duration-200
    hover:border-cyan-400/40
    hover:bg-cyan-400/10
    hover:text-cyan-100
    active:scale-[0.97]
    disabled:cursor-not-allowed
    disabled:opacity-30
  `;

  // =========================================================
  // COLLAPSIBLE HEADER
  // =========================================================

  const SectionHeader = ({
    color = 'cyan',
    title,
    description,
    badge
  }) => (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`
            h-1.5 w-1.5 shrink-0 rounded-full
            bg-${color}-400
            shadow-[0_0_8px_rgba(34,211,238,0.8)]
          `}
        />

        <div className="min-w-0 text-left">
          <h4 className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200">
            {title}
          </h4>

          {description && (
            <p className="m-0 mt-1 text-[10px] font-normal normal-case tracking-normal text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {badge && (
        <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
          {badge}
        </span>
      )}
    </div>
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="flex flex-col gap-3 text-slate-200">

      {/* =====================================================
          PANEL HEADER
      ====================================================== */}

      <div className="relative overflow-hidden rounded-xl border border-cyan-400/10 bg-slate-950/50 px-4 py-3">

        <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-cyan-400 via-cyan-400/40 to-transparent" />

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.08)]">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <path
                d="M4 18h16M5 15l3-4 3 2 4-6 4 4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

          </div>

          <div>
            <h3 className="m-0 text-sm font-bold tracking-wide text-white">
              Visualization Controls
            </h3>

            <p className="m-0 mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Ocean data explorer
            </p>
          </div>

        </div>
      </div>


      {/* =====================================================
          MODEL DATASET
      ====================================================== */}

      <section
        className="border-b border-white/10 pb-3 mb-1 last:border-0 last:mb-0 last:pb-0"
      >
        <div className="flex w-full items-center px-3.5 py-3">
          <SectionHeader
            title="Model Dataset"
            description="Select the ocean model"
          />
        </div>

        <div
          className="
            
            px-3.5 pb-3.5 pt-3
          "
        >

          <select
            value={state.activeDatasetId || ''}
            onChange={(e) =>
              handleDatasetSelect(e.target.value)
            }
            disabled={state.isLoading}
            className={selectClass}
          >

            {allDatasets.length === 0 &&
              !state.isLoading && (
                <option value="">
                  No datasets available
                </option>
              )}

            {allDatasets.length === 0 &&
              state.isLoading && (
                <option value="">
                  Loading datasets...
                </option>
              )}

            {allDatasets.map((d) => {

              const isPlanned =
                d.status === 'planned';

              return (
                <option
                  key={d.id}
                  value={d.id}
                  disabled={isPlanned}
                >
                  {d.name || d.id}{' '}
                  {isPlanned
                    ? '(Coming soon)'
                    : ''}
                </option>
              );
            })}

          </select>

          {!profile &&
            state.activeDatasetId && (
              <div className="mt-2 rounded-lg border border-amber-400/10 bg-amber-400/5 px-3 py-2 text-xs text-amber-300">
                This dataset does not yet have a visualization profile.
              </div>
            )}

        </div>

      </section>


      {/* =====================================================
          VISUALIZATION
      ====================================================== */}

      <section
        className="group border-b border-white/10 pb-3 mb-1 last:border-0 last:mb-0 last:pb-0"
      >
        <div className="flex w-full items-center px-3.5 py-3">
          <SectionHeader
            title="Visualization"
            description="Select the ocean field to display"
          />
        </div>

        <div
          className="
            
            px-3.5 pb-3.5 pt-3
          "
        >

          <select
            value={state.primaryView}
            onChange={(e) =>
              dispatch({
                type: 'SET_PRIMARY_VIEW',
                payload: e.target.value
              })
            }
            disabled={
              !state.activeDatasetId ||
              !profile
            }
            className={selectClass}
          >

            <option value="None">
              None — Earth Only
            </option>

            {profile &&
              profile.views &&
              Object.entries(profile.views).map(
                ([viewName, config]) => {

                  const status =
                    viewStatuses[viewName];

                  if (!status) return null;

                  return (
                    <option
                      key={viewName}
                      value={viewName}
                      disabled={
                        !status.isAvailable
                      }
                    >
                      {config.label}{' '}
                      {!status.isAvailable
                        ? `(${status.reason})`
                        : ''}
                    </option>
                  );
                }
              )}

          </select>

        </div>
      </section>


      {/* =====================================================
          TIME CONTROLS
      ====================================================== */}

      {(showDataControls ||
        showVectorControls) &&
        state.times.length > 1 && (

          <section
            className="group border-b border-white/10 pb-3 mb-1 last:border-0 last:mb-0 last:pb-0"
          >
            <div className="flex w-full items-center px-3.5 py-3">
              <SectionHeader
                title="Time Controls"
                description="Navigate temporal data"
                badge={
                  state.isAnimating
                    ? 'Live'
                    : null
                }
              />
            </div>

            <div
              className="
                
                px-3.5 pb-3.5 pt-3
              "
            >

              {/* Frame navigation */}

              <div className="flex items-center gap-1.5">

                <button
                  onClick={() =>
                    fetchFrame(
                      Math.max(
                        0,
                        state.activeTimeIndex - 1
                      )
                    )
                  }
                  disabled={
                    state.activeTimeIndex === 0 ||
                    state.isAnimating
                  }
                  className={secondaryButtonClass}
                >
                  ◀
                  <span className="ml-1 hidden sm:inline">
                    Prev
                  </span>
                </button>


                <button
                  onClick={startAnimation}
                  disabled={state.isAnimating}
                  className={`
                    ${secondaryButtonClass}
                    ${
                      state.isAnimating
                        ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-300'
                        : ''
                    }
                  `}
                >
                  ▶
                  <span className="ml-1 hidden sm:inline">
                    Dynamic
                  </span>
                </button>


                <button
                  onClick={stopAnimation}
                  disabled={!state.isAnimating}
                  className={`
                    ${secondaryButtonClass}
                    ${
                      !state.isAnimating
                        ? 'border-slate-600/30 bg-slate-800/50 text-slate-500'
                        : ''
                    }
                  `}
                >
                  ■
                  <span className="ml-1 hidden sm:inline">
                    Static
                  </span>
                </button>


                <button
                  onClick={() =>
                    fetchFrame(
                      Math.min(
                        state.times.length - 1,
                        state.activeTimeIndex + 1
                      )
                    )
                  }
                  disabled={
                    state.activeTimeIndex ===
                      state.times.length - 1 ||
                    state.isAnimating
                  }
                  className={secondaryButtonClass}
                >
                  <span className="mr-1 hidden sm:inline">
                    Next
                  </span>
                  ▶
                </button>

              </div>


              {/* Frame information */}

              <div className="mt-4 grid grid-cols-2 gap-2">

                <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">

                  <p className="m-0 text-[9px] uppercase tracking-wider text-slate-500">
                    Frame
                  </p>

                  <p className="m-0 mt-0.5 text-xs font-semibold text-slate-200">
                    {state.activeTimeIndex + 1}
                    <span className="text-slate-500">
                      {' '} / {state.times.length}
                    </span>
                  </p>

                </div>


                <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">

                  <p className="m-0 text-[9px] uppercase tracking-wider text-slate-500">
                    Current Time
                  </p>

                  <p className="m-0 mt-0.5 truncate text-xs font-semibold text-cyan-200">
                    {state.times[state.activeTimeIndex]}
                  </p>

                </div>

              </div>


              {/* Playback speed */}

              <div className="mt-4 rounded-lg border border-white/5 bg-black/20 px-3 py-3">

                <div className="mb-2 flex items-center justify-between">

                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Playback Speed
                  </span>

                  <span className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-xs font-bold text-cyan-300">
                    {state.animationSpeed || 1}x
                  </span>

                </div>

                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={
                    state.animationSpeed || 1
                  }
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_ANIMATION_SPEED',
                      payload: parseFloat(
                        e.target.value
                      )
                    })
                  }
                  className="
                    h-1
                    w-full
                    cursor-pointer
                    appearance-none
                    rounded-full
                    bg-gradient-to-r
                    from-cyan-400/70
                    to-blue-600/50
                    accent-cyan-400
                  "
                />

                <div className="mt-1 flex justify-between text-[9px] text-slate-600">
                  <span>0.5x</span>
                  <span>5x</span>
                </div>

              </div>

            </div>

          </section>
        )}


      {/* =====================================================
          DATA APPEARANCE
      ====================================================== */}

      {showDataControls && (

        <section
          className="group border-b border-white/10 pb-3 mb-1 last:border-0 last:mb-0 last:pb-0"
        >
          <div className="flex w-full items-center px-3.5 py-3">
            <SectionHeader
              title="Data Appearance"
              description="Color mapping and field appearance"
            />
          </div>

          <div
            className="
              
              px-3.5 pb-3.5 pt-3
            "
          >
            <ColormapWidget />
          </div>

        </section>

      )}


      {/* =====================================================
          OBSERVATIONS
      ====================================================== */}

      <section
        className="group border-b border-white/10 pb-3 mb-1 last:border-0 last:mb-0 last:pb-0"
      >
        <div className="flex w-full items-center px-3.5 py-3">
          <SectionHeader
            title="Observations"
            description="Argo / instrument data"
          />
        </div>

        <div
          className="
            
            px-3.5 pb-3.5 pt-3
          "
        >

          <select
            value={
              state.activeObsDatasetId || ''
            }
            onChange={(e) =>
              handleObsDatasetSelect(
                e.target.value
              )
            }
            className={selectClass}
          >

            <option value="">
              None selected
            </option>

            {state.availableObservations.map(
              (d) => (
                <option
                  key={d.id}
                  value={d.id}
                >
                  {d.name || d.id}
                </option>
              )
            )}

          </select>

        </div>
      </section>


      {/* =====================================================
          INSTRUMENT PROFILE
      ====================================================== */}

      <section
        className="group border-b border-white/10 pb-3 mb-1 last:border-0 last:mb-0 last:pb-0"
      >
        <div className="flex w-full items-center px-3.5 py-3">
          <SectionHeader
            title="Instrument Profile"
            description="Depth and observation profile"
          />
        </div>

        <div
          className="
            
            px-3.5 pb-3.5 pt-3
          "
        >
          <ProfilePanel />
        </div>
      </section>


      {/* =====================================================
          LAYERS
      ====================================================== */}

      <section
        className="group border-b border-white/10 pb-3 mb-1 last:border-0 last:mb-0 last:pb-0"
      >
        <div className="flex w-full items-center px-3.5 py-3">
          <SectionHeader
            title="Layers"
            description="Visualization overlays"
          />
        </div>

        <div
          className="
            
            px-3.5 pb-3.5 pt-3
          "
        >
          <LayerControls />
        </div>
      </section>

    </div>
  );
}
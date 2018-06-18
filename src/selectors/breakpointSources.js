/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { sortBy, uniq } from "lodash";
import { createSelector } from "reselect";
import { getSources, getSourceInSources, getBreakpoints } from "../selectors";
import { getFilenameFromURL } from "../utils/source";
import type { SourceRecord, Breakpoint } from "../types";
import type { SourcesMap, BreakpointsMap } from "../reducers/types";

export type BreakpointSources = Array<{
  source: SourceRecord,
  breakpoints: Breakpoint[]
}>;

function getBreakpointsForSource(
  source: SourceRecord,
  breakpoints: BreakpointsMap
): Breakpoint[] {
  const bpList = breakpoints.valueSeq();

  return bpList
    .filter(
      bp =>
        bp.location.sourceId == source.id &&
        !bp.hidden &&
        (bp.text || bp.condition)
    )
    .sortBy(bp => bp.location.line)
    .toJS();
}

function findBreakpointSources(
  sources: SourcesMap,
  breakpoints: BreakpointsMap
): BreakpointSources {
  const sourceIds = uniq(
    breakpoints
      .valueSeq()
      .filter(bp => !bp.hidden)
      .map(bp => bp.location.sourceId)
      .toJS()
  );

  const breakpointSources = sourceIds
    .map(id => getSourceInSources(sources, id))
    .filter(source => source && !source.isBlackBoxed);

  return sortBy(breakpointSources, (source: SourceRecord) =>
    getFilenameFromURL(source.url)
  );
}

function _getBreakpointSources(
  breakpoints: BreakpointsMap,
  sources: SourcesMap,
  selectedSource: SourceRecord
): BreakpointSources {
  const breakpointSources = findBreakpointSources(sources, breakpoints);
  return breakpointSources.map(source => ({
    source,
    breakpoints: getBreakpointsForSource(source, breakpoints)
  }));
}

export const getBreakpointSources = createSelector(
  getBreakpoints,
  getSources,
  _getBreakpointSources
);

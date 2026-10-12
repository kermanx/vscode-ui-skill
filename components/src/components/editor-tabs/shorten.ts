// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
const ellipsis = '\u2026';
const unc = '\\\\';
const urlSchemaRegexp = /^[^:/\\?#]+?:\/\//;
const home = '~';
export function shorten(
  paths: string[],
  defaultPathSeparator: string = '/',
): string[] {
  const shortenedPaths: string[] = new Array(paths.length);

  // for every path
  let match = false;
  for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
    let pathSeparator = defaultPathSeparator;
    const originalPath = paths[pathIndex];

    if (originalPath === '') {
      shortenedPaths[pathIndex] = `.${pathSeparator}`;
      continue;
    }

    if (!originalPath) {
      shortenedPaths[pathIndex] = originalPath;
      continue;
    }

    match = true;

    // trim for now and concatenate unc path (e.g. \\network) or root path (/etc, ~/etc) later
    let prefix = '';
    let trimmedPath = originalPath;
    if (urlSchemaRegexp.test(trimmedPath)) {
      prefix = trimmedPath.substr(0, trimmedPath.indexOf('//') + 2);
      trimmedPath = trimmedPath.substr(trimmedPath.indexOf('//') + 2);
      pathSeparator = '/';
    } else if (trimmedPath.indexOf(unc) === 0) {
      prefix = trimmedPath.substr(0, trimmedPath.indexOf(unc) + unc.length);
      trimmedPath = trimmedPath.substr(trimmedPath.indexOf(unc) + unc.length);
    } else if (trimmedPath.indexOf(pathSeparator) === 0) {
      prefix = trimmedPath.substr(
        0,
        trimmedPath.indexOf(pathSeparator) + pathSeparator.length,
      );
      trimmedPath = trimmedPath.substr(
        trimmedPath.indexOf(pathSeparator) + pathSeparator.length,
      );
    } else if (trimmedPath.indexOf(home) === 0) {
      prefix = trimmedPath.substr(0, trimmedPath.indexOf(home) + home.length);
      trimmedPath = trimmedPath.substr(trimmedPath.indexOf(home) + home.length);
    }

    // pick the first shortest subpath found
    const segments: string[] = trimmedPath.split(pathSeparator);
    for (
      let subpathLength = 1;
      match && subpathLength <= segments.length;
      subpathLength++
    ) {
      for (
        let start = segments.length - subpathLength;
        match && start >= 0;
        start--
      ) {
        match = false;
        let subpath = segments
          .slice(start, start + subpathLength)
          .join(pathSeparator);

        // that is unique to any other path
        for (
          let otherPathIndex = 0;
          !match && otherPathIndex < paths.length;
          otherPathIndex++
        ) {
          // suffix subpath treated specially as we consider no match 'x' and 'x/...'
          if (
            otherPathIndex !== pathIndex &&
            paths[otherPathIndex] &&
            paths[otherPathIndex].indexOf(subpath) > -1
          ) {
            const isSubpathEnding: boolean =
              start + subpathLength === segments.length;

            // Adding separator as prefix for subpath, such that 'endsWith(src, trgt)' considers subpath as directory name instead of plain string.
            // prefix is not added when either subpath is root directory or path[otherPathIndex] does not have multiple directories.
            const subpathWithSep: string =
              start > 0 && paths[otherPathIndex].indexOf(pathSeparator) > -1
                ? pathSeparator + subpath
                : subpath;
            const isOtherPathEnding: boolean =
              paths[otherPathIndex].endsWith(subpathWithSep);

            match = !isSubpathEnding || isOtherPathEnding;
          }
        }

        // found unique subpath
        if (!match) {
          let result = '';

          // preserve disk drive or root prefix
          if (segments[0].endsWith(':') || prefix !== '') {
            if (start === 1) {
              // extend subpath to include disk drive prefix
              start = 0;
              subpathLength++;
              subpath = segments[0] + pathSeparator + subpath;
            }

            if (start > 0) {
              result = segments[0] + pathSeparator;
            }

            result = prefix + result;
          }

          // add ellipsis at the beginning if needed
          if (start > 0) {
            result = result + ellipsis + pathSeparator;
          }

          result = result + subpath;

          // add ellipsis at the end if needed
          if (start + subpathLength < segments.length) {
            // If the last segment is empty, preserve the trailing slash.
            if (
              start + subpathLength === segments.length - 1 &&
              segments[segments.length - 1] === ''
            ) {
              result = result + pathSeparator;
            } else {
              result = result + pathSeparator + ellipsis;
            }
          }

          shortenedPaths[pathIndex] = result;
        }
      }
    }

    if (match) {
      shortenedPaths[pathIndex] = originalPath; // use original path if no unique subpaths found
    }
  }

  return shortenedPaths;
}

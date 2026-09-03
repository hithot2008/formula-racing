// Legacy routes keep their original keys. Revised routes use separate records.
export function trackRecordKey(track, difficulty, mode) {
  const version = track.layoutVersion || 1;
  return `${track.id}:${difficulty}:${mode}${version > 1 ? ':v' + version : ''}`;
}
export function currentMedalCount(records, tracks) {
  return tracks.reduce(
    (count, track) =>
      count +
      ['easy', 'advanced', 'pro'].reduce(
        (n, difficulty) =>
          n +
          ['race', 'time', 'academy'].filter(
            (mode) => records[trackRecordKey(track, difficulty, mode)]?.medal > 0,
          ).length,
        0,
      ),
    0,
  );
}

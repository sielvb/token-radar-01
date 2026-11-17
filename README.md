# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/sielvb/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/sielvb/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token launch radar ranking 198 pre-token protocols by implied value, with a farm plan for each.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

Node 22, standard library only, no network. Reads the sealed snapshot, writes the ranked board to `out/board.json`, the dashboard data to `out/data.js`, and copies `dashboard/` and `screenshots/` plus `out/dossier.json` into the output directory.

## How it works

- **Value model (radar-3):** implied value follows a log-log power law fitted to the snapshot's own 128 live-token protocols with a positive market cap: `implied = 1058.456 x TVL^0.522`. Five-fold cross-validation gives a median absolute log error of 1.182, against 1.656 for the starter's fixed 0.25 multiple. Category medians, 7-day growth, age and chain count were tested the same way and rejected: every one of them made out-of-sample error worse.
- **What counts as pre-token:** the house rule from the snapshot's README, applied to every board row, not just the watchlist. A wrapped, staked or bridged product of a token that already trades is not a protocol still waiting on a launch, so WBTC, staked ETH and bridges are out of the ranking entirely.
- **Farm economics:** every row carries capital, gas, hold time, a farm score (implied dollars per gas-dollar-day) and a verdict, plus the net return: the implied value minus the gas, and that net spread over the hold in dollars per hour. Verdicts are tertiles of the board's own scores: FARM, THIN, SKIP, 66 rows each. No invented farmer counts. The net figures are labelled with the assumption that the launch pays the full implied value; a real distribution usually pays a fraction of it.
- **Families and the live view:** the board is grouped by category into 33 families, each with its size, median implied value and best row (presentation only, the model never uses categories). The live-token view shows all 128 protocols with a positive market cap: the whole calibration set, not a top slice.
- **Calibration, on the page:** the dashboard shows the fit and the blind-test errors above the fold, with a self-check badge that recomputes the model in the page and verifies the board is sorted.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9vdp13tv&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>

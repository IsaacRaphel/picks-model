# Sports Forecasting Model (Beta)

Live site: https://isaacraphel.github.io/picks-model/ · Methodology: https://isaacraphel.github.io/picks-model/method.html

An economics research project by Isaac Raphel (Indiana University) testing how close a disciplined, rules-based forecasting process can get to sports betting markets, and where those markets are weakest. Sports betting markets are highly efficient, so the expected answer is that they are hard to beat; the project measures the gap honestly.

## How it works
- **Daily pipeline:** scheduled AI agent jobs (Claude) collect prices from DraftKings, FanDuel and Kalshi, public betting splits (Action Network), injuries, rest and public ratings (Torvik, SP+/FPI, NBA net rating) for up to 60 NFL, NBA and power-conference college games, then build forecasts from a rating baseline adjusted for game context.
- **Grading:** every game is graded overnight against the spread, with closing line value, calibration and simple-strategy control groups (always favorite / underdog / home / ratings only).
- **Lessons:** repeated mistakes become hypotheses. A hypothesis is kept only with 50+ picks, a one-sided binomial test beating the 52.4% break-even that survives a Benjamini-Hochberg correction (10% FDR), and non-negative closing line value.
- **Structured features** are logged for every game so a model can be fit at the end of each phase and tested out of sample.

## Repo
- `index.html` overview · `model.html` live forecasts · `analysis.html` charts · `notes.html` monthly write-ups · `method.html` methodology
- `data/` datasets synced automatically several times a day (`games.json`, `picks.json`, `reviews.json`, `lessons.json`, `notes.json`)
- `tools/public_filter.py` strips non-research content (parlays, simulated dollar results) before publishing

Research project only. No real money is wagered and nothing here is betting advice. If gambling is a problem for you or someone you know, call or text 1-800-MY-RESET.

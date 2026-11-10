# Sports Forecasting Model

Live site: https://isaacraphel.github.io/picks-model/

An economics research project by Isaac Raphel (Indiana University) testing how efficiently sports markets price games. A daily pipeline collects market prices from DraftKings, FanDuel and Kalshi along with injury, rest and line-movement data, produces independent spread and win-probability forecasts, grades every result overnight, and tracks closing line value.

Repeated errors become testable hypotheses ("lessons") that are tagged to the forecasts they change and kept or dropped against the 52.4% break-even rate once they reach a minimum sample.

- `index.html`: project overview
- `model.html`: live forecasts, results, lessons and reviews
- `data/`: the model's datasets, synced automatically several times a day

Research project only. Results are tracked with simulated stakes.

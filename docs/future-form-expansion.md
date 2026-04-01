# Future Form Expansion

## Intent
- Keep a running list of “formKey” follow-ups that are intentionally *not* in the current MVP payloads.
- Mirror the backlog entries from `docs/todo-backlog.md` so future work can grab a precise scope reference without hunting down the long list.

## Candidates Pending Review
- **버드렉스 rider** – rider-specific signature moves such as `Blizzard Lance` and `Astral Barrage` still need a clear move-query strategy; the current selector would need additional validation rules.
- **지가르데** – multiple states (`10%`, `50%`, `Power Construct`, `Complete`, plus `Mega`-style data) mix battle-state logic with selector choices and are left in follow-up to avoid modeling fragmentary forms.
- **랜드로스/토네로스/볼트로스 영물** – these Gen 5 critical forms could reuse `formKey` once we resolve whether selector-only exposure suffices or move overrides are required.
- **후파** – conflicted between its story and battle modes; determine whether a passive form selector makes sense or if it belongs in a separate gimmick control.
- **마기아나 특수 폼** – currently only one form, but future special-form learnset overrides should be handled in the move API before exposing another form.

## Notes
- Refer back to `docs/todo-backlog.md` under **5. 탐색성 확장 후보** for the original reasoning and checkpoints that led to leaving these forms on the backlog.

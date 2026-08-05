# Resume source

## Two documents

| File | What it is |
|---|---|
| `main.tex` | **Targeted one-pager**, originally tailored for Morph Labs (AI/ML Engineer). Margins are tuned to fit one page — keep it lean. Tailor a *copy* per application rather than growing this one. |
| `main_full.tex` | **General / research-track resume**, two pages. Carries the full record: Publications, the SEGAL Lab role, and the SLR, EMBR and TAST projects. |

Both carry the same corrected facts.

LaTeX source for `assets/Al-Shifan-Resume-2026.pdf`, which the site links as the CV.
Previously the source lived only in a zip in Downloads; it is versioned here so the
published PDF and its source cannot drift apart again.

## Building

The document needs `fontawesome5` and `roboto`. Overleaf builds it as-is. Locally,
`tectonic main.tex` currently aborts while loading the FontAwesome OTF (this happens on the
unedited original too, so it is a toolchain issue rather than a document one) — use a full
TeX Live / MacTeX install with `xelatex`, or Overleaf.

**After rebuilding, replace `../assets/Al-Shifan-Resume-2026.pdf`.** The site serves that PDF
directly, so edits here are not public until it is regenerated.

## Corrections applied 2026-08-05

- **RIDGE venue.** Was *"targeting the RLVG 2026 workshop"*. It is **accepted at IEEE Conference
  on Games (CoG) 2026, Madrid**. Verified against the vault and the paid conference registration.
- **Persona count.** Was *"three persona objectives (Explorer, Survivor, Craftsman)"* and *"three
  persona-specific value heads"*. The RIDGE repo README specifies **four** — Explorer, Survivor,
  Craftsman, **Warrior** — with four value heads and weights normalised to a simplex over four.
- **Added a Publications section.** An accepted IEEE paper was previously only a bullet under
  Projects, which undersells it on a PhD-track resume.

## Open question — the header email does not match itself

`main.tex` line 95 links `mailto:mohamedshifan@ontariotechu.net` but displays
`mohamealmusqi.mohamedshifan@ontariotechu.net`. Two different addresses in one field: a recruiter
who clicks gets one, a recruiter who copies the text gets the other, and if the `mailto` is not a
real alias the click silently fails. Not changed here because it is not obvious which is
authoritative — AL to confirm, then make both sides identical.

## Still to do

- Rebuild **both** PDFs on Overleaf; only the one-pager is currently published as
  `assets/Al-Shifan-Resume-2026.pdf`.
- The RIDGE repo's GitHub *description* (the one-line blurb on the repo card and the pinned tile)
  still says three personas. Same error, third surface.
- ~~Resume omits the SLR mapping study, EMBR, TAST, and the SEGAL Lab affiliation by name.~~
  Added to `main_full.tex` on 2026-08-05. Deliberately **not** added to the one-pager, which would
  spill to a second page and lose its purpose.

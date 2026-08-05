# Resume source

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

## Still to do

- The RIDGE repo's GitHub *description* (the one-line blurb on the repo card and the pinned tile)
  still says three personas. Same error, third surface.
- Resume omits the SLR mapping study, EMBR, TAST, and the SEGAL Lab affiliation by name.

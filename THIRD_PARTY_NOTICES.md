# Third-Party Software Notices

FIREKEEPER Core includes third-party software. Each third-party component remains subject to its own license terms and copyright notices. The FIREKEEPER Core Business Source License 1.1 does not replace or override those third-party licenses.

This file is a compliance inventory derived from the repository's `package-lock.json`. It is not a substitute for the complete license text distributed by each dependency.

## Dependency license inventory

At the time of this inventory, the npm lockfile contains 750 package entries:

- MIT: 541
- Apache-2.0: 116
- ISC: 31
- BSD-3-Clause: 13
- BSD-2-Clause: 12
- MPL-2.0: 12
- LGPL-3.0-or-later: 10
- BlueOak-1.0.0: 6
- Apache-2.0 AND LGPL-3.0-or-later: 3
- Apache-2.0 AND LGPL-3.0-or-later AND MIT: 1
- MIT OR GPL-3.0-or-later: 1
- CC-BY-4.0: 1
- MIT AND Zlib: 1
- 0BSD: 1
- Unknown/unclassified metadata: 1

## Components requiring explicit compliance review

### sharp / libvips binary packages
The optional platform packages under `@img/sharp-libvips-*` report LGPL-3.0-or-later. Several `@img/sharp-*` binary packages report combined Apache-2.0, LGPL-3.0-or-later, and/or MIT licensing. Distribution must preserve the applicable notices and comply with the relevant LGPL terms.

### lightningcss
`lightningcss` and its platform binary packages report MPL-2.0. Distribution must preserve MPL notices and comply with MPL requirements for covered files.

### jszip
`jszip@3.10.2` reports `MIT OR GPL-3.0-or-later`. FIREKEEPER uses the permissive MIT licensing option; the GPL alternative is not required merely because it is offered as an alternative license.

### limiter
`limiter@1.1.5` has no license value in the current npm lockfile metadata. The upstream `jhurliman/node-rate-limiter` project currently declares MIT licensing. Because the historical 1.1.5 lockfile entry does not itself carry a license field, release automation treats missing license metadata as a review condition rather than silently assuming a license.

## Distribution rule

Do not remove third-party copyright, attribution, license, or proprietary notices from source distributions, generated bundles, mobile artifacts, or other redistributed materials.

Generated bundles may contain embedded third-party notices. Those notices are intentionally retained.

## Project license

FIREKEEPER Core itself is licensed separately under the repository `LICENSE` file. Copyright in FIREKEEPER Core is held by Kriangkrai Kamphaen (เกรียงไกร คำแผ่น). Third-party components are not relicensed under the FIREKEEPER Core license.

## Maintenance

Regenerate and review this inventory whenever `package-lock.json` changes materially. A machine-readable SBOM should be generated for release artifacts as part of the release process.

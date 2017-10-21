# binge - version-less JavaScript module management for monorepos

the problem: managing modules with consistent dependencies in monorepo
manage build scripts with as little duplication as possible
avoid publishing/versioning overhead (Lerna!?)

Binge does this ;-)
Encourages modularization by making it easy to create new modules (new features, refactorings)

## How it works
Not sure if we need this, but we could explain the main concept/architecture briefly here

## Getting started with binge
Install binge by running ``npm install binge``.

What then?

We should sketch out a minimal example project with two packages and a small dependency set, I'd suggest

## Reference documentation
Based on:
```
Usage
  $ binge [command]

Graph Commands:
  bootstrap  install, build and deploy the local-package tree
  check      check the local-package tree for package-lock.json sync
  copy       copy a file into each of node of the local-package tree
  harmony    check the local-package tree for dependency consistency
  install    (?[moreNpmArgs, ...]) installs the local-package tree. If the
             root node execution produced a dependency delta (with piped
             npm args), changes are applied to every reachable node that
             has a dependency intersection.
             Example: binge install react --save
  graph      prints the package tree, and the layer topology
  nuke       removes node_modules in the local-package tree
  trace      (targetBranch, ?outputFolder) compares the current branch with
             the target branch. Transively traces changes, and outputs a
             list of affected local-packages
             Example: binge trace develop
  watch      build and watch the local-package tree

Hoisted NPM Commands:
  install
  list
  ls
  prune
  uninstall
  update
Hoisted NPM Commands follow these steps:
  1- Hoist package.json
  2- Call NPM
  3- Unhoist package.json, applying the resulting dependency delta
  4- Command arguments are piped to npm. Example binge uninstall react
```

## Binge vs. Lerna
Lerna: versioning!
Binge: No publishing overhead, no symlinks (what exactly is the problem with symlinks?)
Subset of Lerna possible: but symlinks

Lerna: bump one module, have to update all referencing modules

Lerna watch and build too messy

Tooling to ensure: all packages use the same version; Lerna can't do this

Each package should interact with each other through clearly defined interfaces/APIs

Dummy: from there pointer to all entry points; run "binge watch" there.

Doesn't really make sense to have module versioning in monorepos

## Contribution
Contributions are welcome.
Make sure you run the tests before creating a pull request and add test cases that cover the contributed code.

## Authors

* Cristóvão Honorato - [@CristovaoHonorato](https://github.com/CristovaoHonorato)

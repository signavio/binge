# binge - version-less JavaScript package management for monorepos
Binge is a version-less JavaScript package management tool for monolithic repositories (*monorepos*).

It helps you to:
* encourage modularization for a clearer separation of concerns,
* enforces dependency version consistency across different local packages,
* improves the developer experience and reduces the build file size by enforcing there is only one version of a dependency across all packages in the repository.

To install binge run ``yarn global binge``.

[//]: # (To learn more about *why exactly* you should consider using binge, read our [announcement blog post]https://tech.signavio.com/2017/package-management-binge.)

## Getting started with binge
Install binge by running ``yarn global binge``.

**Note**: binge requires [Yarn](https://yarnpkg.com/lang/en/) and doesn't support the npm command line tool.

### Repository structure
Structure your repository as follows:

```
…
- client
    - package1
        - …
        - src
        - .babelrc
        - .npmignore
        - package.json
        - yarn.lock
    - …
    - packageN
        - …
    - root
        .bingerc
        example.js
        package.json    
…
```

Your client folder needs to contain a root-level folder for each local package, plus one additional folder that contains the global entry point to your app.
In our example  (see: [./examples/bootstrap](./examples/bootstrap)), we name this folder ``root``.

**Note:** binge supports nested local packages. However, we recommend you don't nest your packages to reduce complexity and allow a clearer overview.

The local packages have the same structure as ordinary npm packages, except that they are **not versioned**. 

The ``package.json`` in the root folder lists the local packages as dependencies:

```json
{
  "name": "root",
  "dependencies": {
      "i-filter-stuff": "file:../i-filter-stuff",
      "i-print-stuff": "file:../i-print-stuff"
  },
  …
}
```

The ``.bingerc`` file specifies the binge version that your project relies on as a **global dependency**:

```json
{
  "version": "^4.1.0"
}
```


* build with binge bootstrap

* watch with binge watch

## Reference documentation
This section lists and explains all binge commands.
We illustrate the commands with minimal example apps you find at [./examples](./examples).

* ``bootstrap``:

    Installs, builds and deploys the local package tree. DEPLOY: copy local node modules and bin links.
    For example, running ``binge bootstrap`` in [./examples/bootstrap/root](./examples/bootstrap/root):
    * installs the dependencies of the three local packages ``i-filter-stuff``, ``i-print-stuff`` and ``i-prodivde-colors``,
    * builds the three local packages,
    * deploys the local packages and their dependencies to the ``node_modules`` folder of the ``root`` directory. At that, binge moves shared dependencies up the dependency tree to avoid unnecessary duplication of code.

    **Note:** ``bootstrap`` also runs ``check`` (see below) and fails if the ``check`` fails.

* ``check``:

    Checks if the [yarn-lock.json](https://yarnpkg.com/lang/en/docs/yarn-lock/) and ``package.json`` files in the local package tree are in sync with. This helps ensure your dependency versions are consistent across machines.
    For example, running ``binge check`` in [./examples/check-sync/root](./examples/check-sync/root) returns:

    ```
    Failure
    Lock out of sync
    Node name: root
    Node path: …/binge/examples/check-sync/root
    'angular' wanted 1.6.5 but no match found on the lock file
    ```

*  ``copy``:

    Copies a file into each node of the local package tree.
    This is helpful to manage configuration file or credentials when preparing production releases.
    For example, when creating the file ``.cred`` in [./examples/bootstrap](./examples/bootstrap), navigating to ``root`` and running ``binge copy ../.cred``, binge copies the file ``.cred`` to the following directories:
    * ``i-filter-stuff``,
    * ``i-print-stuff``,
    * ``i-provide-colors``,
    * ``root``.

* ``graph``:

    Prints the package tree, and the layer topology.


    ```
    [Binge] Christmas Tree

    root
    ├── i-filter-stuff
    └─┬ i-print-stuff
      └── i-provide-colors

    Layers:
    1 root
    2 i-print-stuff
        3 i-filter-stuff
        3 i-provide-colors
    ```

    WHAT ACCOUNTS FOR THE DIFFERENCES IN THE TWO GRAPHS? Christmas tree: raw tree. Layers: nodes build order

* ``harmony``:

    Checks the local package tree for dependency consistency.
    For example, ``binge harmony`` returns an *error* when two local packages contain incompatible version specifications of the same dependency…
    ```
    ------------------
    |    q failed    |
    ------------------
    module-a ->  1.5.0
    module-b ->  1.5.0
    module-c ->  1.5.1
    …
    Error    q     failed -> module-a@1.5.0, module-b@1.5.0, module-c@1.5.1
    ```
    …and a *warning* when version specifications are *inconsistent*, but not *incompatible*:
    ```
    -------------------
    |   fbjs 0.8.14   |
    -------------------
    module-a ->  0.8.14
    module-b ->  0.8.14
    module-c -> ^0.8.14
    …
    Warning  fbjs  0.8.14 -> module-a@0.8.14, module-b@0.8.14, module-c@^0.8.14
    ```

* ``install``:

    Installs all reachable nodes in the local package tree to the ``node_modules`` folder of the global entry point. For example, running ``binge install`` in [./examples/bootstrap/root](./examples/bootstrap/root) installs the dependencies of the three local packages ``module-a``, ``module-b`` and ``module-c`` into the corresponding local ``node_modules`` folders, as well as into the ``node_modules`` folder of the global entry point ``root``.

* ``nuke``:

    Removes the ``node_modules`` folders in the local package tree.
    For example, running ``binge nuke`` in [./examples/bootstrap/root](./examples/bootstrap/root) deletes ``node_modules`` folders in the following directories:
    * ``i-filter-stuff``,
    * ``i-print-stuff``,
    * ``i-provide-colors``,
    * ``root``.

    ``binge nuke fileName`` removes the specified file from all local packages and the root package, analogous to ``binge copy``.

* ``trace targetBranch, ?outputFolder``:

    Compares the current branch with the target branch, transitively finding changed files.
    Outputs the list of affected local packages.
    ``trace`` helps optimizing the test set your CI server runs when checking a merge request by considering both the packages that changed *and* the packages that depend on the changed packages.

* ``watch``:

    Builds and watches the local package tree.

    WHY DOESN'T THE `bootstrap` EXAMPLE CONTAIN A WATCHABLE PACKAGE?

Similarly to [Lerna](https://github.com/lerna/lerna/blob/master/doc/hoist.md), binge *hoists* dependencies.
This means binge moves shared dependencies up the dependency tree to avoid unnecessary duplication of code.
To support proper hoisting, run the following Yarn commands via binge (for example: run ``binge add left-pad):

* ``add``,
* ``list``,
* ``outdated``,
* ``remove``,
* ``upgrade``.

Hoisted Yarn Commands follow these steps:

1. Hoist ``package.json``.
2. Call Yarn.
3. Unhoist ``package.json`` and apply the resulting dependency delta.

Binge pipes trailing command arguments to Yarn.
For ``add`` and ``upgrade``, the dependency delta is applied to local packages that have a dependency intersection with the delta.
For example ``binge add react@16.0.1`` will transitively set the React dependency to ``16.0.1`` in local packages that depend on React.    

## Binge vs. Lerna
[Lerna](https://lernajs.io/) is a popular tool for managing JavaScript repository containing multiple packages.

The following table gives an overview of the core differences between binge and Lerna:

| Lerna | binge |Explanation
| --- | --- | --- |
|Versioned packages|Unversioned packages|Lerna |
|Multiple versions of same dependency across packages|Enforces consistent dependency version across packages |binge enforces dependency versions are consistent across your local packages. This reduces the file size of your application and improves the developer experience (developers don't need to worry where in your code version 1.x and where version 2.x of the same library is used).|
|Lerna watches all of your packages simultaneously, which can result in a large number of concurrent watch processes.|binge watches one app at a time and optimizes watch processes by running it only for packages that are affected by recent changes.|binge frees CPU and RAM.|
|Symlinks|No symlinks|Lerna uses [symetric links](https://en.wikipedia.org/wiki/Symbolic_link) ..., which can be problematic. Can't hook into symlinks: npm doesn't handle it as a "propper" package dependency; resolve dependencies from symlink: no-depuing, yarn list doesn't consider symlinked sub-dependencies|

We recommend using Lerna if you need to version your packages for external users, who work outside the context of your monorepo.
In contrast, if your packages are primarily used from within your monorepo, we recommend you use binge to avoid the versioning overhead.

[//]: # (Lerna: versioning!)
Binge: No publishing overhead, no symlinks - what exactly is the problem with symlinks? -
Subset of Lerna possible: but symlinks

Lerna: bump one package, have to update all referencing package

Lerna watch and build too messy

Tooling to ensure: all packages use the same version; Lerna can't do this

Each package should interact with each other through clearly defined interfaces/APIs

Dummy: from there pointer to all entry points; run "binge watch" there.

Doesn't really make sense to have package versioning in monorepos

the problem: managing packages with consistent dependencies in monorepo
manage build scripts with as little duplication as possible
avoid publishing/versioning overhead - Lerna!?

## Contribution
Contributions are welcome.
Make sure you run the tests before creating a pull request and add test cases that cover the contributed code.

To build binge from its source files run ``yarn run build``.
Execute the tests by running ``yarn run test``.

## Authors

* Cristóvão Honorato - [@CristovaoHonorato](https://github.com/CristovaoHonorato) (architect & maintainer)
* Timotheus Kampik - [@CristovaoHonorato](https://github.com/TimKam) (docs)

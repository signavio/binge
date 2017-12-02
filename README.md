# binge - version-less JavaScript package management for monorepos
binge is a version-less JavaScript package management tool for monorepos.

It helps you to:
* achieve a clear separation of concerns through modularization by enabling the quick creation and consumption of local packages
* avoid dependency hell by enforcing dependency version consistency across different local packages
* overcome the publishing overhead of traditional packages by providing version-less local packages that otherwise behave like standalone npm packages. For example, binge supports npm package semantics, which enables custom lifecycle steps like testing, building and linting

[//]: # (To learn more about *why exactly* you should consider using binge, read our [announcement blog post]https://tech.signavio.com/2017/package-management-binge.)

## Getting started with binge
Install binge by running ``yarn global add binge``.

**Note**: binge requires [Yarn](https://yarnpkg.com/lang/en/) and doesn't support npm.

### Repository structure
You could, for example, structure your repository as follows:

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
    - app
        - src
        - package.json
        - …    
…
```

In our simplified example (see: [./examples/watch-app](./examples/watch-app)), our client folder contains a root-level folder for each local package.
The ``app`` folder also is the global entry point to (the *root* of) our app.

**Note:** binge supports nested local packages.
However, we recommend we recommend not to nest too deeply to control complexity and allow a clearer overview.
Also, make sure there are no dependency circles between (nested) packages.

Local packages have the same structure as ordinary npm packages, except that they are **not versioned**.
To include a reference to a local package include it in ``package.json`` as a *file reference*.

The ``package.json`` in the root folder lists the other local packages as dependencies:

```json
{
  "name": "app",
  "dependencies": {
      "i-filter-stuff": "file:../i-filter-stuff",
      "i-provide-text": "file:../i-provide-text"
  },
  …
}
```

Of course, you can have multiple entry point packages in your repository and also reference local packages in other local packages that aren't entry points.

To build the app, navigate to the ``app`` directory and run ``binge bootstrap``.
binge now installs all dependencies in the hoisting location, builds the local packages, connects all ``bin`` folders, and deploys the local packages to the ``node_modules`` folder of the ``app`` directory.
For example, if the app is built with webpack, the build command could be ``binge bootstrap && webpack``.

To run the app and watch the source files, run ``binge watch`` in the ``app`` directory.

## Reference documentation
This section lists and explains all binge commands.
You find minimal example apps that illustrate the commands at [./examples](./examples).

* ``bootstrap``:

    Installs, builds and deploys the local package tree.
    For example, running ``binge bootstrap`` in [./examples/bootstrap/app](./examples/bootstrap/app):
    * installs the dependencies of the three local packages ``i-filter-stuff``, ``i-print-stuff`` and ``i-provide-colors``,
    * builds the three local packages,
    * deploys the local packages to the ``node_modules`` folder of the app directory.

    ``binge bootstrap`` bootstraps not only the entry point, but all local packages.

    **Note:** ``bootstrap`` also runs ``check`` (see below) and fails if ``check`` fails.

* ``check``:

    Checks if the [yarn-lock.json](https://yarnpkg.com/lang/en/docs/yarn-lock/) and ``package.json`` files in the local package tree are in sync.
    Lock files ensure consistent build across machines.
    This command helps ensure no developer forgets to push lock files changes.
    For example, running ``binge check`` in [./examples/check-sync/app](./examples/check-sync/app) returns:

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
    For example, when creating the file ``.cred`` in [./examples/bootstrap](./examples/bootstrap), navigating to ``app`` and running ``binge copy ../.cred``, binge copies the file ``.cred`` to the following directories:
    * ``i-filter-stuff``,
    * ``i-print-stuff``,
    * ``i-provide-colors``,
    * ``root``.

*  ``graph``:

    Prints the package tree and the layer topology (the build order of the nodes).
    For example, running ``binge graph`` [./examples/bootstrap/app](./examples/bootstrap/app) returns:

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

    ``binge harmony --fix`` harmonizes dependencies across all packages. Updates the ``yarn.lock`` files in the local packages and in the entry point accordingly. ``harmony --fix`` does **not** update ``package.json`` files. Fixing inconsistencies there requires explicit (manual) action.

* ``nuke``:

    Removes the ``node_modules`` folders in the local package tree.
    For example, running ``binge nuke`` in [./examples/bootstrap/app](./examples/bootstrap/app) deletes ``node_modules`` folders in the following directories:
    * ``i-filter-stuff``,
    * ``i-print-stuff``,
    * ``i-provide-colors``,
    * ``root``.

    ``binge nuke fileName`` removes the specified file from all local packages and the root package, analogous to ``binge copy``.

* ``remove dependencyName``

    Removes one or multiple specified dependencies from the current package.
    For example, running  ``binge remove invariant`` in [./examples/bootstrap/i-filter-stuff](./examples/bootstrap/i-filter-stuff) removes the dependency ``invariant`` from [./examples/bootstrap/i-filter-stuff/package.json](./examples/bootstrap/i-filter-stuff/package.json).

    ``binge remove --all dependencyName`` removes one or multiple specified dependencies from *all* packages.

* ``trace targetBranch, ?outputFolder``:

    Compares the current branch with the target branch, transitively finding changed files.
    Outputs the list of affected local packages.
    ``trace`` helps optimizing the test set your CI server runs when checking a merge request by considering the packages that changed *and* the packages that depend on changed packages.

* ``watch``:

    Builds and watches the local package tree.
    You can try out ``binge watch`` in [./examples/watch-app/app](./examples/watch-app/app).

Similarly to [Lerna](https://github.com/lerna/lerna/blob/master/doc/hoist.md), binge *hoists* dependencies.
This means binge moves shared dependencies up the dependency tree to avoid unnecessary duplication of code.
To support proper hoisting, run the following Yarn commands via binge (for example: run ``binge add left-pad``):

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
|Versioned packages|Unversioned packages|Lerna requires you to version local packages. While versioning is great for external stakeholders, who install the package via a package manager, binge assumes versioning packages within a monorepo is confusing and source of overhead. This carries even more weight as the monorepo and development team grow in size. Let's look at an example: Package ``A``, ``B``, ``C`` are in the same repo. The current versions are ``A=1``, ``B=2`` ``C=1``. ``A`` depends on ``B=1``, ``C`` on ``B=2``. This means we are currently accumulating technical debt. The desired state is to release a new version of ``B`` that is compatible with both ``A`` and ``C``. Developers working on ``C`` have the incompatible code of ``B`` checked out (as it's in the same repo) and need to switch to a legacy branch/tag to work on the compatible version of ``B``.|
|Allows multiple versions of same dependency across packages|Enforces consistent dependency version across packages |binge ensures dependency versions are consistent across your local packages. This reduces the file size of your application and improves the developer experience (developers don't need to worry where in your code version 1.x and where version 2.x of the same library is used).|
|Watches all packages simultaneously|Optimizes watch processes|Lerna watches all of your packages simultaneously, which can result in a large number of concurrent watch processes. binge watches one app at a time and optimizes watch processes by running it only for packages that are affected by recent changes. This frees CPU and RAM resources.|
|Symlinks|No symlinks|Lerna uses [symmetric links](https://en.wikipedia.org/wiki/Symbolic_link) to reference sub-dependencies. These sub-dependencies can't be de-duped and are not handled consistently to 'normal' dependencies by yarn. For example, ``yarn list`` doesn't consider symlinked sub-dependencies. binge addresses this problem by properly installing sub-dependencies into the ``node_modules`` folder of the global entry point.|

We recommend using Lerna if you need to version your packages for external users, who work outside the context of your monorepo.
In contrast, if your packages are primarily used from within your monorepo, we recommend you use binge to avoid the versioning overhead.

## Contribution
Contributions are welcome.
Make sure you run the tests before creating a pull request and add test cases that cover the contributed code.

To build binge from its source files run ``yarn run build``.
Execute the tests by running ``yarn run test``.

## Authors

* Cristóvão Honorato - [@CristovaoHonorato](https://github.com/CristovaoHonorato) (architect & maintainer)
* Timotheus Kampik - [@TimKam](https://github.com/TimKam) (docs)

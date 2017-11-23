import { greatest as greatestVersion } from '../util/version'

export default function(dependencyPointers, dependencyStatus) {
    /* Dependency Pointer format
     * {
     *   nodeName,
     *   name,
     *   version: bag[name],
     * }
     */

    /* Dependency Status format
      * return {
      *     name,
      *     version: reconciledVersion,
      *     status,
      * }
      */
    const versionsForDependency = name =>
        dependencyPointers
            .filter(entry => entry.name === name)
            .map(entry => entry.version)

    return (
        dependencyStatus
            // Get all the non Okay
            .filter(({ status }) => status !== 'OK')
            // Try to uniform version
            .map(({ name }) => ({
                name,
                version: greatestVersion(versionsForDependency(name)),
            }))
            // Map the fixed version
            .map(({ name, version }) => ({
                canFix: Boolean(version),
                name,
                version,
            }))
    )
}

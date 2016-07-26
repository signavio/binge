import readGraph from '../graph/withNeedsInstall'

export default function(){

    readGraph('.', (err, graph) => {
        if(err){
            //TODO move the success error to a common place
            console.log("FATAL*************************")
            console.log(err)
            return
        }

        graph.forEach( node => {
            const {name, npmStatus} = node
            console.log(`${name} - ${npmStatus.needsInstall}`)

            if(npmStatus.needsInstall){

                if(npmStatus.virgin) {
                    console.log(`  Not installed`)
                    return
                }

                npmStatus.missing.forEach(name => {
                    console.log(`  ${name}: Not installed`)
                })

                npmStatus.unsatisfied.forEach(({name, version, installedVersion}) => {
                    console.log(`  ${name}: Required ${version} | Installed ${installedVersion}`)
                })

                npmStatus.stale.forEach(name => {
                    console.log(`  ${name}: Is stale`)
                })
            }
        })
    })
}

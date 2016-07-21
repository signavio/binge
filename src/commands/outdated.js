import readGraph from '../graph/readWithStatus'
import { flat as flatTopology } from '../graph/topology'



export default function(){
    process.chdir('S:/workspace-trunk/signavio/client/bdmsimulation/')

    readGraph('.', (err, graph) => {
        if(err){
            console.log("FATAL*************************")
            console.log(err)
            return
        }

        flatTopology(graph).reverse().forEach( node => {
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

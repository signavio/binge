export default function needsBuild(dependency){

    if(!dependency.isFileVersion){
        return false
    }

    return dependency.node.needsBuild === true
}

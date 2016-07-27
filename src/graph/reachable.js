export default function(startNode){
    function traverse(node){
        if(result.indexOf(node) === -1){
            if(node !== startNode) result.push(node)
            node.children.forEach(traverse)
        }
    }
    const result = []
    traverse(startNode)
    return result
}

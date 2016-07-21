export default function (graph){
    function flatten(node){        
        if(!colored[node.path]){
            colored[node.path] = true
            result.push(node)
            node.children.forEach(flatten)
        }
    }

    const colored = {}
    const result = []
    flatten(graph)
    return result
}

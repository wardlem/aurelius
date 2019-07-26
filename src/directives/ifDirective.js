const ifDirective = module.exports;

ifDirective.write = function write(content, childNodes, state)
{
    const {ws} = state;

    const parts = [];

    parts.push(`${ws}if (${content}) {`);
    state.increaseDepth();
    const newState = {...state, pos: 0, nodes: childNodes};
    while (!newState.eos())
    {
        parts.push(newState.nextPart());
    }
    state.decreaseDepth();
    parts.push(`${ws}}`);

    return parts.join('\n');
};

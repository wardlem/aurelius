const NodeType = require('./NodeType');
const escapeString = require('./helpers/escapeString');

const baseDirectives = {
    if: require('./directives/ifDirective'),
    for: require('./directives/forDirective'),
};

function compile(nodes, options = {})
{
    const {
        writer: _writer = require('./writers/HtmlWriter'),
        name = 'template',
        useWith = true,
        preserveComments = false,
        directives = {},
        output = null,
    } = options;

    let writer = _writer;
    if (typeof writer === 'string')
    {
        switch (writer)
        {
            case 'html':
                writer = require('./writers/HtmlWriter');
                break;
            case 'incremental-dom':
                writer = require('./writers/IncrementalDomWriter');
                break;
            default:
                throw Error(`Writer ${writer} is not built-in`);
        }
    }

    let id = 0;

    const state = {
        nodes,
        pos: 0,
        depth: 0,
        ws: '',
        writer,
        lifted: {},
        preserveComments,
        nextId()
        {
            id += 1;
            return id;
        },
        directives: {
            ...baseDirectives,
            directives,
        },
        increaseDepth() { increaseDepth(this); },
        decreaseDepth() { decreaseDepth(this); },
        nextPart() { return nextPart(this); },
        eos() { return eos(this); },
    };

    increaseDepth(state);
    if (useWith)
    {
        increaseDepth(state);
    }

    const parts = [];
    while (!eos(state))
    {
        parts.push(nextPart(state));
    }

    decreaseDepth(state);
    if (useWith)
    {
        decreaseDepth(state);
    }

    return `${writeExport(output)}${writer.writeIntro(name)}
${writeIntro(useWith)}
${writeLifted(state)}
${parts.join('\n')}
${writeOutro(useWith)}
${writer.writeOutro()}
`;
}

function writeExport(output)
{
    switch (output)
    {
        case 'cjs':
        case 'commonjs':
        {
            return 'module.exports = ';
        }
        case 'es6':
        case 'module':
        {
            return 'export default ';
        }
        case null:
        {
            return '';
        }
        default:
        {
            throw Error(`${output} is not a valid output option.`);
        }
    }
}

function writeIntro(useWith)
{
    return `${useWith ? '  with (data || {}) {' : ''}`;
}

function writeOutro(useWith)
{
    return `${useWith ? '  }' : ''}
`;
}

function writeLifted(state)
{
    const {lifted} = state;

    return Object.keys(lifted).map((id) => `
    ${lifted[id].toString()}
`);
}

function nextPart(state)
{
    const node = popNode(state);
    switch (node.type)
    {
        case NodeType.TEXT:
            return writeText(node, state);
        case NodeType.ELEMENT:
            return writeElement(node, state);
        case NodeType.DIRECTIVE:
            return writeDirective(node, state);
        case NodeType.OUTPUT:
            return writeOutput(node, state);
        default:
            throw Error('Unexpected node when writing template');
    }
}

function writeText(node, state)
{
    const content = node.children[0].children;
    return state.writer.writeTextNode(content, false, state.ws);
}

function writeElement(node, state)
{
    const {
        ws,
        writer,
    } = state;

    const tagNode = node.children[0];
    let isOutput = tagNode.type === NodeType.OUTPUT;
    let tag;
    let parts = [];
    const attributes = compileAttributes(node.children[1]);
    const isDynamicAttributes = attributes['__*0__'] != null;
    let key = null;
    let attsVarName;

    if (isDynamicAttributes)
    {
        // Attributes are dynamic.
        // We need to evaluate them before writing attributes
        // since the key may be contained there, and some writers
        // can use the key.
        const {
            attsFnName,
            attsFnSrc,
        } = writeDynamicAttributes(attributes, state);
        attsVarName = `__atts_${state.nextId()}__`;
        parts.push(attsFnSrc);
        parts.push(`${ws}const ${attsVarName} = ${attsFnName}();`);
        const key = `__key_${state.nextId()}__`;
        parts.push(`${ws}const ${key} = ${attsVarName}.key;`);
    }

    if (isOutput)
    {
        tag = `__tag_${state.nextId()}__`;
        const prefix = `${ws}const ${tag} = ${writeOutputSource(tagNode, state)}`;
        parts.push(prefix);
    }
    else
    {
        tag = tagNode.children;
    }

    parts.push(writer.writeElementOpenStart(tag, isOutput, key, isDynamicAttributes, ws));

    if (isDynamicAttributes)
    {
        parts.push(`${ws}for (const __attkey__ in ${attsVarName}) { if (${attsVarName}.hasOwnProperty(__attkey__)) {`);
        increaseDepth(state);
        parts.push(writer.writeAttribute('__attkey__', true, `${attsVarName}[__attkey__]`, true, state.ws));
        decreaseDepth(state);
        parts.push(`${ws}}}`);
    }
    else
    {
        for (const key in attributes)
        {
            if (attributes.hasOwnProperty(key))
            {
                parts.push(writer.writeAttribute(key, false, attributes[key].value, attributes[key].isDynamic, ws));
            }
        }
    }

    const children = node.children.slice(2);

    if (children.length === 0)
    {
        parts.push(writer.writeElementOpenEnd(tag, isOutput, true, ws));
        return parts.join('\n');
    }

    const newState = {
        ...state,
        pos: 0,
        nodes: children,
    };

    parts.push(writer.writeElementOpenEnd(tag, isOutput, false, ws));

    while (!eos(newState))
    {
        parts.push(nextPart(newState));
    }

    parts.push(writer.writeElementClose(tag, isOutput, ws));

    return parts.join('\n');
}

function writeDirective(node, state)
{
    const name = node.children[0].children.toLowerCase();
    const content = node.children[1].children;
    const childNodes = node.children.slice(2);

    if (!state.directives.hasOwnProperty(name))
    {
        throw Error(`Invalid directive ${name}`);
    }

    return state.directives[name].write(content, childNodes, state);
}

function writeOutput(node, state)
{
    const content = node.children[0].children;
    return state.writer.writeTextNode(content, true, state.ws);
}

function writeOutputSource(node, state)
{
    return node.children[0].children;
}

function compileAttributes(node)
{
    let dynamicIndex = 0;
    const atts = {};
    for (const childNode of node.children)
    {
        let attName = childNode.children[0].children;
        const valueNode = childNode.children[1];
        let isDynamic = (valueNode || false) && valueNode.type === NodeType.OUTPUT;
        let value;

        if (valueNode == null)
        {
            value = true;
        }
        else if (isDynamic)
        {
            value = writeOutputSource(valueNode);
        }
        else
        {
            value = valueNode.children;
        }

        if (attName === '*')
        {
            attName = `__*${dynamicIndex}__`;
            dynamicIndex += 1;
        }

        atts[attName] = {
            isDynamic,
            value,
        };

    }

    return atts;
}

function writeDynamicAttributes(attributes, state)
{
    const parts = [];

    const keys = Object.keys(attributes);
    let currentParts = [];

    for (const key of keys)
    {
        const {value: _value, isDynamic} = attributes[key];
        let value = _value;

        if (key.indexOf('__*') === 0)
        {
            if (currentParts.length > 0)
            {
                parts.push(` {${currentParts.join(', ')}}`);
                currentParts = [];
            }


            parts.push(`  ${value}`);

            continue;
        }

        if (!isDynamic)
        {
            value = `"${escapeString(_value)}"`;
        }

        currentParts.push(` "${escapeString(key)}": ${value}`);
    }

    if (currentParts.length > 0)
    {
        parts.push(`  {${currentParts.join(', ')}}`);
    }

    const fnName = `__buildatts_${state.nextId()}__`;
    const fn = `const ${fnName} = function ${fnName}() {
        return Object.assign({}, ${parts.join(', ')})
    }.bind(this);`;

    return {
        attsFnName: fnName,
        attsFnSrc: fn,
    };
}

function getNode(state, offset = 0)
{
    return state.nodes[state.pos + offset];
}

function popNode(state)
{
    const node = getNode(state);
    advance(state);
    return node;
}

function advance(state, amount = 1)
{
    state.pos += amount;
}

function increaseDepth(state)
{
    state.depth += 1;
    state.ws  = makeWhitespace(state.depth);
}

function decreaseDepth(state)
{
    state.depth -= 1;
    state.ws = makeWhitespace(state.depth);
}

function eos(state, offset = 0)
{
    return state.pos + offset >= state.nodes.length;
}

function makeWhitespace(depth)
{
    return ' '.repeat(depth * 2);
}

module.exports = compile;

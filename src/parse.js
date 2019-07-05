const NodeType = require('./NodeType');
const TokenType = require('./TokenType');

function parse(tokens, options = {})
{
    const state = {
        tokens,
        pos: 0,
    };

    const nodes = [];
    while (!eos(state))
    {
        nodes.push(nextNode(state));
    }

    return nodes;
}

function nextNode(state)
{
    switch (getToken(state).type)
    {
        case TokenType.OPEN_START_TAG:
            return parseElement(state);
        case TokenType.OPEN_OUTPUT:
            return parseOutput(state);
        case TokenType.OPEN_START_DIRECTIVE:
            return parseDirective(state);
        case TokenType.OPEN_COMMENT:
            return parseComment(state);
        case TokenType.TEXT:
            return parseText(state);
        default:
            throwUnexpected(state);
    }
}

function parseElement(state)
{
    // Remove start tag
    const elementOpenToken = popToken(state);

    const tagNode = parseValueOrOutput(state);

    const attributeNodes = [];
    const attributesToken = getToken(state);
    while (!eos(state)
        && getToken(state).type !== TokenType.END_TAG
        && getToken(state).type !== TokenType.CLOSE_END_TAG)
    {
        attributeNodes.push(parseAttribute(state));
    }

    if (eos(state))
    {
        throwUnexpectedEos(state);
    }

    const attributesNode = node(NodeType.ATTRIBUTES, attributesToken, attributeNodes);

    const childNodes = [
        tagNode,
        attributesNode,
    ];

    if (getToken(state).type === TokenType.CLOSE_END_TAG)
    {
        // Remove end tag
        popToken(state);
    }
    else
    {
        const endTagToken = getToken(state);
        if (endTagToken.type !== TokenType.END_TAG)
        {
            throwUnexpected(state);
        }

        // Remove end tag
        popToken(state);

        while (!eos(state) && getToken(state).type !== TokenType.CLOSE_START_TAG)
        {
            childNodes.push(nextNode(state));
        }

        if (eos(state))
        {
            throwUnexpectedEos(state);
        }

        // Remove close end tag token
        popToken(state);

        const endTagNameNode = parseValue(state);

        if (endTagNameNode.children !== tagNode.children && endTagNameNode.value !== '?')
        {
            throw Error(`Closing tag at ${endTagNameNode.token.line}:${endTagNameNode.token.linePos} does not match open tag at ${attributesToken.line}:${attributesToken.linePos}`);
        }

        const closeEndTagToken = getToken(state);
        if (closeEndTagToken.type !== TokenType.END_TAG)
        {
            throwUnexpected(state);
        }

        // Remove end tag
        popToken(state);
    }

    return node(NodeType.ELEMENT, elementOpenToken, childNodes);
}

function parseOutput(state)
{
    // Remove open tag
    const openOutputToken = popToken(state);
    const contentNode = parseValue(state);
    const closeToken = getToken(state);
    if (closeToken.type !== TokenType.END_BRACE)
    {
        throwUnexpected(state);
    }

    popToken(state);

    return node(NodeType.OUTPUT, openOutputToken, [contentNode]);
}

function parseDirective(state)
{
    // Remove open tag
    const openOutputToken = popToken(state);
    const nameNode = parseValue(state);
    const contentNode = parseValue(state);
    const closeToken = getToken(state);
    if (closeToken.type !== TokenType.END_BRACE)
    {
        throwUnexpected(state);
    }

    popToken(state);

    const childNodes = [nameNode, contentNode];
    while (!eos(state) && getToken(state).type !== TokenType.OPEN_END_DIRECTIVE)
    {
        childNodes.push(nextNode(state));
    }

    if (eos(state))
    {
        throwUnexpectedEos(state);
    }

    // Remove close end tag token
    popToken(state);

    const endNameNode = parseValue(state);

    if (endNameNode.children !== nameNode.children)
    {
        throw Error(`Closing directive at ${endNameNode.token.line}:${endNameNode.token.linePos} does not match open tag at ${nameNode.token.line}:${nameNode.token.linePos}`);
    }

    const closeEndTagToken = getToken(state);
    if (closeEndTagToken.type !== TokenType.END_BRACE)
    {
        throwUnexpected(state);
    }

    // Remove end tag
    popToken(state);

    return node(NodeType.DIRECTIVE, openOutputToken, childNodes);
}

function parseComment(state)
{
    // Remove open tag
    const openOutputToken = popToken(state);
    const contentNode = parseValue(state);
    const closeToken = getToken(state);
    if (closeToken.type !== TokenType.END_BRACE)
    {
        throwUnexpected(state);
    }

    popToken(state);

    return node(NodeType.COMMENT, openOutputToken, [contentNode]);
}

function parseText(state)
{
    const textToken = getToken(state);
    const valueNode = parseValue(state);
    return node(NodeType.TEXT, textToken, [valueNode]);
}

function parseValueOrOutput(state)
{
    const nextToken = getToken(state);
    switch (nextToken.type)
    {
        case TokenType.TEXT:
            return parseValue(state);
        case TokenType.OPEN_OUTPUT:
            return parseOutput(state);
        default:
            throwUnexpected(state);
    }
}

function parseValue(state)
{
    const textToken = popToken(state);
    const value = textToken.value.toString('utf8');
    return node(NodeType.VALUE, textToken, value);
}

function parseAttribute(state)
{
    const startToken = getToken(state);
    const nameNode = parseValue(state);
    const childNodes = [nameNode];
    const nextToken = getToken(state);
    if (nextToken.type === TokenType.EQUALS)
    {
        popToken(state);
        const valueNode = parseValueOrOutput(state);
        childNodes.push(valueNode);
    }

    return node(NodeType.ATTRIBUTE, startToken, childNodes);
}

function node(type, token = null, children = null)
{
    return {
        type,
        token,
        children,
    };
}

function getToken(state, offset = 0)
{
    return state.tokens[state.pos + offset];
}

function popToken(state)
{
    const nextToken = getToken(state);
    advance(state);
    return nextToken;
}

function advance(state, amount = 1)
{
    state.pos += amount;
}

function eos(state, offset = 0)
{
    return state.pos + offset >= state.tokens.length;
}

function throwUnexpected(state)
{
    const currentToken = getToken(state);
    throw Error(`Unexpected token at ${currentToken.line}:${currentToken.linePos} ${currentToken.type}`);
}

function throwUnexpectedEos(state)
{
    throw Error('Unexpected end of token stream');
}

module.exports = parse;

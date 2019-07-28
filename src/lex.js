const State = {
    MAIN: 1,
    TAGNAME: 2,
    ATTRIBUTES: 3,
    BRACE: 4,
    STRING: 5,
};

const TokenType = require('./TokenType');

const WHITESPACE = new Set(Array.from('\t\r\n\v ').map(toCharCode));
const QUOTES = new Set(Array.from('\'"').map(toCharCode));
const NEWLINE = toCharCode('\n');
const EQUALS = toCharCode('=');
const LEFT_BRACE = toCharCode('{');
const RIGHT_BRACE = toCharCode('}');
const OPEN_START_TAG = Array.from('<').map(toCharCode);
const CLOSE_START_TAG = Array.from('</').map(toCharCode);
const END_TAG = Array.from('>').map(toCharCode);
const CLOSE_END_TAG = Array.from('/>').map(toCharCode);
const OPEN_OUTPUT = Array.from('{{').map(toCharCode);
const OPEN_START_DIRECTIVE = Array.from('{{#').map(toCharCode);
const OPEN_END_DIRECTIVE = Array.from('{{/').map(toCharCode);
const OPEN_COMMENT = Array.from('{{!').map(toCharCode);
const END_BRACE = Array.from('}}').map(toCharCode);
const BRACE_SPECIAL = new Set(Array.from('#/!').map(toCharCode));

function lex(_src, options = {})
{
    let src = _src;
    if (typeof src === 'string')
    {
        src = Buffer.from(src, 'utf8');
    }

    const state = {
        src,
        pos: 0,
        line: 1,
        linePos: 0,
        tokens: [],
        states: [State.MAIN],
        quote: null,
        braces: 0,
        get state()
        {
            return this.states[this.states.length - 1];
        },
    };

    while (!eof(state))
    {
        nextToken(state);
    }

    if (state.states.length !== 1)
    {
        throw throwUnexpectedEof(state);
    }

    return state.tokens;
}

function nextToken(state)
{
    switch (state.state)
    {
        case State.MAIN:
            return main(state);
        case State.TAGNAME:
            return tagname(state);
        case State.ATTRIBUTES:
            return attributes(state);
        case State.BRACE:
            return brace(state);
        case State.STRING:
            return string(state);
        default:
            throw Error(`Invalid state: ${state.state}`);
    }
}

function main(state)
{
    if (eof(state))
    {
        return state;
    }

    if (isCloseStartTag(state))
    {
        pushToken(state, CLOSE_START_TAG.length, TokenType.CLOSE_START_TAG);
        pushState(state, State.TAGNAME);
    }
    else if (isOpenStartTag(state))
    {
        pushToken(state, OPEN_START_TAG.length, TokenType.OPEN_START_TAG);
        pushState(state, State.TAGNAME);
    }
    else if (isOpenBrace(state))
    {
        pushState(state, State.BRACE);
    }
    else if (isEndTag(state)
        || isCloseEndTag(state)
        || isEndBrace(state))
    {
        // Invalid
        throwUnexpected(state);
    }
    else
    {
        // Text
        const {
            pos,
            line,
            linePos,
        } = state;

        while (!eof(state) && !isSpecial(state))
        {
            advance(state);
        }

        const value = state.src.slice(pos, state.pos);
        pushToken({...state, pos, line, linePos}, value.length, TokenType.TEXT, value);
    }

    return state;
}

function tagname(state)
{
    consumeWhiteSpace(state);

    if (eof(state))
    {
        throwUnexpectedEof(state);
    }

    if (isOpenStartTag(state)
        || isCloseStartTag(state)
        || isOpenStartDirective(state)
        || isOpenEndDirective(state)
        || isEndTag(state)
        || isCloseEndTag(state)
        || isEndBrace(state))
    {
        throwUnexpected(state);
    }
    else if (isOpenBrace(state))
    {
        pushState(state, State.BRACE);
        nextToken(state);
    }
    else
    {
        // Text
        const {
            pos,
            line,
            linePos,
        } = state;

        while (!eof(state) && !isSpecial(state) && !isWhitespace(state))
        {
            advance(state);
        }

        const value = state.src.slice(pos, state.pos);
        pushToken({...state, pos, line, linePos}, value.length, TokenType.TEXT, value);
    }

    if (isWhitespace(state) || isEndTag(state) || isCloseEndTag(state))
    {
        popState(state);
        pushState(state, State.ATTRIBUTES);
    }

    return state;
}

function attributes(state)
{
    consumeWhiteSpace(state);

    if (eof(state))
    {
        throwUnexpectedEof(state);
    }

    if (isOpenStartTag(state)
        || isCloseStartTag(state)
        || isOpenStartDirective(state)
        || isOpenEndDirective(state)
        || isEndBrace(state))
    {
        throwUnexpected(state);
    }
    else if (isOpenBrace(state))
    {
        pushState(state, State.BRACE);
    }
    else if (isEndTag(state))
    {
        pushToken(state, END_TAG.length, TokenType.END_TAG);
        popState(state);
    }
    else if (isCloseEndTag(state))
    {
        pushToken(state, CLOSE_END_TAG.length, TokenType.CLOSE_END_TAG);
        popState(state);
    }
    else
    {
        // Text
        const {
            pos,
            line,
            linePos,
        } = state;

        while (!eof(state) && !isSpecial(state) && !isWhitespace(state) && !isEquals(state))
        {
            advance(state);
        }

        const propName = state.src.slice(pos, state.pos);
        pushToken({...state, pos, line, linePos}, propName.length, TokenType.TEXT, propName);

        consumeWhiteSpace(state);
        if (isEquals(state))
        {
            pushToken(state, EQUALS.length, TokenType.EQUALS);
            consumeWhiteSpace(state);

            if (isQuote(state))
            {
                pushState(state, State.STRING);
            }
            else if (isOpenOutput(state))
            {
                pushState(state, State.BRACE);
            }
            else
            {
                throwUnexpected(state);
            }
        }
    }

    return state;
}

function brace(state)
{
    let hasDirectiveName = false;

    if (isOpenStartDirective(state))
    {
        hasDirectiveName = true;
        pushToken(state, OPEN_START_DIRECTIVE.length, TokenType.OPEN_START_DIRECTIVE);
    }
    else if (isOpenEndDirective(state))
    {
        hasDirectiveName = true;
        pushToken(state, OPEN_END_DIRECTIVE.length, TokenType.OPEN_END_DIRECTIVE);
    }
    else if (isOpenComment(state))
    {
        pushToken(state, OPEN_COMMENT.length, TokenType.OPEN_COMMENT);
    }
    else if (isOpenOutput(state))
    {
        pushToken(state, OPEN_OUTPUT.length, TokenType.OPEN_OUTPUT);
    }
    else
    {
        throwUnexpected(state);
    }

    if (hasDirectiveName)
    {
        consumeWhiteSpace(state);
        const {
            pos,
            line,
            linePos,
        } = state;

        while (!eof(state) && !isSpecial(state) && !isWhitespace(state))
        {
            advance(state);
        }

        if (eof(state))
        {
            throwUnexpectedEof(state);
        }

        const name = state.src.slice(pos, state.pos);
        if (name.length === 0)
        {
            throwUnexpected(state);
        }

        pushToken({...state, pos, line, linePos}, name.length, TokenType.TEXT, name);
    }

    const {
        pos,
        line,
        linePos,
    } = state;

    while (!eof(state) && (state.braces > 0 || !isEndBrace(state)))
    {
        if (code(state) === LEFT_BRACE)
        {
            state.braces += 1;
        }
        else if (code(state) === RIGHT_BRACE && (state.braces > 0 || !isEndBrace(state)))
        {
            if (state.braces === 0)
            {
                throwUnexpected(state);
            }

            state.braces -= 1;
        }

        advance(state);
    }

    if (eof(state))
    {
        throwUnexpectedEof(state);
    }

    const content = trimBuffer(state.src.slice(pos, state.pos));
    if (content.length > 0)
    {
        pushToken({...state, pos, line, linePos}, state.pos - pos, TokenType.TEXT, content);
    }

    pushToken(state, END_BRACE.length, TokenType.END_BRACE);

    popState(state);

    return state;
}

function string(state)
{
    if (!isQuote(state))
    {
        throwUnexpected(state);
    }

    const {
        pos,
        line,
        linePos,
    } = state;

    const terminator = code(state);
    advance(state);

    while (!eof(state)
        && code(state) !== terminator
        && !isSpecial(state))
    {
        advance(state);
    }

    if (eof(state))
    {
        throwUnexpectedEof(state);
    }

    if (code(state) !== terminator)
    {
        throwUnexpected(state);
    }

    const string = state.src.slice(pos + 1, state.pos);
    pushToken({...state, pos, line, linePos}, string.length, TokenType.TEXT, string);
    advance(state);
    popState(state);

    return state;
}

function pushToken(state, srcSize, type, value = null)
{
    state.tokens.push({
        pos: state.pos,
        linePos: state.linePos,
        line: state.line,
        type,
        value,
    });

    advance(state, srcSize);
}

function throwUnexpected(state)
{
    throw Error(`Unexpected token at ${state.line}:${state.linePos} 0x${code(state).toString(16)}`);
}

function throwUnexpectedEof(state)
{
    throw Error(`Unexpected end of file at ${state.line}:${state.linePos}`);
}

function pushState(state, newState)
{
    state.states.push(newState);
}

function popState(state)
{
    state.states.pop();
}

function matchSequence(state, sequence, offset = 0)
{
    const src = state.src;
    const startPos = state.pos + offset;
    for (let idx = 0; idx < sequence.length; idx += 1)
    {
        if (sequence[idx] !== src[idx + startPos])
        {
            return false;
        }
    }

    return true;
}

function consumeWhiteSpace(state)
{
    while (isWhitespace(state))
    {
        advance(state);
    }
}

function advance(state, amount = 1)
{
    if (isNewline(state))
    {
        state.line += 1;
        state.linePos = (amount - 1);
    }
    else
    {
        state.linePos += amount;
    }

    state.pos += amount;
}

function isSpecial(state, offset = 0)
{
    return isOpenStartTag(state, offset)
        || isCloseStartTag(state, offset)
        || isEndTag(state, offset)
        || isCloseEndTag(state, offset)
        || isOpenOutput(state, offset)
        || isOpenStartDirective(state, offset)
        || isOpenEndDirective(state, offset)
        || isOpenComment(state, offset)
        || isEndBrace(state, offset)
    ;
}

function isOpenStartTag(state, offset = 0)
{
    return matchSequence(state, OPEN_START_TAG, offset)
        && !isCloseStartTag(state, offset)
    ;
}

function isCloseStartTag(state, offset = 0)
{
    return matchSequence(state, CLOSE_START_TAG, offset);
}

function isEndTag(state, offset = 0)
{
    return matchSequence(state, END_TAG, offset);
}

function isCloseEndTag(state, offset = 0)
{
    return matchSequence(state, CLOSE_END_TAG, offset);
}

function isOpenBrace(state, offset = 0)
{
    return matchSequence(state, OPEN_OUTPUT, offset);
}

function isOpenOutput(state, offset = 0)
{
    return matchSequence(state, OPEN_OUTPUT, offset)
        && !BRACE_SPECIAL.has(code(state, OPEN_OUTPUT.length))
    ;
}

function isOpenStartDirective(state, offset = 0)
{
    return matchSequence(state, OPEN_START_DIRECTIVE, offset);
}

function isOpenEndDirective(state, offset = 0)
{
    return matchSequence(state, OPEN_END_DIRECTIVE);
}

function isOpenComment(state, offset = 0)
{
    return matchSequence(state, OPEN_COMMENT);
}

function isEndBrace(state, offset = 0)
{
    return matchSequence(state, END_BRACE);
}

function isWhitespace(state, offset = 0)
{
    return WHITESPACE.has(code(state, offset));
}

function isQuote(state, offset = 0)
{
    return QUOTES.has(code(state, offset));
}

function isEquals(state, offset = 0)
{
    return code(state, offset) === EQUALS;
}

function isNewline(state, offset = 0)
{
    return code(state, offset) === NEWLINE;
}

function code(state, offset = 0)
{
    return state.src[state.pos + offset];
}

function eof(state, offset = 0)
{
    return state.pos + offset >= state.src.length;
}

function toCharCode(str)
{
    return str.charCodeAt(0);
}

function trimBuffer(buf)
{
    let startIdx = 0;
    let endIdx = buf.length;

    while (WHITESPACE.has(buf[startIdx]))
    {
        startIdx += 1;
    }

    while (WHITESPACE.has(buf[endIdx - 1]))
    {
        endIdx -= 1;
    }

    return buf.slice(startIdx, endIdx);
}

module.exports = lex;

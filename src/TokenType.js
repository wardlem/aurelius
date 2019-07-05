const TokenType = {
    OPEN_START_TAG: 'OPEN_START_TAG', // <
    CLOSE_START_TAG: 'CLOSE_START_TAG', // </
    END_TAG: 'END_TAG', // >
    CLOSE_END_TAG: 'CLOSE_END_TAG', // />
    OPEN_OUTPUT: 'OPEN_OUTPUT', // {{
    OPEN_START_DIRECTIVE: 'OPEN_START_DIRECTIVE', // {{#
    OPEN_END_DIRECTIVE: 'CLOSE_DIRECTIVE', // {{/
    OPEN_COMMENT: 'OPEN_COMMENT', // {{!
    END_BRACE: 'END_BRACE', // }}
    TEXT: 'TEXT',
    EQUALS: 'EQUALS', // =
};

module.exports = TokenType;

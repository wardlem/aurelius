const {expect} = require('chai');

const lex = require('../../src/lex');
const TokenType = require('../../src/TokenType');

describe('lex', () =>
{
    it('parses text', () =>
    {
        const tokens = lex('This is the first test');
        expect(tokens.length).to.equal(1);
        expect(tokens[0].value.toString('utf8')).to.equal('This is the first test');
        expect(tokens[0].pos).to.equal(0);
        expect(tokens[0].line).to.equal(1);
        expect(tokens[0].linePos).to.equal(0);
        expect(tokens[0].type).to.equal(TokenType.TEXT);
    });

    it('parses a simple tag', () =>
    {
        const tokens = lex('<p></p>');

        expect(tokens.length).to.equal(6);

        expect(tokens[0].type).to.equal(TokenType.OPEN_START_TAG);

        expect(tokens[1].value.toString('utf8')).to.equal('p');
        expect(tokens[1].pos).to.equal(1);
        expect(tokens[1].line).to.equal(1);
        expect(tokens[1].linePos).to.equal(1);
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].type).to.equal(TokenType.END_TAG);

        expect(tokens[3].type).to.equal(TokenType.CLOSE_START_TAG);

        expect(tokens[4].value.toString('utf8')).to.equal('p');
        expect(tokens[4].pos).to.equal(5);
        expect(tokens[4].line).to.equal(1);
        expect(tokens[4].linePos).to.equal(5);
        expect(tokens[4].type).to.equal(TokenType.TEXT);

        expect(tokens[5].type).to.equal(TokenType.END_TAG);
    });

    it('parses a self-closing tag', () =>
    {
        const tokens = lex('<img />');

        expect(tokens.length).to.equal(3);

        expect(tokens[0].type).to.equal(TokenType.OPEN_START_TAG);

        expect(tokens[1].value.toString('utf8')).to.equal('img');
        expect(tokens[1].pos).to.equal(1);
        expect(tokens[1].line).to.equal(1);
        expect(tokens[1].linePos).to.equal(1);
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].type).to.equal(TokenType.CLOSE_END_TAG);
    });

    it('handles tag whitespace', () =>
    {
        const tokens = lex('< \np\t  >');

        expect(tokens.length).to.equal(3);

        expect(tokens[0].type).to.equal(TokenType.OPEN_START_TAG);

        expect(tokens[1].value.toString('utf8')).to.equal('p');
        expect(tokens[1].pos).to.equal(3);
        expect(tokens[1].line).to.equal(2);
        expect(tokens[1].linePos).to.equal(0);
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].type).to.equal(TokenType.END_TAG);
    });

    it('parses a tag with an attribute', () =>
    {
        const tokens = lex('<p disabled>');
        expect(tokens.length).to.equal(4);

        expect(tokens[0].type).to.equal(TokenType.OPEN_START_TAG);

        expect(tokens[1].value.toString('utf8')).to.equal('p');
        expect(tokens[1].pos).to.equal(1);
        expect(tokens[1].line).to.equal(1);
        expect(tokens[1].linePos).to.equal(1);
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].value.toString('utf8')).to.equal('disabled');
        expect(tokens[2].pos).to.equal(3);
        expect(tokens[2].line).to.equal(1);
        expect(tokens[2].linePos).to.equal(3);
        expect(tokens[2].type).to.equal(TokenType.TEXT);

        expect(tokens[3].type).to.equal(TokenType.END_TAG);
    });

    it('parses a tag with text value attributes', () =>
    {
        const src = '<p id="myParagraph" disabled other="thing">';
        const tokens = lex(src);
        expect(tokens.length).to.equal(10);

        expect(tokens[0].type).to.equal(TokenType.OPEN_START_TAG);

        expect(tokens[1].value.toString('utf8')).to.equal('p');
        expect(tokens[1].pos).to.equal(src.indexOf('p'));
        expect(tokens[1].line).to.equal(1);
        expect(tokens[1].linePos).to.equal(src.indexOf('p'));
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].value.toString('utf8')).to.equal('id');
        expect(tokens[2].pos).to.equal(src.indexOf('id'));
        expect(tokens[2].line).to.equal(1);
        expect(tokens[2].linePos).to.equal(src.indexOf('id'));
        expect(tokens[2].type).to.equal(TokenType.TEXT);

        expect(tokens[3].type).to.equal(TokenType.EQUALS);

        expect(tokens[4].value.toString('utf8')).to.equal('myParagraph');
        expect(tokens[4].pos).to.equal(src.indexOf('"myParagraph"'));
        expect(tokens[4].line).to.equal(1);
        expect(tokens[4].linePos).to.equal(src.indexOf('"myParagraph"'));
        expect(tokens[4].type).to.equal(TokenType.TEXT);

        expect(tokens[5].value.toString('utf8')).to.equal('disabled');
        expect(tokens[5].pos).to.equal(src.indexOf('disabled'));
        expect(tokens[5].line).to.equal(1);
        expect(tokens[5].linePos).to.equal(src.indexOf('disabled'));
        expect(tokens[5].type).to.equal(TokenType.TEXT);

        expect(tokens[6].value.toString('utf8')).to.equal('other');
        expect(tokens[6].pos).to.equal(src.indexOf('other'));
        expect(tokens[6].line).to.equal(1);
        expect(tokens[6].linePos).to.equal(src.indexOf('other'));
        expect(tokens[6].type).to.equal(TokenType.TEXT);

        expect(tokens[7].type).to.equal(TokenType.EQUALS);

        expect(tokens[8].value.toString('utf8')).to.equal('thing');
        expect(tokens[8].pos).to.equal(src.indexOf('"thing"'));
        expect(tokens[8].line).to.equal(1);
        expect(tokens[8].linePos).to.equal(src.indexOf('"thing"'));
        expect(tokens[8].type).to.equal(TokenType.TEXT);

        expect(tokens[9].type).to.equal(TokenType.END_TAG);
    });

    it('parses an output sequence', () =>
    {
        const src = '{{someVar}}';
        const tokens = lex(src);

        expect(tokens.length).to.equal(3);

        expect(tokens[0].type).to.equal(TokenType.OPEN_OUTPUT);

        expect(tokens[1].value.toString('utf8')).to.equal('someVar');
        expect(tokens[1].pos).to.equal(2);
        expect(tokens[1].line).to.equal(1);
        expect(tokens[1].linePos).to.equal(2);
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].type).to.equal(TokenType.END_BRACE);
    });

    it('parses a directive', () =>
    {
        const src = '{{# for thing of something }}{{/ for }}';
        const tokens = lex(src);

        expect(tokens.length).to.equal(7);

        expect(tokens[0].type).to.equal(TokenType.OPEN_START_DIRECTIVE);

        expect(tokens[1].value.toString('utf8')).to.equal('for');
        expect(tokens[1].pos).to.equal(4);
        expect(tokens[1].line).to.equal(1);
        expect(tokens[1].linePos).to.equal(4);
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].value.toString('utf8')).to.equal('thing of something');
        expect(tokens[2].pos).to.equal(7);
        expect(tokens[2].line).to.equal(1);
        expect(tokens[2].linePos).to.equal(7);
        expect(tokens[2].type).to.equal(TokenType.TEXT);

        expect(tokens[3].type).to.equal(TokenType.END_BRACE);

        expect(tokens[4].type).to.equal(TokenType.OPEN_END_DIRECTIVE);

        expect(tokens[5].value.toString('utf8')).to.equal('for');
        expect(tokens[5].pos).to.equal(33);
        expect(tokens[5].line).to.equal(1);
        expect(tokens[5].linePos).to.equal(33);
        expect(tokens[5].type).to.equal(TokenType.TEXT);

        expect(tokens[6].type).to.equal(TokenType.END_BRACE);
    });

    it('parses an output sequence with whitespace', () =>
    {
        const src = '{{\n someVar\n }}';
        const tokens = lex(src);

        expect(tokens.length).to.equal(3);

        expect(tokens[0].type).to.equal(TokenType.OPEN_OUTPUT);

        expect(tokens[1].value.toString('utf8')).to.equal('someVar');
        expect(tokens[1].pos).to.equal(2);
        expect(tokens[1].line).to.equal(1);
        expect(tokens[1].linePos).to.equal(2);
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].type).to.equal(TokenType.END_BRACE);
    });

    it('parses an output sequence with braces', () =>
    {
        const src = '{{{key: value}}}';
        const tokens = lex(src);

        expect(tokens.length).to.equal(3);

        expect(tokens[0].type).to.equal(TokenType.OPEN_OUTPUT);

        expect(tokens[1].value.toString('utf8')).to.equal('{key: value}');
        expect(tokens[1].pos).to.equal(2);
        expect(tokens[1].line).to.equal(1);
        expect(tokens[1].linePos).to.equal(2);
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].type).to.equal(TokenType.END_BRACE);
    });

    it('parses a tag with an output attribute', () =>
    {
        const tokens = lex('<p id={{myId}}>');

        expect(tokens.length).to.equal(8);

        expect(tokens[0].type).to.equal(TokenType.OPEN_START_TAG);

        expect(tokens[1].value.toString('utf8')).to.equal('p');
        expect(tokens[1].pos).to.equal(1);
        expect(tokens[1].line).to.equal(1);
        expect(tokens[1].linePos).to.equal(1);
        expect(tokens[1].type).to.equal(TokenType.TEXT);

        expect(tokens[2].value.toString('utf8')).to.equal('id');
        expect(tokens[2].pos).to.equal(3);
        expect(tokens[2].line).to.equal(1);
        expect(tokens[2].linePos).to.equal(3);
        expect(tokens[2].type).to.equal(TokenType.TEXT);

        expect(tokens[3].type).to.equal(TokenType.EQUALS);

        expect(tokens[4].type).to.equal(TokenType.OPEN_OUTPUT);

        expect(tokens[5].value.toString('utf8')).to.equal('myId');
        expect(tokens[5].pos).to.equal(8);
        expect(tokens[5].line).to.equal(1);
        expect(tokens[5].linePos).to.equal(8);
        expect(tokens[5].type).to.equal(TokenType.TEXT);

        expect(tokens[6].type).to.equal(TokenType.END_BRACE);

        expect(tokens[7].type).to.equal(TokenType.END_TAG);
    });

    it('handles dynamic tags', () =>
    {
        const tokens = lex('<{{currentPage}} slot="page" />');
        expect(tokens.length).to.equal(8);

        expect(tokens[0].type).to.equal(TokenType.OPEN_START_TAG);
        expect(tokens[1].type).to.equal(TokenType.OPEN_OUTPUT);
        expect(tokens[2].type).to.equal(TokenType.TEXT);
        expect(tokens[2].value.toString('utf8')).to.equal('currentPage');
        expect(tokens[3].type).to.equal(TokenType.END_BRACE);
        expect(tokens[4].type).to.equal(TokenType.TEXT);
        expect(tokens[4].value.toString('utf8')).to.equal('slot');
        expect(tokens[5].type).to.equal(TokenType.EQUALS);
        expect(tokens[6].type).to.equal(TokenType.TEXT);
        expect(tokens[6].value.toString('utf8')).to.equal('page');
        expect(tokens[7].type).to.equal(TokenType.CLOSE_END_TAG);
    });
});

const {expect} = require('chai');

const lex = require('../../src/lex');
const parse = require('../../src/parse');
const NodeType = require('../../src/NodeType');

describe('parse', () =>
{
    it('parses a text node', () =>
    {
        const src = 'This is the source';
        const tokens = lex(src);
        const nodes = parse(tokens);

        expect(nodes.length).to.equal(1);
        expect(nodes[0].type).to.equal(NodeType.TEXT);
        expect(nodes[0].children[0].children).to.equal(src);
    });

    it('parses a simple element', () =>
    {
        const src = '<p></p>';
        const tokens = lex(src);
        const nodes = parse(tokens);

        expect(nodes.length).to.equal(1);
        expect(nodes[0].type).to.equal(NodeType.ELEMENT);
        expect(nodes[0].children.length).to.equal(2);
        expect(nodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[0].children).to.equal('p');
        expect(nodes[0].children[1].type).to.equal(NodeType.ATTRIBUTES);
        expect(nodes[0].children[1].children).to.deep.equal([]);
    });

    it('parses a simple self closing tag', () =>
    {
        const src = '<img />';
        const tokens = lex(src);
        const nodes = parse(tokens);

        expect(nodes.length).to.equal(1);
        expect(nodes[0].type).to.equal(NodeType.ELEMENT);
        expect(nodes[0].children.length).to.equal(2);
        expect(nodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[0].children).to.equal('img');
        expect(nodes[0].children[1].type).to.equal(NodeType.ATTRIBUTES);
        expect(nodes[0].children[1].children).to.deep.equal([]);
    });

    it('parses an output structure', () =>
    {
        const src = '{{ someVar }}';
        const tokens = lex(src);
        const nodes = parse(tokens);

        expect(nodes.length).to.equal(1);
        expect(nodes[0].type).to.equal(NodeType.OUTPUT);
        expect(nodes[0].children.length).to.equal(1);
        expect(nodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[0].children).to.equal('someVar');
    });

    it('parses text attributes', () =>
    {
        const src = '<p id="myId" something="thing" disabled></p>';
        const tokens = lex(src);
        const nodes = parse(tokens);

        expect(nodes.length).to.equal(1);
        expect(nodes[0].type).to.equal(NodeType.ELEMENT);
        expect(nodes[0].children.length).to.equal(2);
        expect(nodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[0].children).to.equal('p');
        expect(nodes[0].children[1].type).to.equal(NodeType.ATTRIBUTES);
        expect(nodes[0].children[1].children.length).to.equal(3);

        const attributeNodes = nodes[0].children[1].children;
        expect(attributeNodes[0].type).to.equal(NodeType.ATTRIBUTE);
        expect(attributeNodes[0].children.length).to.equal(2);
        expect(attributeNodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[0].children[0].children).to.equal('id');
        expect(attributeNodes[0].children[1].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[0].children[1].children).to.equal('myId');

        expect(attributeNodes[1].type).to.equal(NodeType.ATTRIBUTE);
        expect(attributeNodes[1].children.length).to.equal(2);
        expect(attributeNodes[1].children[0].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[1].children[0].children).to.equal('something');
        expect(attributeNodes[1].children[1].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[1].children[1].children).to.equal('thing');

        expect(attributeNodes[2].type).to.equal(NodeType.ATTRIBUTE);
        expect(attributeNodes[2].children.length).to.equal(1);
        expect(attributeNodes[2].children[0].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[2].children[0].children).to.equal('disabled');
    });

    it('parses output attributes', () =>
    {
        const src = '<p id="myId" something={{thing}} disabled></p>';
        const tokens = lex(src);
        const nodes = parse(tokens);

        expect(nodes.length).to.equal(1);
        expect(nodes[0].type).to.equal(NodeType.ELEMENT);
        expect(nodes[0].children.length).to.equal(2);
        expect(nodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[0].children).to.equal('p');
        expect(nodes[0].children[1].type).to.equal(NodeType.ATTRIBUTES);
        expect(nodes[0].children[1].children.length).to.equal(3);

        const attributeNodes = nodes[0].children[1].children;
        expect(attributeNodes[0].type).to.equal(NodeType.ATTRIBUTE);
        expect(attributeNodes[0].children.length).to.equal(2);
        expect(attributeNodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[0].children[0].children).to.equal('id');
        expect(attributeNodes[0].children[1].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[0].children[1].children).to.equal('myId');

        expect(attributeNodes[1].type).to.equal(NodeType.ATTRIBUTE);
        expect(attributeNodes[1].children.length).to.equal(2);
        expect(attributeNodes[1].children[0].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[1].children[0].children).to.equal('something');
        expect(attributeNodes[1].children[1].type).to.equal(NodeType.OUTPUT);
        expect(attributeNodes[1].children[1].children[0].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[1].children[1].children[0].children).to.equal('thing');

        expect(attributeNodes[2].type).to.equal(NodeType.ATTRIBUTE);
        expect(attributeNodes[2].children.length).to.equal(1);
        expect(attributeNodes[2].children[0].type).to.equal(NodeType.VALUE);
        expect(attributeNodes[2].children[0].children).to.equal('disabled');
    });

    it('parses a directive', () =>
    {
        const src = '{{# for thing in things }}{{/ for }}';
        const tokens = lex(src);
        const nodes = parse(tokens);

        expect(nodes.length).to.equal(1);
        expect(nodes[0].type).to.equal(NodeType.DIRECTIVE);
        expect(nodes[0].children.length).to.equal(2);
        expect(nodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[0].children).to.equal('for');
        expect(nodes[0].children[1].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[1].children).to.equal('thing in things');
    });

    it('parses a directive with content', () =>
    {
        const src = '{{# for thing in things }}This is a {{thing}}{{/ for }}';
        const tokens = lex(src);
        const nodes = parse(tokens);

        expect(nodes.length).to.equal(1);
        expect(nodes[0].type).to.equal(NodeType.DIRECTIVE);
        expect(nodes[0].children.length).to.equal(4);
        expect(nodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[0].children).to.equal('for');
        expect(nodes[0].children[1].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[1].children).to.equal('thing in things');
        expect(nodes[0].children[2].type).to.equal(NodeType.TEXT);
        expect(nodes[0].children[2].children[0].children).to.equal('This is a ');
        expect(nodes[0].children[3].type).to.equal(NodeType.OUTPUT);
    });

    it('parses a comment', () =>
    {
        const src = '{{! a comment }}';
        const tokens = lex(src);
        const nodes = parse(tokens);

        expect(nodes.length).to.equal(1);
        expect(nodes[0].type).to.equal(NodeType.COMMENT);
        expect(nodes[0].children.length).to.equal(1);
        expect(nodes[0].children[0].type).to.equal(NodeType.VALUE);
        expect(nodes[0].children[0].children).to.equal('a comment');
    });
});

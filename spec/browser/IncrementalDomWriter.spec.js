const {expect} = require('chai');

const {patch} = require('incremental-dom');


const lex = require('../../src/lex');
const parse = require('../../src/parse');
const compile = require('../../src/compile');

function compileSource(src)
{
    return compile(
        parse(
            lex(src)
        ), {
            writer: 'incremental-dom',
        }
    );
}

function doEval(src)
{
    // eslint-disable-next-line no-eval
    return eval(`(function(){return ${src}})()`);
}

function render(template, root, data = {})
{
    patch(root, () => template(data));
}

function srcToNode(src, data = {})
{
    const root = document.createElement('div');
    const compiled = compileSource(src);
    const template = doEval(compiled);
    render(template, root, data);
    return root;
}

describe('IncrementalDomWriter', () =>
{
    it('writes a text node', () =>
    {
        const src = 'This is text';
        const root = srcToNode(src);
        expect(root.innerHTML).to.equal('This is text');
    });

    it('writes a simple html tag', () =>
    {
        const src = '<p>Some text...</p>';
        const root = srcToNode(src);
        expect(root.innerHTML).to.equal('<p>Some text...</p>');
    });

    it('writes attributes', () =>
    {
        const src = '<p id="myId">Some text...</p>';
        const root = srcToNode(src);
        expect(root.innerHTML).to.equal('<p id="myId">Some text...</p>');
    });

    it('compiles an output value', () =>
    {
        const src = '{{someVar}}';
        const root = srcToNode(src, {someVar: 'yay!'});
        expect(root.innerHTML).to.equal('yay!');
    });

    it('compiles an output attribute', () =>
    {
        const src = '<p id={{someVar}}>Some text...</p>';
        const root = srcToNode(src, {someVar: 'my-id'});
        expect(root.innerHTML).to.equal('<p id="my-id">Some text...</p>');
    });

    it('handles boolean attributes', () =>
    {
        const src = '<input type="text" disabled/>';
        const root = srcToNode(src, {});
        expect(root.innerHTML).to.equal('<input type="text" disabled="">');
        expect(root.firstChild.disabled).to.equal(true);
    });

    it('handles dynamic attributes', () =>
    {
        const src = '<p id="wrong" class="some-class" *={{myObject}}>Some text...</p>';
        const root = srcToNode(src, {myObject: {id: 'my-id'}});
        expect(root.innerHTML).to.equal('<p id="my-id" class="some-class">Some text...</p>');
    });

    it('allows a class to specified with an object', () =>
    {
        const src = '<p class={{classes}}>Some text...</p>';
        const root = srcToNode(src, {classes: {first: true, second: false, third: true}});
        expect(root.innerHTML).to.equal('<p class="first third">Some text...</p>');
    });

    it('allows a class to specified with an object literal', () =>
    {
        const src = '<p class={{{first: true, second: false, third: true}}}>Some text...</p>';
        const root = srcToNode(src, {});
        expect(root.innerHTML).to.equal('<p class="first third">Some text...</p>');
    });

    it('allows a class to specified with an array', () =>
    {
        const src = '<p class={{classes}}>Some text...</p>';
        const root = srcToNode(src, {classes: ['first', 'third']});
        expect(root.innerHTML).to.equal('<p class="first third">Some text...</p>');
    });

    it('allows a class to specified with an array literal', () =>
    {
        const src = '<p class={{[\'first\', \'third\']}}>Some text...</p>';
        const root = srcToNode(src, {classes: ['first', 'third']});
        expect(root.innerHTML).to.equal('<p class="first third">Some text...</p>');
    });

    it('writes an if directive', () =>
    {
        const src = '{{#if value}}OK!{{/if}}';
        const root1 = srcToNode(src, {value: true});
        expect(root1.innerHTML).to.equal('OK!');
        const root2 = srcToNode(src, {value: false});
        expect(root2.innerHTML).to.equal('');
    });

    it('writes a for directive', () =>
    {
        const src = '{{#for letter of letters}}<span>{{letter}}</span>{{/for}}';
        const root = srcToNode(src, {letters: 'abcd'});
        expect(root.innerHTML).to.equal('<span>a</span><span>b</span><span>c</span><span>d</span>');
    });
});

const {expect} = require('chai');

const lex = require('../../src/lex');
const parse = require('../../src/parse');
const compile = require('../../src/compile');

function compileSource(src)
{
    return compile(
        parse(
            lex(src)
        )
    );
}

function doEval(src)
{
    // eslint-disable-next-line no-eval
    return eval(`(function(){return ${src}})()`);
}

describe('compile', () =>
{
    it('compiles text', () =>
    {
        const src = 'This is text';

        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({})).to.equal('This is text');
    });

    it('compiles a simple html tag', () =>
    {
        const src = '<p>Some text...</p>';

        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({})).to.equal('<p>Some text...</p>');
    });

    it('compiles attributes', () =>
    {
        const src = '<p id="myId">Some text...</p>';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({})).to.equal('<p id="myId">Some text...</p>');
    });

    it('compiles an output value', () =>
    {
        const src = '{{someVar}}';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({someVar: 'yay!'})).to.equal('yay!');
    });

    it('compiles an output attribute', () =>
    {
        const src = '<p id={{someVar}}>Some text...</p>';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({someVar: 'my-id'})).to.equal('<p id="my-id">Some text...</p>');
    });

    it('handles boolean attributes', () =>
    {
        const src = '<input type="text" disabled/>';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({someVar: 'my-id'})).to.equal('<input type="text" disabled/>');
    });

    it('handles dynamic attributes', () =>
    {
        const src = '<p id="wrong" class="some-class" *={{myObject}}>Some text...</p>';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({myObject: {id: 'my-id'}})).to.equal('<p id="my-id" class="some-class">Some text...</p>');
    });

    it('allows a class to specified with an object', () =>
    {
        const src = '<p class={{classes}}>Some text...</p>';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({classes: {first: true, second: false, third: true}})).to.equal('<p class="first third">Some text...</p>');
    });

    it('allows a class to specified with an object literal', () =>
    {
        const src = '<p class={{{first: true, second: false, third: true}}}>Some text...</p>';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({})).to.equal('<p class="first third">Some text...</p>');
    });

    it('allows a class to specified with an array', () =>
    {
        const src = '<p class={{classes}}>Some text...</p>';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({classes: ['first', 'third']})).to.equal('<p class="first third">Some text...</p>');
    });

    it('allows a class to specified with an array literal', () =>
    {
        const src = '<p class={{[\'first\', \'third\']}}>Some text...</p>';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({})).to.equal('<p class="first third">Some text...</p>');
    });

    it('writes an if directive', () =>
    {
        const src = '{{#if value}}OK!{{/if}}';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({value: true})).to.equal('OK!');
        expect(template({value: false})).to.equal('');
    });

    it('writes a for directive', () =>
    {
        const src = '{{#for letter of letters}}<span>{{letter}}</span>{{/for}}';
        const compiled = compileSource(src);
        const template = doEval(compiled);
        expect(template({letters: 'abcd'})).to.equal('<span>a</span><span>b</span><span>c</span><span>d</span>');
    });
});

const {expect} = require('chai');

const aurelius = require('../../index');
function compileSource(src)
{
    return aurelius(src, {
        eval: true,
    });
}

describe('compile', () =>
{
    it('compiles text', () =>
    {
        const src = 'This is text';
        const template = compileSource(src);
        expect(template({})).to.equal('This is text');
    });

    it('compiles a simple html tag', () =>
    {
        const src = '<p>Some text...</p>';
        const template = compileSource(src);
        expect(template({})).to.equal('<p>Some text...</p>');
    });

    it('compiles attributes', () =>
    {
        const src = '<p id="myId">Some text...</p>';
        const template = compileSource(src);
        expect(template({})).to.equal('<p id="myId">Some text...</p>');
    });

    it('compiles an output value', () =>
    {
        const src = '{{someVar}}';
        const template = compileSource(src);
        expect(template({someVar: 'yay!'})).to.equal('yay!');
    });

    it('compiles an output attribute', () =>
    {
        const src = '<p id={{someVar}}>Some text...</p>';
        const template = compileSource(src);
        expect(template({someVar: 'my-id'})).to.equal('<p id="my-id">Some text...</p>');
    });

    it('handles boolean attributes', () =>
    {
        const src = '<input type="text" disabled/>';
        const template = compileSource(src);

        expect(template({someVar: 'my-id'})).to.equal('<input type="text" disabled/>');
    });

    it('handles dynamic attributes', () =>
    {
        const src = '<p id="wrong" class="some-class" *={{myObject}}>Some text...</p>';
        const template = compileSource(src);
        expect(template({myObject: {id: 'my-id'}})).to.equal('<p id="my-id" class="some-class">Some text...</p>');
    });

    it('allows a class to specified with an object', () =>
    {
        const src = '<p class={{classes}}>Some text...</p>';
        const template = compileSource(src);
        expect(template({classes: {first: true, second: false, third: true}})).to.equal('<p class="first third">Some text...</p>');
    });

    it('allows a class to specified with an object literal', () =>
    {
        const src = '<p class={{{first: true, second: false, third: true}}}>Some text...</p>';
        const template = compileSource(src);
        expect(template({})).to.equal('<p class="first third">Some text...</p>');
    });

    it('allows a class to specified with an array', () =>
    {
        const src = '<p class={{classes}}>Some text...</p>';
        const template = compileSource(src);
        expect(template({classes: ['first', 'third']})).to.equal('<p class="first third">Some text...</p>');
    });

    it('allows a class to specified with an array literal', () =>
    {
        const src = '<p class={{[\'first\', \'third\']}}>Some text...</p>';
        const template = compileSource(src);
        expect(template({})).to.equal('<p class="first third">Some text...</p>');
    });

    it('writes an if directive', () =>
    {
        const src = '{{#if value}}OK!{{/if}}';
        const template = compileSource(src);
        expect(template({value: true})).to.equal('OK!');
        expect(template({value: false})).to.equal('');
    });

    it('writes a for directive', () =>
    {
        const src = '{{#for letter of letters}}<span>{{letter}}</span>{{/for}}';
        const template = compileSource(src);
        expect(template({letters: 'abcd'})).to.equal('<span>a</span><span>b</span><span>c</span><span>d</span>');
    });

    it('writes a dynamic tag', () =>
    {
        const src = '<{{currentPage}} slot="page" />';
        const template = compileSource(src);
        expect(template({currentPage: 'my-page'})).to.equal('<my-page slot="page"/>');
    });

    it('can build attributes in a for loop', () =>
    {
        const src = '{{#for item of items}}<{{item.tag}} *={{item.props}}>{{item.text}}</?>{{/for}}';
        const template = compileSource(src);
        expect(template({
            items: [
                {tag: 'p', props: {id: 'first'}, text: 'one'},
                {tag: 'div', props: {id: 'second'}, text: 'two'},
            ],
        })).to.equal('<p id="first">one</p><div id="second">two</div>');
    });

    it('binds dynamic attributes to the current this context', () =>
    {
        const ctx = {
            shout(str) {return str.toUpperCase();},
            props() {return {super: 'dooper'};},
        };
        const src = '{{#for item of items}}<{{item.tag}} *={{this.props()}}>{{this.shout(item.text)}}</?>{{/for}}';
        const template = compileSource(src);
        expect(template.call(ctx, {
            items: [
                {tag: 'p', props: {id: 'first'}, text: 'one'},
                {tag: 'div', props: {id: 'second'}, text: 'two'},
            ],
        })).to.equal('<p super="dooper">ONE</p><div super="dooper">TWO</div>');
    });
});

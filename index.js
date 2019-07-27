const lex = require('./src/lex');
const parse = require('./src/parse');
const compile = require('./src/compile');

module.exports = function aurelius(src, options  = {})
{
    const {
        eval: evaluate = false,
    } = options;

    const compiled = compile(
        parse(
            lex(src, options),
            options
        ),
        options
    );

    if (evaluate)
    {
        // eslint-disable-next-line no-eval
        return eval(`(function(){return ${compiled}})()`);
    }

    return compiled;
};

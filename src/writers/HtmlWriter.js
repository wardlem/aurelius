const escapeString = require('../helpers/escapeString');
const escapeStringText = escapeString.toString().replace(/\n/g, '\n  ');

const HtmlWriter = module.exports;

HtmlWriter.writeIntro = function(name)
{
    return `function ${name}(data) {
  const __htmloutput__ = [];
  const __escapeString__ = ${escapeStringText};
  function __writeattr__(name, value) {
    if (value === true) {
      __htmloutput__.push(\` \${name}\`)
    } else if (name === 'class' && value != null && typeof value === 'object') {
      if (Array.isArray(value)) {
        __htmloutput__.push(\` \${name}="\${value.map(__escapeString__).join(' ')}"\`)
      } else {
        __htmloutput__.push(\` \${name}="\${Object.keys(value).filter((key) => Boolean(value[key])).map(__escapeString__).join(' ')}"\`)
      }
    } else if (value != null) {
      __htmloutput__.push(\` \${name}="\${__escapeString__(value)}"\`)
    }
  }
`;
};

HtmlWriter.writeTextNode = function(content, dynamicContent, ws)
{
    const quote = dynamicContent ? '' : "'";
    return `${ws}__htmloutput__.push(${quote}${escapeString(content)}${quote})`;
};

HtmlWriter.writeOutro = function()
{
    return '  return __htmloutput__.join(\'\')\n}';
};

HtmlWriter.writeElementOpenStart = function writeElementOpenStart(_tag, dynamicTag, _key, dynamicKey, ws)
{
    let keyStr = '';
    const tag = dynamicTag ? `\${${_tag}}` : _tag;
    const quote = dynamicTag ? '`' : "'";

    if (_key != null)
    {
        const key = dynamicKey ? _key : `"${escapeString(_key)}"`;
        keyStr = ` key=${key}`;
    }

    return `${ws}__htmloutput__.push(${quote}<${tag}${keyStr}${quote})`;
};

HtmlWriter.writeElementOpenEnd = function writeElementOpenEnd(_tag, _dynamicTag, selfClosing, ws)
{
    const close = selfClosing ? '/>' : '>';
    return `${ws}__htmloutput__.push('${close}')`;
};

HtmlWriter.writeElementClose = function writeElementClose(_tag, dynamicTag, ws)
{
    const tag = dynamicTag ? `\${${_tag}}` : _tag;
    const quote = dynamicTag ? '`' : "'";

    return `${ws}__htmloutput__.push(${quote}</${tag}>${quote})`;
};

HtmlWriter.writeAttribute = function writeAttribute(_name, dynamicName, _value, dynamicValue, ws)
{
    const quote = (dynamicName || dynamicValue) ? '`' : "'";

    const name = dynamicName ? `\${${_name}}` : _name;
    if (_value === true)
    {
        return `${ws}__htmloutput__.push(${quote} ${name}${quote})`;
    }

    if (dynamicValue)
    {
        const name = dynamicName ? _name : `'${escapeString(_name)}'`;
        return [
            `${ws}__writeattr__(${name}, ${_value})`,
        ].join('\n');
    }

    const value = `"${escapeString(_value)}"`;
    return `${ws}__writeattr__('${escapeString(name)}', ${value})`;
};

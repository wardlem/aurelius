const escapeString = require('../helpers/escapeString');

const IncrementalDomWriter = module.exports;

IncrementalDomWriter.writeIntro = function(name)
{
    return `function ${name} (data) {
  const __IncrementalDom__ = require('incremental-dom')
  const __elementOpenStart__ = __IncrementalDom__.elementOpenStart
  const __elementOpenEnd__ = __IncrementalDom__.elementOpenEnd
  const __elementClose__ = __IncrementalDom__.elementClose
  const __elementVoid__ = __IncrementalDom__.elementVoid
  const __attr__ = __IncrementalDom__.attr
  const __text__ = __IncrementalDom__.text
  function __writeattr__(name, value) {
    if (name === 'class' && value != null && typeof value === 'object') {
      if (Array.isArray(value)) {
        __attr__(name, value.join(' '))
      } else {
        __attr__(name, Object.keys(value).filter((key) => Boolean(value[key])).join(' '))
      }
    } else {
      __attr__(name, value)
    }
  }
`;
};

IncrementalDomWriter.writeOutro = function()
{
    return '}';
};

IncrementalDomWriter.writeTextNode = function(_content, dynamicContent, ws)
{
    const quote = dynamicContent ? '' : "'";
    const content = dynamicContent ? _content : escapeString(_content);
    return `${ws}__text__(${quote}${content}${quote})`;
};

IncrementalDomWriter.writeElementOpenStart = function writeElementOpenStart(_tag, dynamicTag, _key, dynamicKey, ws)
{
    const tag = dynamicTag ? _tag : `'${escapeString(_tag)}'`;

    if (_key != null)
    {
        const key = dynamicKey ? _key : `'${escapeString(_key)}'`;
        return `${ws}__elementOpenStart__(${tag}, ${key})`;
    }

    return `${ws}__elementOpenStart__(${tag})`;
};

IncrementalDomWriter.writeElementOpenEnd = function writeElementOpenEnd(_tag, dynamicTag, selfClosing, ws)
{
    if (selfClosing)
    {
        const tag = dynamicTag ? _tag : `'${escapeString(_tag)}'`;
        return `${ws}__elementOpenEnd__()\n${ws}__elementClose__(${tag})`;
    }

    return `${ws}__elementOpenEnd__()`;
};

IncrementalDomWriter.writeElementClose = function writeElementClose(_tag, dynamicTag, ws)
{
    const tag = dynamicTag ? _tag : `'${escapeString(_tag)}'`;
    return `${ws}__elementClose__(${tag})`;
};

IncrementalDomWriter.writeAttribute = function writeAttribute(_name, dynamicName, _value, dynamicValue, ws)
{
    const name = dynamicName ? _name : `'${escapeString(_name)}'`;
    const value = dynamicValue ? _value : `'${escapeString(_value)}'`;

    return `${ws}__writeattr__(${name}, ${value})`;
};

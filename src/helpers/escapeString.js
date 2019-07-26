function escapeString(string)
{
    return Array.from(string).map((c) =>
    {
        switch (c)
        {
            case '\0':
                return '\\0';
            case '"':
                return '\\"';
            case "'":
                return "\\'";
            case '`':
                return '\\`';
            case '\\':
                return '\\\\';
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '\v':
                return '\\v';
            case '\t':
                return '\\t';
            case '\b':
                return '\\b';
            case '\f':
                return '\\f';
            default:
                return c;
        }
    }).join('');
}

module.exports = escapeString;

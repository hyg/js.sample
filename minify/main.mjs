import {minify} from 'minify';
import tryToCatch from 'try-to-catch';

const options = {
    html: {
        removeAttributeQuotes: false,
        removeOptionalTags: false,
    },
};

const [error, data] = await tryToCatch(minify, '../IM/XMPP.js', options);

if (error)
    console.error(error.message);

console.log(data);
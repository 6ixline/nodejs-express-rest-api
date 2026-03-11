const slugify = require("slugify");

function toSlug(name) {
    if (typeof name !== 'string' || !name.trim()) {
        throw new Error('Invalid slug value');
    }
    return slugify(name, {
        lower: true,       
        strict: true,      
        locale: 'en',     
        trim: true,
    });
}

module.exports = toSlug;
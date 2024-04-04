const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

const cachedText = {}

var addEvent = function (el, type, fn) {
    if (el.addEventListener) el.addEventListener(type, fn, false);
    else el.attachEvent("on" + type, fn);
};

var extend = function (obj, ext) {
    for (var key in ext) if (ext.hasOwnProperty(key)) obj[key] = ext[key];
    return obj;
};

const defaultSettings = () => {return {
    xScale: null,
    yScale: null,
    scale: 1,
    minFontSize: -1 / 0,
    maxFontSize: 1 / 0,
    font: "monospace",
    property: "innerText",
    debug: false,
}}

const resize = function(el, options)
{
    var settings = extend(defaultSettings(), options);
    const xCompressor = settings.xScale || settings.scale;
    const yCompressor = settings.yScale || settings.scale;
    const bounds = el.getBoundingClientRect();
    const width = bounds.width * xCompressor;
    const height = bounds.height * yCompressor;

    if (bounds.width == 0 || bounds.height == 0)
        return setTimeout(() => resize(el, options), 100);

    // 16px is the test value because it scales linearly
    const test_val = 16;

    const string = el[settings.property]
    const cacheString = string+":"+settings.font
    let measure = cachedText[cacheString]
    if (!measure)
    {
        context.font = `${test_val}px ${settings.font}`;
        measure = context.measureText(string);
        cachedText[cacheString] = measure
        // console.log("Cached: "+cacheString)
    }

    const font_size =
        test_val * Math.min(width / measure.width, height / 18.4);
    el.style.fontSize = font_size + "px";

    if (settings.debug)
        console.log(width, height, string, font_size)
}

const fitText = function (el, options) {
    

    var fit = function (el) {
        var resizer = function () {
            resize(el, options)
        };

        // Call once to set.
        resizer();

        addEvent(window, "resize", resizer);
        addEvent(window, "change", resizer);
        addEvent(window, "orientationchange", resizer);
    };

    if (el.length) for (var i = 0; i < el.length; i++) fit(el[i]);
    else fit(el);

    // return set of elements
    return el;
};

export {fitText, resize}
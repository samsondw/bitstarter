#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("Error: File %s does not exist.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var loadFile = function(filepath) {
    return fs.readFileSync(filepath);
};

var loadChecks = function(checksfile) {
    var checks = loadFile(checksfile);
    return JSON.parse(checks);
};

var checkHtmlBuffer = function(htmlbuffer, checksfile) {
    $ = cheerio.load(htmlbuffer);
    var checks = loadChecks(checksfile).sort();
    var results = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        results[checks[ii]] = present;
    }
    var out = JSON.stringify(results, null, 4);
    console.log(out);
};

var checkUrl = function(url, checksfile) {
    rest.get(url).on('complete', function(result) {
        if(result instanceof Error) {
            console.log("URL: " + url);
            console.log("Error: " + result.message);
            process.exit(1);
        } else {
            checkHtmlBuffer(result, checksfile);
        }
    });
};

var checkHtmlFile = function(htmlfile, checksfile) {
    var html = loadFile(htmlfile);
    checkHtmlBuffer(html, checksfile);
};

if(require.main == module) {
    program
        .option('-u, --url <link_address>', 'URL address of html file.')
        .option('-f, --file <html_file>', 'Path to html file. Defaults to ' + HTMLFILE_DEFAULT, clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to JSON rules file. Defaults to ' + CHECKSFILE_DEFAULT, clone(assertFileExists), CHECKSFILE_DEFAULT)
        .parse(process.argv);
    var buf = new Buffer(0);
    if(program.url != undefined) 
        checkUrl(program.url, program.checks);
    else if(program.file != undefined) 
        checkHtmlFile(program.file, program.checks);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

var fs = require('fs');
var path = require('path');
var DirectoryNames = ['bll', 'const', 'dal', 'handlers', 'lib', 'middleware', 'models', 'routers', 'test'];
var process = require('child_process');
var co = require('co');
var Promise = require('bluebird');
var files = [];


function getFiles(directory) {
    fs.readdirSync(directory).forEach(function (filename) {
        var fullPath;
        var stat;
        var match;

        // Skip itself
        if (filename === 'index.js' || /^\./.test(filename)) {
            return;
        }

        fullPath = path.join(directory, filename);
        stat = fs.statSync(fullPath);

        if (stat.isDirectory() && DirectoryNames.indexOf(filename) !== -1) {
            getFiles(fullPath);
        } else {
            match = /(\w+)\.js$/.exec(filename);

            if (match) {
                //压缩
                files.push(fullPath);
                // process.exec(`uglifyjs ${fullPath} -m -o ${fullPath}`, function (error, stdout, stderr) {
                //     if (error !== null) {
                //         console.log('exec error: ' + error);
                //     }
                // });
            }
        }
    });

    return files;
}


co(function* () {
    let files = getFiles(__dirname);
    let pExec = Promise.promisify(process.exec);
    let amount = files.length;
    let count = 0;

    for(let file of files) {
        try {
            let [stdout, stderr] = yield pExec(`uglifyjs ${file} -m -o ${file}`);
            ++count;
            console.log(`${file} has been processed... ${count}/${amount}`);
        } catch(error) {
            console.error(`${file} has been processed failed... error: ${error.message}, ${count}/${amount}`);
            process.exit(0);
        }
    }
});


#!/usr/bin/env node


var recursiveReadSync = require('recursive-readdir-sync');

const playfieldYamlPattern = /.*playfield.yaml$/;
const playfieldNameExtractionPattern = /.*\/(.*)\/Playfields\/(.*)\/playfield.yaml$/;
const featureExtractor = require('./extract-features');
const yaml = require('js-yaml');
const fs = require('fs');

if (require.main === module) {
    var argv = require('minimist')(process.argv.slice(2),{boolean:true, stopEarly:true});
    let sourcePath = argv._.pop();
    let files = recursiveReadSync(sourcePath);
    let playfieldInfos = files
        .map(x=>playfieldNameExtractionPattern.exec(x))
        .filter(x=>x)
        .map(x=>{return {path:x[0], scenario: x[1], playfieldName:x[2]}});

    let playfieldItems = playfieldInfos
        .map(playfieldInfoToPlayfieldItemCollection)
        .reduce((x,y)=>x.concat(y),[])


    playfieldItems.forEach(x=>{
        let out = JSON.stringify(x);
        console.log(out);
    });
}

function playfieldInfoToPlayfieldItemCollection(info){
    let sourceStream = fs.readFileSync(info.path, 'utf8');

    try {
        var sourceData = yaml.safeLoad(sourceStream, {onWarning:x=>x});
    } catch(ex) {
        let outObject = Object.assign(info, ex);
        delete outObject.mark;

        console.error(JSON.stringify(outObject));
        return;
    }



    let playfieldItems = featureExtractor(sourceData);
    let results = playfieldItems.map(x=>Object.assign(x, info));
    return results;
}



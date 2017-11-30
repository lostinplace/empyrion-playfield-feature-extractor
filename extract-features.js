#!/usr/bin/env node

const packageInfo = require('./package.json');
const namespace = packageInfo.id;
const uuidv5 = require("uuid/v5");

function extractFeaturesFromItem(anItem, unindexedReferenceDescription = "", indexedReferencedDescription = ""){

    let json = JSON.stringify(anItem);
    try {
        var id = uuidv5(json, namespace);
    } catch (ex){
        console.log(ex);
    }

    let propertyName = unindexedReferenceDescription.split('.').pop();

    var result = {
        indexedReference: indexedReferencedDescription || ".",
        unindexedReference: unindexedReferenceDescription || ".",
        propertyName: propertyName,
        value: anItem,
        childReferences: {},
        type:"value"
    };

    let childExtractor = () => []

    if(typeof  anItem == "object" && Array.isArray(anItem)){
        childExtractor = extractChildrenFromArrayItem;
        result.type="array"
    } else if (typeof  anItem == "object"){
        childExtractor = extractChildrenFromObjectItem;
        result.type="object"
    }

    let children = childExtractor(...arguments);

    result.childReferences = extractReferencesFromChildren(children, result.indexedReference);
    result.id=id;

    var output = [result].concat(children);
    return output;
}

const simpleIdentifierPattern = /^[\w\d]+$/;

function extractChildrenFromObjectItem(anItem, unindexedReferenceDescription = "", indexedReferenceDescription = ""){
    let output = [];

    for(let index in anItem){
        let quotedPropertyName = simpleIdentifierPattern.test(index) ? index: `"${index}"`;
        let unindexedReference = `${unindexedReferenceDescription}.${quotedPropertyName}`;
        let indexedReference = `${indexedReferenceDescription}.${quotedPropertyName}`;
        let child = extractFeaturesFromItem(anItem[index], unindexedReference, indexedReference );

        output = output.concat(child);
    }

    return output;
}

function extractReferencesFromChildren(children, indexedSourceReference) {

    let childReferenceObjects = children.map(x=>{
        let out = {};
        let relativeIndex = x.indexedReference.slice(indexedSourceReference.length);
        let value = x.type==='value'? x.value : { id: x.id };
        out[relativeIndex] = value;
        return out;
    });
    let referenceDict = childReferenceObjects.reduce((x,y)=>Object.assign(x,y), {});

    return referenceDict;
}

function extractChildrenFromArrayItem(anItem, unindexedReferenceDescription = "", indexedReferenceDesciption = "") {
    let unindexedReference = `${unindexedReferenceDescription}[]`;
    var result = anItem.map((x,i)=>extractFeaturesFromItem(x, unindexedReference, `${indexedReferenceDesciption}[${i}]`))
        .reduce((x,y)=>x.concat(y), []);
    return result;
}


module.exports = extractFeaturesFromItem;


if (require.main === module) {
    var argv = require('minimist')(process.argv.slice(2),{boolean:true, stopEarly:true});
    let sourcePath = argv._.pop();
    let sourceData;

    if(argv.yaml){
        const yaml = require('js-yaml');
        const fs = require('fs');
        let sourceStream = fs.readFileSync(sourcePath, 'utf8');
        sourceData = yaml.safeLoad(sourceStream);
    }else{
        sourceData = require(sourcePath);
    }

    let result = extractFeaturesFromItem(sourceData);

    result.forEach(x=>{
        let out = JSON.stringify(x);
        console.log(out);
    });
}





const fs = require('fs')
const input = require('./input.json');

const output = {elements:[], deletes: [], source: 'magicdraw'};
const toRemove = ['_appliedStereotypeIds', 'appliedStereotypeInstanceId', 'stereotypedElementId', '_modified', '_modifier', '_commitId',
    '_docId', '_creator', '_created', '_projectId', '_refId', '_inRefIds'];
const ASIDS = '_appliedStereotypeIds';
const ASID = 'appliedStereotypeInstanceId';
const asiMapping = {};
function getType(values) {
    if (!values || values.length < 1) {
        return 'StringTaggedValue';
    }
    switch (values[0].type) {
        case 'LiteralBoolean':
            return 'BooleanTaggedValue';
        case 'LiteralInteger':
            return 'IntegerTaggedValue';
        case 'LiteralReal':
            return 'RealTaggedValue';
        case 'ElementValue':
        case 'InstanceValue':
            return 'ElementTaggedValue';
        default:
            return 'StringTaggedValue';
    }
}

function getValues(values) {
    if (!values || values.length < 1) {
        return [];
    }
    const res = [];
    for (const v of values) {
        if (v.hasOwnProperty('value')) {
            res.push({value: v.value});
        } else if (v.instanceId) {
            res.push(v.instanceId);
        } else if (v.elementId) {
            res.push(v.elementId);
        }
    }
    return res;
}
function cleanValue(val, skip) {
    if (!skip) {
        val.taggedValueIds = [];
        val.appliedStereotypeIds = [];
    }
    if (val.hasOwnProperty(ASIDS)) {
        delete val[ASIDS];
    }
    if (val.hasOwnProperty(ASID)) {
        delete val[ASID];
    }
    if (val.visibility) {
        val.visibility = null; //value specs should have null visibility?
    }
    if (val.operand) {
        for (let o of val.operand) {
            cleanValue(o);
        }
    }
    if (val.min) {
        cleanValue(val.min);
    }
    if (val.max) {
        cleanValue(val.max);
    }
    if (val.expr) {
        cleanValue(val.expr);
    }
}
for (const e of input.elements) {
    if (e.type === 'InstanceSpecification' && e.id.endsWith('_asi')) {
        asiMapping[e.id] = e;
    }
}
for (const e of input.elements) {
    const type = e.type;
    const id = e.id;
    if (type === 'InstanceSpecification' && id.endsWith('_asi')) {
        output.deletes.push({id: id});
        continue;
    }
    const newe = JSON.parse(JSON.stringify(e));
    if (id.indexOf('_asi-slot-') > 0 && type === 'Slot') {
        const index = id.indexOf('_asi-slot-');
        newe.ownerId = id.substring(0, index);
        newe.taggedValueOwnerId = id.substring(0, index);
        newe.tagDefinitionId = e.definingFeatureId ? e.definingFeatureId : null;
        newe.type = getType(e.value);
        if (newe.type === 'ElementTaggedValue') {
            newe.valueIds = getValues(e.value);
            delete newe.value;
        } else {
            newe.value = getValues(e.value);
            for (const val of newe.value) {
                cleanValue(val, true);
            }
        }
        if (newe.hasOwnProperty('definingFeatureId')) {
            delete newe['definingFeatureId'];
        }
        if (newe.hasOwnProperty('owningInstanceId')) {
            delete newe['owningInstanceId'];
        }
    }
    if (e.hasOwnProperty(ASIDS)) {
        newe.appliedStereotypeIds = e[ASIDS];
    }
    newe.taggedValueIds = [];
    if (e[ASID] && asiMapping[e[ASID]]) {
        newe.taggedValueIds = asiMapping[e[ASID]].slotIds;
    }
    for (const key of toRemove) {
        if (newe.hasOwnProperty(key)) {
            delete newe[key];
        }
    }
    if ((newe.type === 'Slot') && newe.value) { //fix keys in embedded value spec objects
        for (const val of newe.value) {
            cleanValue(val);
        }
    }
    if (newe.value && !Array.isArray(newe.value)) {
        cleanValue(newe.value);
    }
    if (newe.defaultValue) {
        cleanValue(newe.defaultValue);
    }
    if (newe.upperValue) {
        cleanValue(newe.upperValue);
    }
    if (newe.lowerValue) {
        cleanValue(newe.lowerValue);
    }
    if (newe.specification) {
        cleanValue(newe.specification);
    }
    output.elements.push(newe);
}
fs.writeFileSync('output.json', JSON.stringify(output));

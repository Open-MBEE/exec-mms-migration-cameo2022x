const fs = require('fs')
const input = require('./input.json');

const output = {elements:[], deletes: [], source: 'magicdraw'};
const toRemove = ['_appliedStereotypeIds', 'appliedStereotypeInstanceId', '_modified', '_modifier', '_commitId',
    '_docId', '_creator', '_created', '_projectId', '_refId', '_inRefIds'];
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
        }
    }
    newe.appliedStereotypeIds = e._appliedStereotypeIds;
    newe.taggedValueIds = [];
    if (e.appliedStereotypeInstanceId && asiMapping[e.appliedStereotypeInstanceId]) {
        newe.taggedValueIds = asiMapping[e.appliedStereotypeInstanceId].slotIds;
    }
    for (const key of toRemove) {
        if (newe.hasOwnProperty(key)) {
            delete newe[key];
        }
    }
    output.elements.push(newe);
}
fs.writeFileSync('output.json', JSON.stringify(output));

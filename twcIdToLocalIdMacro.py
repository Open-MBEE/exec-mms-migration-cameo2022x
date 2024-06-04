
import re

# from com.nomagic.magicdraw.automaton import AutomatonMacroAPI
from com.nomagic.magicdraw.core import Application
from com.nomagic.magicdraw.openapi.uml import SessionManager
from com.nomagic.uml2.ext.jmi.helpers import ModelHelper
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import Property
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import Slot
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import LiteralString
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import StringTaggedValue
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import NamedElement
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import Package
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import Comment
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import Constraint

from org.openmbee.mdk.api.incubating.convert import Converters

# run this to replace twc ids in strings to local ids, this is only for VE cross referencing purposes, if not using VE, don't need to run this

replacementCount = 0
res = [re.compile('id="([0-9a-z\\-]+)"'), re.compile("/([0-9a-z\\-]+)"), re.compile("get\\('([0-9a-z\\-]+)'\\)"), re.compile('\\(([0-9a-z\\-]+)\\)'), re.compile("id='([0-9a-z\\-]+)'")]

def replaceElementsRecursively(element):
    global replacementCount

    for ownedElement in element.getOwnedElement():
        replaceElementsRecursively(ownedElement)
    if (replaceDocumentation(element)):
        print 'doc', element.getHumanName(), '<', element.getLocalID(), '>'
        replacementCount += 1
    if (replaceValue(element)):
        print 'value', element.getHumanName(), '<', element.getLocalID(), '>'
        replacementCount += 1
    if (replaceName(element)):
        print 'name', element.getHumanName(), '<', element.getLocalID(), '>'
        replacementCount += 1

def replaceDocumentation(element):
    beforeComment = ModelHelper.getComment(element)
    if (beforeComment is None):
        return False
    afterComment = replaceString(beforeComment)
    if (afterComment == beforeComment):
        return False
    ModelHelper.setComment(element, afterComment)
    return True

def replaceValue(element):
    if (isinstance(element, Property)):
        defaultValue = element.getDefaultValue()
        if (not isinstance(defaultValue, LiteralString)):
            return False
        beforeValue = defaultValue.getValue()
        afterValue = replaceString(beforeValue)
        # print beforeValue
        if (afterValue == beforeValue):
            return False
        defaultValue.setValue(afterValue)
        return True
    elif (isinstance(element, Slot)):
        changed = False
        for value in element.getValue():
            if (not isinstance(value, LiteralString)):
                continue
            beforeValue = value.getValue()
            afterValue = replaceString(beforeValue)
            if (afterValue != beforeValue):
                value.setValue(afterValue)
                changed = True
        return changed
    elif (isinstance(element, Comment)):
        beforeBody = element.getBody()
        if beforeBody is None:
            return False
        afterBody = replaceString(beforeBody)
        if afterBody == beforeBody:
            return False
        element.setBody(afterBody)
        return True
    elif (isinstance(element, Constraint)):
        value = element.getSpecification()
        if (not isinstance(value, LiteralString)):
            return False
        beforeValue = value.getValue()
        afterValue = replaceString(beforeValue)
        if (beforeValue == afterValue):
            return False
        value.setValue(afterValue)
        return True
    elif (isinstance(element, StringTaggedValue)):
        values = element.getValue()
        l = []
        replaced = False
        for value in values:
            after = replaceString(value)
            if (after != value):
                replaced = True
                Application.getInstance().getGUILog().log('[INFO] StringTaggedValue replaced ' + value + ' with ' + after)
            l.append(after)
        if replaced:
            values.clear()
            values.addAll(l)
            return True
    return False

def replaceName(element):
    if (not isinstance(element, NamedElement)):
        return False
    beforeName = element.getName()
    afterName = replaceString(beforeName)
    if (afterName == beforeName):
        return False
    element.setName(afterName)
    return True

def replaceString(s):
    replaced = s
    for re in res:
        results = re.findall(replaced)
        for result in results:
            instance = project.getElementByID(result)
            if instance is not None:
                id = Converters.getElementToIdConverter().apply(instance)
                replaced = replaced.replace(result, id)
                Application.getInstance().getGUILog().log('[INFO] replacing ' + result + ' with ' + id)
    return replaced

project = Application.getInstance().getProject()
if (SessionManager.getInstance().isSessionCreated(project)):
    SessionManager.getInstance().cancelSession(project)
SessionManager.getInstance().createSession(project, 'Fixing twc server ids in cfs to local ids')
replaceElementsRecursively(project.getModel())
SessionManager.getInstance().closeSession(project)
Application.getInstance().getGUILog().log('[INFO] Fixed cross-reference(s) in ' + str(replacementCount) + ' element(s).')

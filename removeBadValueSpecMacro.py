from com.nomagic.magicdraw.core import Application
from com.nomagic.magicdraw.openapi.uml import SessionManager
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import ValueSpecification
from com.nomagic.uml2.ext.magicdraw.classes.mdkernel import Package

# run this as a macro in cameo in order to remove elements that prevents export to mms
# elements removed are ValueSpecifications that live directly under a package, they are invisible in cameo unless specifically shown in filter options
deleteCount = 0
bads = []
def replaceElementsRecursively(element):
    global deleteCount
    global bads
    for ownedElement in element.getOwnedElement():
        if isinstance(ownedElement, Package):
            replaceElementsRecursively(ownedElement)
        if isinstance(ownedElement, ValueSpecification):
            Application.getInstance().getGUILog().log(ownedElement.getID())
            bads.append(ownedElement)
            deleteCount += 1


project = Application.getInstance().getProject()
if (SessionManager.getInstance().isSessionCreated(project)):
    SessionManager.getInstance().cancelSession(project)
SessionManager.getInstance().createSession(project, 'Fixing bad instance ')
replaceElementsRecursively(project.getModel())
for e in bads:
    e.dispose()
SessionManager.getInstance().closeSession(project)
Application.getInstance().getGUILog().log('[INFO] deleted ' + str(deleteCount) + ' element(s).')

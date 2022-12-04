export interface TreeCache {
    [msgId: string]: TreeNode;
}

/**
 * TreeNode consists of
 * id: the id of a particular event
 * parent: the parent that caused this event
 * children: the children that were spawned from this event
 * time: the time this event took place
 * clazz: the class of the event
 * sender: the sender node for this event
 * recipient: the recipient node for this event
 */
export interface TreeNode {
    id: string;
    parent: { [stimulusID: string]: TreeNode };
    children: { [childIDs: string]: TreeNode };
    time: number;
    clazz: string;
    sender: string;
    recipient: string;
}
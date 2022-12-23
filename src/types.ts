/**
 * A cache to store the whole tree of events when forming the tree.
 * The cache maps a message ID to a tree node.
 * @param msgId: the message ID as a string
 */
export interface TreeCache {
    [msgId: string]: TreeNode;
}

/**
 * TreeNode consists of
 * @param id: the id of a particular event
 * @param parent: the parent that caused this event
 * @param children: the children that were spawned from this event
 * @param time: the time this event took place
 * @param clazz: the class of the event
 * @param sender: the sender node for this event
 * @param recipient: the recipient node for this event
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
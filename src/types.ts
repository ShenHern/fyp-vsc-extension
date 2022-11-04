export interface TreeCache {
    [msgId: string]: TreeNode;
}

export interface TreeNode {
    parent: { [stimulusID: string]: TreeNode };
    children: { [childIDs: string]: TreeNode };
    time: number;
    clazz: string;
    sender: string;
    recipient: string;
}
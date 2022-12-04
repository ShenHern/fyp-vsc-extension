export interface TreeCache {
    [msgId: string]: TreeNode;
}

export interface TreeNode {
    id: string;
    parent: { [stimulusID: string]: TreeNode };
    children: { [childIDs: string]: TreeNode };
    time: number;
    clazz: string;
    sender: string;
    recipient: string;
}
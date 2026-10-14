import { chain } from "ramda";

/**
 * Flatten an array containing a tree structure
 * @param {T[]} trees - An array containing a tree structure
 * @returns {T[]} - Flattened array
 */
export function flattenTrees<T extends { children?: T[] }>(trees: T[] = []): T[] {
	return chain(node => {
		const children = node.children || [];
		return [node, ...flattenTrees(children)];
	}, trees);
}

export function convertFlatArrayToTree(flatArray: any[]) {
	const nodeMap = new Map();
	const rootNodes: any[] = [];

	// Step 1: Create a map for quick lookup
	flatArray.forEach(item => {
		nodeMap.set(item.id, { ...item });
	});

	// Step 2: Build the tree structure
	flatArray.forEach(item => {
		const node = nodeMap.get(item.id);

		if (item.parentId && nodeMap.has(item.parentId)) {
			const parentNode = nodeMap.get(item.parentId);
			if (parentNode.children === undefined) parentNode.children = [];
			parentNode.children.push(node);
		} else {
			rootNodes.push(node); // This is a root node
		}
	});

	return rootNodes;
}

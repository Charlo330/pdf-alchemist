export function rootfilePath(basename: string): string {
	return `${basename}.md`;
}

export function folderPath(folderPath: string, basename: string): string {
	if (folderPath.startsWith("./")) {
		folderPath = folderPath.slice(2);
	}

	return `${folderPath}/${basename}.md`;
}

export function relativeFolderPath(
	pdfPath: string,
	relativetoPdfPath: string,
): string {
	if (relativetoPdfPath.startsWith("./")) {
		relativetoPdfPath = relativetoPdfPath.slice(2);
	}
	const folderPath = pdfPath.split("/").slice(0, -1).join("/");

	return `${folderPath}/${relativetoPdfPath}`;
}

export function sameFolderPath(pdfPath: string, basename: string): string {
	if (pdfPath.startsWith("./")) {
		pdfPath = pdfPath.slice(2);
	}
	if (pdfPath.endsWith("/")) {
		pdfPath = pdfPath.slice(0, -1);
	}
	const folderPath = pdfPath.split("/").slice(0, -1).join("/");
	return `${folderPath}/${basename}.md`;
}

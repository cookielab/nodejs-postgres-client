const sleep = async (ms: number): Promise<void> => {
	return await new Promise((resolve: () => void): void => {
		setTimeout(resolve, ms);
	});
};

export {sleep};

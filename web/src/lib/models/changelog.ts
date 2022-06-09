export type Changelog = {
	latest: ChangelogContent;
	older: ChangelogContent[];
};

export type ChangelogContent = {
	version: string;
	date: string;
	content: {
		breaking?: string[];
		features?: string[];
	};
};

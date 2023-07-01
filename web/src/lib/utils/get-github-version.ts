import axios from 'axios';

type GithubRelease = {
  tag_name: string;
};

export const getGithubVersion = async (): Promise<string> => {
  const { data } = await axios.get<GithubRelease>('https://api.github.com/repos/immich-app/immich/releases/latest', {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  return data.tag_name;
};

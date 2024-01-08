import {toc as Toc_Albums ,metadata as Metadata_Albums} from './Albums-FAQ.md';
import {toc as Toc_Assets ,metadata as Metadata_Assets} from './Assets-FAQ.md';
import {toc as Toc_Docker ,metadata as Metadata_Docker} from './Docker-FAQ.md';
import {toc as Toc_External ,metadata as Metadata_External} from './External-Library-FAQ.md';
import {toc as Toc_Machine ,metadata as Metadata_Machine} from './Machine-Learning-FAQ.md';
import {toc as Toc_Mobile ,metadata as Metadata_Mobile} from './Mobile-App-FAQ.md';
import {toc as Toc_Performance ,metadata as Metadata_Performance} from './Performance-FAQ.md';
import {toc as Toc_User ,metadata as Metadata_User} from './User-FAQ.md';
const combined = {
Albums: { toc: Toc_Albums, metadata: Metadata_Albums },
Assets: { toc: Toc_Assets, metadata: Metadata_Assets },
Docker: { toc: Toc_Docker, metadata: Metadata_Docker },
External: { toc: Toc_External, metadata: Metadata_External },
Machine: { toc: Toc_Machine, metadata: Metadata_Machine },
Mobile: { toc: Toc_Mobile, metadata: Metadata_Mobile },
Performance: { toc: Toc_Performance, metadata: Metadata_Performance },
User: { toc: Toc_User, metadata: Metadata_User },
};

// Convert the object to an array
const combinedArray = Object.keys(combined).map(key => ({
  key,
  toc: combined[key].toc,
  metadata: combined[key].metadata
}));

// Sort the array based on sidebar_position
combinedArray.sort((a, b) => a.metadata.frontMatter.sidebar_position - b.metadata.frontMatter.sidebar_position);

// Convert the array back to an object
export const sortedCombined = {};
combinedArray.forEach(item => {
  sortedCombined[item.key] = {
    toc: item.toc,
    metadata: item.metadata
  };
});
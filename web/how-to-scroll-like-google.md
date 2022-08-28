# How to scroll like Google Photos

## Glossary

1. Section: a group of photos within a month
2. Segment: a group of photos within a day

## Assumption

* The photo's thumbnail is a square box with the size of 235px 

## Order of Implementation

### Custom scroolbar

* We need the custom scroll bar which represents the entire viewport.
* The viewport can be estimated by the total number of the photos and the width of the occupied photo's grid

```typescript
	const thumbnailHeight = 235;

	const unwrappedWidth = (3 / 2) * totalPhotoCount * thumbnailHeight * (7 / 10);
	const rows = Math.ceil(unwrappedWidth / viewportWidth);

	const scrollbarHeight = rows * thumbnailHeight;
```

* Next, we will need to know when we click on a random position on the scroll bar, which section will fit into the page. Thus, we will need to know the section height as well.
* The section height can be calculated by the method above by putting `totalPhotoCount` as the count of the total photos within a month. We can use the following data structure to represent a list of section.

```json
{
  [
    {
      "section": "2022_08",
      "count": 100,
      "viewportHeight": 4000
    },
    {
      "section": "2022_07",
      "count": 50,
      "viewportHeight": 2000
    }
  ]
}
```

* With the known viewport height of each section and the total viewport height, we can build out the custom scrollbar with information of each section layout relatively and interactively on the scrollbar by using the percentages height.
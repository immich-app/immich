# Facial Recognition

## Overview

Immich recognizes faces in your photos and videos and groups them together into people. You can then assign names to these people and search for them.

The list of people is shown in the Explore page.

<img src={require('./img/facial-recognition-1.webp').default} title='Facial Recognition 1' />

Upon clicking on a person, a list of assets that contain their face will be shown.

<img src={require('./img/facial-recognition-2.webp').default} title='Facial Recognition 2' />

The asset detail view will also show the faces that are recognized in the asset.

<img src={require('./img/facial-recognition-3.webp').default} title='Facial Recognition 3' />

## Actions

Additional actions you can do include:

- Changing the feature photo of the person
- Setting a person's date of birth
- Merging two or more detected faces into one person
- Hiding the faces of a person from the Explore page and detail view
- Assigning an unrecognized face to a person

It can be found from the app bar when you access the detail view of a person.

<img src={require('./img/facial-recognition-4.webp').default} title='Facial Recognition 4' width="70%"/>

## How Face Detection Works

Face detection sends the generated preview image to the machine learning service for processing. The service checks if it has the relevant model downloaded and downloads it if not. The image is decoded, pre-processed and passed to the face detection model (with hardware acceleration if configured). The bounding boxes and scores outputted from this model are used to crop and preprocess the image once again to be passed to a facial recognition model (also accelerated if configured). The embeddings from the recognition model, together with the bounding boxes and scores from the face detection model, are then sent back to the server to be added to the database. The embeddings in particular are indexed so they can be searched quickly during facial recognition clustering.

## How Facial Recognition Works

The facial recognition algorithm we use is derived from [DBSCAN](https://www.youtube.com/watch?v=RDZUdRSDOok), a popular clustering algorithm. It essentially treats each detected face as a point in a graph and aims to group points that are close to each other.

:::note
An important concept is whether something is a _core point_. A core point has a minimum number of points around it within a certain distance. A non-core point can only be assigned to a cluster if it can reach a core point; a non-core point can't be used to extend a cluster even if it's part of one. In Immich, the _Minimum Recognized Faces_ setting controls the threshold to be considered a core point.
:::

For each face, it looks around it to find other faces within a certain distance. Faces within this distance are considered similar, so it then checks if any of these faces are associated with a person.

If there is an existing person, it assigns the person of the most similar face to the face being processed.

If there is none, then it has to determine something from the DBSCAN algorithm: whether the face is a _core point_. If there are a certain number of similar faces (by default 3, including the face being considered), then this face is a core point. A new person is created for this face and the face is assigned to it. When other faces are processed, if they're similar to this face, they'll see that it has an associated person and can be assigned to that person.

However, if there aren't enough similar faces, no new person will be created. Instead, the face will wait for all the other faces to be processed to see if any matches that previously didn't have an associated person now do. If they do, then the face will be assigned to that person. If not, this face will be considered an outlier, such as a stranger in the background of an image.

The algorithm has some subtle differences compared to DBSCAN:

- DBSCAN doesn't have a concept of incremental clustering: it clusters all points at once. In contrast, facial recognition has to evolve as more assets are added without re-clustering everything each time.
  - The algorithm described above works within a set of queued assets. Once these faces are processed and a new round of faces are detected, the behavior will not be the same as traditional DBSCAN since it preserves the clusters (people) generated from the previous round.
    - Facial recognition tries to wait for face detection and thumbnail generation to complete before starting for this reason: the larger the set of faces in the queue, the better the results will be.
    - Re-running facial recognition on all assets afterwards does behave like DBSCAN, however.
- DBSCAN is designed for range-based searches (i.e. points within a distance), but high-dimensional vector indices are generally optimized for getting the closest K results. The recognition algorithm doesn't try to get _all_ similar faces within a distance for performance reasons. Instead, it searches for a small number of matches for each face. The end result should be very similar if not identical, but with possibly different performance characteristics.
  - Because of this, part of the recognition process is handled during a nightly job to ensure that unassigned faces with potential matches can be recognized.

:::tip
If you didn't import your assets at once or if the server was able to process jobs faster than you could upload them, it's possible that the clustering was suboptimal. If you haven't put effort into the current results, it may be worth re-running facial recognition on all assets for the best starting point. If it's too late for that, you can also manually assign a selection of unassigned faces and queue _Missing_ for Facial Recognition to help it learn and assign more faces automatically.
:::

## Configuration

Navigating to Administration > Settings > Machine Learning Settings > Facial Recognition will show the options available.

:::tip
It's better to only tweak the parameters here than to set them to something very different unless you're ready to test a variety of options. If you do need to set a parameter to a strict setting, relaxing other settings can be a good option to compensate, and vice versa.
:::

### Facial recognition model

There are a few different models available; the default is typically considered the best. On more constrained systems where the default is too intensive, you can choose a smaller model instead.

### Minimum detection score

This setting affects whether a result from the face detection model is filtered out as a false positive. It may seem tempting to set this low to detect more faces, but it can lead to false positives that are difficult to deal with and can harm facial recognition. It is strongly recommended not to go below 0.5 for this setting. Setting it to a very high number like 0.9 is also not recommended: the default is already biased toward precision, so a threshold that high leads to many undetected faces.

After changing this setting, it will only apply to new face detection jobs. To apply the new setting to all assets, you need to re-run face detection for all assets.

### Maximum recognition distance

The distance threshold described in How Facial Recognition Works. The default works well for most people, but it may be worth lowering it if the library has twins or otherwise very similar looking people. A threshold that's too low just means needing to merge duplicate people after facial recognition, whereas a threshold too high can produce unsalvageable results. It is strongly recommended not to go below 0.3 or above 0.7.

### Minimum recognized faces

The core point threshold described in How Facial Recognition Works. This setting has a few implications. First, it takes effect immediately in that people with fewer faces than this are hidden from view. Secondly, it makes clustering more robust as it prevents loosely-related faces from being linked to each other by requiring a certain level of density.

Increasing this setting is a good idea if you increase the recognition distance or reduce the minimum detection score. Setting it to 1 effectively disables the concept of core points, but can be an option if you prefer a more hands-on approach.

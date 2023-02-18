def classify_image(classifier, path: str):
    result = []
    predictions = classifier(path)

    for index, pred in enumerate(predictions):
        tags = pred['label'].replace(" ", "").split(',')
        if (index == 0):
            result = tags
        else:
            if (pred['score'] > 0.5):
                result = [result, tags]

    response = list(set(result))
    return response

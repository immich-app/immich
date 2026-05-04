type StoredTypedSearchNames = {
  personNames: Array<[string, string]>;
  tagNames: Array<[string, string]>;
};

type NameMapSink = {
  set(id: string, name: string): unknown;
};

const prefix = 'typed-search:names:';
const displayPrefix = 'typed-search:display:';

function emptyNames() {
  return {
    personNames: new Map<string, string>(),
    tagNames: new Map<string, string>(),
  };
}

export function storeTypedSearchNames(
  destination: string,
  names: { personNames: Map<string, string>; tagNames: Map<string, string> },
  displayText?: string,
) {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  const payload: StoredTypedSearchNames = {
    personNames: [...names.personNames.entries()],
    tagNames: [...names.tagNames.entries()],
  };

  sessionStorage.setItem(`${prefix}${destination}`, JSON.stringify(payload));
  const trimmedDisplayText = displayText?.trim();
  if (trimmedDisplayText) {
    sessionStorage.setItem(`${displayPrefix}${destination}`, trimmedDisplayText);
  }
}

export function getTypedSearchDisplayText(destination: string): string | undefined {
  if (typeof sessionStorage === 'undefined') {
    return undefined;
  }

  return sessionStorage.getItem(`${displayPrefix}${destination}`) ?? undefined;
}

export function consumeTypedSearchNames(destination: string) {
  if (typeof sessionStorage === 'undefined') {
    return emptyNames();
  }

  const key = `${prefix}${destination}`;
  const raw = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  if (!raw) {
    return emptyNames();
  }

  try {
    const parsed = JSON.parse(raw) as StoredTypedSearchNames;
    return {
      personNames: parsed.personNames ? new Map(parsed.personNames) : new Map<string, string>(),
      tagNames: parsed.tagNames ? new Map(parsed.tagNames) : new Map<string, string>(),
    };
  } catch {
    return emptyNames();
  }
}

export function consumeTypedSearchNamesInto(destination: string, personNames: NameMapSink, tagNames: NameMapSink) {
  const names = consumeTypedSearchNames(destination);
  for (const [id, name] of names.personNames) {
    personNames.set(id, name);
  }
  for (const [id, name] of names.tagNames) {
    tagNames.set(id, name);
  }
}

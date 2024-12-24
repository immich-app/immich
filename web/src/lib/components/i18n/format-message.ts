import type { FormatXMLElementFn, PrimitiveType } from 'intl-messageformat';
export type InterpolationValues = Record<string, PrimitiveType | FormatXMLElementFn<unknown>>;

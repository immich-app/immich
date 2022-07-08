declare function pathToRegexp (path: pathToRegexp.Path, keys?: pathToRegexp.Key[], options?: pathToRegexp.RegExpOptions & pathToRegexp.ParseOptions): RegExp;

declare namespace pathToRegexp {
  export interface RegExpOptions {
    /**
     * When `true` the regexp will be case sensitive. (default: `false`)
     */
    sensitive?: boolean;
    /**
     * When `true` the regexp allows an optional trailing delimiter to match. (default: `false`)
     */
    strict?: boolean;
    /**
     * When `true` the regexp will match to the end of the string. (default: `true`)
     */
    end?: boolean;
    /**
     * When `true` the regexp will match from the beginning of the string. (default: `true`)
     */
    start?: boolean;
    /**
     * Sets the final character for non-ending optimistic matches. (default: `/`)
     */
    delimiter?: string;
    /**
     * List of characters that can also be "end" characters.
     */
    endsWith?: string | string[];
    /**
     * List of characters to consider delimiters when parsing. (default: `undefined`, any character)
     */
    whitelist?: string | string[];
  }

  export interface ParseOptions {
    /**
     * Set the default delimiter for repeat parameters. (default: `'/'`)
     */
    delimiter?: string;
  }

  export interface TokensToFunctionOptions {
    /**
     * When `true` the regexp will be case sensitive. (default: `false`)
     */
    sensitive?: boolean;
  }

  /**
   * Parse an Express-style path into an array of tokens.
   */
  export function parse (path: string, options?: ParseOptions): Token[];

  /**
   * Create path match function from `path-to-regexp` spec.
   */
  export function match <P extends object = object> (path: string, options?: ParseOptions): MatchFunction<P>;

  /**
   * Create a path match function from `path-to-regexp` output.
   */
  export function regexpToFunction <P extends object = object> (re: RegExp, keys: Key[]): MatchFunction<P>;

  /**
   * Transforming an Express-style path into a valid path.
   */
  export function compile <P extends object = object> (path: string, options?: ParseOptions & TokensToFunctionOptions): PathFunction<P>;

  /**
   * Transform an array of tokens into a path generator function.
   */
  export function tokensToFunction <P extends object = object> (tokens: Token[], options?: TokensToFunctionOptions): PathFunction<P>;

  /**
   * Transform an array of tokens into a matching regular expression.
   */
  export function tokensToRegExp (tokens: Token[], keys?: Key[], options?: RegExpOptions): RegExp;

  export interface Key {
    name: string | number;
    prefix: string;
    delimiter: string;
    optional: boolean;
    repeat: boolean;
    pattern: string;
  }

  interface PathFunctionOptions {
    /**
     * Function for encoding input strings for output.
     */
    encode?: (value: string, token: Key) => string;
    /**
     * When `false` the function can produce an invalid (unmatched) path. (default: `true`)
     */
    validate?: boolean;
  }

  interface MatchFunctionOptions {
    /**
     * Function for decoding strings for params.
     */
    decode?: (value: string, token: Key) => string;
  }

  interface MatchResult <P extends object = object> {
    path: string;
    index: number;
    params: P;
  }

  type Match <P extends object = object> = false | MatchResult<P>;

  export type Token = string | Key;
  export type Path = string | RegExp | Array<string | RegExp>;
  export type PathFunction <P extends object = object> = (data?: P, options?: PathFunctionOptions) => string;
  export type MatchFunction <P extends object = object> = (path: string, options?: MatchFunctionOptions) => Match<P>;
}

export = pathToRegexp;
